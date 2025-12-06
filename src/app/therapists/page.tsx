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
import { MoreHorizontal, PlusCircle, File, Search, ChevronDown, User, Edit, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { FirebaseClientProvider, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AddTherapistSheet } from './AddTherapistSheet';
import { EditTherapistSheet } from './EditTherapistSheet';

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  'Active': 'default',
  'Pending': 'secondary',
  'Inactive': 'destructive',
};

export type Therapist = {
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
  
  const handleDeactivate = (therapistId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'therapists', therapistId);
    updateDocumentNonBlocking(docRef, { status: 'Inactive', updatedAt: serverTimestamp() });
    toast({
      title: 'Therapist Deactivation Initiated',
      description: 'The therapist status will be updated to Inactive shortly.',
    });
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
              <CardTitle className="font-headline">Therapist Management</CardTitle>
              <CardDescription>Manage therapist profiles, statuses, and information.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Therapist
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search therapists..." 
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
                <DropdownMenuItem onClick={() => setStatusFilter('All')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Inactive')}>Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleExport}>
              <File className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
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
                            <User className="mr-2 h-4 w-4" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(therapist)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                    <UserX className="mr-2 h-4 w-4" /> Deactivate
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will set the therapist's status to "Inactive". They will not be able to log in but their data will be preserved.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeactivate(therapist.id)} className="bg-destructive hover:bg-destructive/90">Deactivate</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && filteredTherapists?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No therapists found for the selected criteria.
                    </TableCell>
                </TableRow>
               )}
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

    