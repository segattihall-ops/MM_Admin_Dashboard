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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { usersData } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState } from 'react';
import { FirebaseClientProvider, useAuth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';

const subscriptionVariantMap: { [key: string]: 'default' | 'secondary' | 'outline' } = {
  'Premium': 'default',
  'Basic': 'secondary',
  'Free': 'outline',
};

const addUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AddUserForm = z.infer<typeof addUserSchema>;

function AddUserSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const form = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AddUserForm) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userProfile = {
        id: user.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: '',
        dateOfBirth: '',
        address: '',
      };
      
      await setDoc(doc(firestore, 'users', user.uid), userProfile);

      toast({
        title: 'User Created',
        description: `${data.firstName} ${data.lastName} has been added.`,
      });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not create user.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New User</SheetTitle>
          <SheetDescription>Fill in the details to add a new user to the directory.</SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <SheetFooter className="pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Adding...' : 'Add User'}
                </Button>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}


const UsersPage = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  return (
    <FirebaseClientProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle className="font-headline">User Management</CardTitle>
              <CardDescription>View, edit, and manage user profiles.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead className="hidden md:table-cell">Last Active</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} data-ai-hint={user.imageHint} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={subscriptionVariantMap[user.subscription] || 'outline'}>
                      {user.subscription}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.lastActive}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddUserSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </FirebaseClientProvider>
  );
};

export default UsersPage;
