'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, File, Search, ChevronDown, User, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FirebaseClientProvider, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  'Active': 'default',
  'Pending': 'secondary',
  'Inactive': 'destructive',
};

const addTherapistSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AddTherapistForm = z.infer<typeof addTherapistSchema>;

const editTherapistSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    status: z.enum(['Active', 'Pending', 'Inactive']),
    plan: z.string().min(1, 'Plan is required'),
    planName: z.string().min(1, 'Plan name is required'),
    subscriptionStatus: z.string().min(1, 'Subscription status is required'),
});

type EditTherapistForm = z.infer<typeof editTherapistSchema>;
type Therapist = {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    slug?: string;
    phone?: string;
    status: 'Active' | 'Pending' | 'Inactive';
    plan: string;
    plan_name: string;
    subscription_status: string;
    created_at: any;
    updated_at: any;
};


function AddTherapistSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<AddTherapistForm>({
    resolver: zodResolver(addTherapistSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AddTherapistForm) => {
    if (!auth || !firestore) return;
    try {
      // This is a temporary auth instance for user creation, it won't sign in the admin.
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const therapistProfile = {
        user_id: user.uid,
        full_name: data.fullName,
        email: data.email,
        status: 'Pending',
        plan: 'free',
        plan_name: 'Free Tier',
        subscription_status: 'Active',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      
      await setDoc(doc(firestore, 'therapists', user.uid), therapistProfile);

      toast({
        title: 'Terapeuta Adicionado',
        description: `${data.fullName} foi adicionado com sucesso.`,
      });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Error creating therapist:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar terapeuta.",
        description: error.message || "Não foi possível criar o terapeuta.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adicionar Novo Terapeuta</SheetTitle>
          <SheetDescription>Preencha os detalhes para adicionar um novo terapeuta.</SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <SheetFooter className="pt-4">
                 <SheetClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Adicionando...' : 'Adicionar Terapeuta'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}


function EditTherapistSheet({ open, onOpenChange, therapist }: { open: boolean, onOpenChange: (open: boolean) => void, therapist: Therapist | null }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<EditTherapistForm>({
    resolver: zodResolver(editTherapistSchema),
    values: {
        fullName: therapist?.full_name || '',
        email: therapist?.email || '',
        status: therapist?.status || 'Pending',
        plan: therapist?.plan || '',
        planName: therapist?.plan_name || '',
        subscriptionStatus: therapist?.subscription_status || '',
    }
  });

  const onSubmit = async (data: EditTherapistForm) => {
    if (!firestore || !therapist) return;
    try {
      const therapistRef = doc(firestore, 'therapists', therapist.id);
      await updateDoc(therapistRef, {
        full_name: data.fullName,
        email: data.email,
        status: data.status,
        plan: data.plan,
        plan_name: data.planName,
        subscription_status: data.subscriptionStatus,
        updated_at: serverTimestamp(),
      });

      toast({
        title: 'Terapeuta Atualizado',
        description: 'As informações do terapeuta foram atualizadas com sucesso.',
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating therapist:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar.",
        description: error.message || "Não foi possível atualizar o terapeuta.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Terapeuta</SheetTitle>
          <SheetDescription>Atualize os detalhes do terapeuta.</SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Ativo</SelectItem>
                      <SelectItem value="Pending">Pendente</SelectItem>
                      <SelectItem value="Inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="plan" render={({ field }) => (<FormItem><FormLabel>Plano (ID)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="planName" render={({ field }) => (<FormItem><FormLabel>Nome do Plano</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="subscriptionStatus" render={({ field }) => (<FormItem><FormLabel>Status da Assinatura</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />

              <SheetFooter className="pt-4">
                 <SheetClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TherapistsPageContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const therapistsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'therapists') : null, [firestore]);
  const { data: therapists, isLoading } = useCollection<Therapist>(therapistsQuery);
  const { toast } = useToast();
  
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleEdit = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setIsEditSheetOpen(true);
  };
  
  const handleDelete = async (therapistId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'therapists', therapistId));
      toast({
        title: 'Terapeuta Excluído',
        description: 'O terapeuta foi removido com sucesso.',
      });
    } catch (error: any) {
      console.error("Error deleting therapist:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir.",
        description: error.message || "Não foi possível remover o terapeuta.",
      });
    }
  };

  const handleExport = () => {
    if (!filteredTherapists) return;
    const headers = ['full_name', 'email', 'plan', 'status', 'created_at', 'updated_at'];
    const csvContent = [
      headers.join(','),
      ...filteredTherapists.map(t => [
        `"${t.full_name}"`,
        t.email,
        t.plan,
        t.status,
        t.created_at?.toDate()?.toISOString() || '',
        t.updated_at?.toDate()?.toISOString() || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      link.href = URL.createObjectURL(blob);
      link.download = 'therapists.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const filteredTherapists = useMemo(() => {
    return therapists?.filter(therapist => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' ||
            therapist.full_name.toLowerCase().includes(searchLower) ||
            therapist.email.toLowerCase().includes(searchLower) ||
            therapist.slug?.toLowerCase().includes(searchLower) ||
            therapist.phone?.includes(searchTerm);

        const matchesStatus = statusFilter === 'All' || therapist.status === statusFilter;

        return matchesSearch && matchesStatus;
    });
  }, [therapists, searchTerm, statusFilter]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline">Gestão de Terapeutas</CardTitle>
              <CardDescription>Gerencie perfis, status e informações de terapeutas.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Terapeuta
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar terapeutas..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-1">
                  Status <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('All')}>Todos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Inactive')}>Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleExport}>
              <File className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                </TableRow>
              )}
              {filteredTherapists?.map((therapist) => (
                <TableRow key={therapist.id}>
                  <TableCell className="font-medium">{therapist.full_name}</TableCell>
                  <TableCell>{therapist.email}</TableCell>
                  <TableCell>{therapist.plan_name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[therapist.status] || 'outline'}>
                      {therapist.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/therapists/${therapist.id}`)}>
                            <User className="mr-2 h-4 w-4" /> Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(therapist)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente a conta do terapeuta.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(therapist.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddTherapistSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
      {selectedTherapist && <EditTherapistSheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen} therapist={selectedTherapist} />}
    </>
  );
};

const TherapistsPage = () => (
    <FirebaseClientProvider>
        <TherapistsPageContent />
    </FirebaseClientProvider>
);

export default TherapistsPage;

    