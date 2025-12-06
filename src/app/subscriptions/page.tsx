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
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FirebaseClientProvider, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

type Subscription = {
  id: string;
  userId: string; // Assuming we'll have a way to resolve this to a user name
  planId: string;
  status: 'Active' | 'Canceled';
  startDate: { toDate: () => Date };
  endDate: { toDate: () => Date };
  // We'll need to fetch user and plan details separately if needed.
  // For now, let's display what we have.
  userName?: string; // Placeholder
  planName?: string; // Placeholder
  amount?: string; // This would likely come from plan details
};

const statusVariantMap: { [key: string]: 'default' | 'destructive' | 'outline' } = {
  'Active': 'default',
  'Canceled': 'destructive',
};

const planVariantMap: { [key: string]: 'default' | 'secondary' } = {
    'Premium': 'default',
    'Basic': 'secondary',
};

function SubscriptionsPageContent() {
  const firestore = useFirestore();
  const subscriptionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'subscriptions'));
  }, [firestore]);

  const { data: subscriptionsData, isLoading } = useCollection<Subscription>(subscriptionsQuery);
  
  const formatDate = (date: { toDate: () => Date } | undefined) => {
    if (!date) return 'N/A';
    return date.toDate().toLocaleDateString();
  }

  // This is a placeholder. In a real app, you'd fetch user details.
  const getUserName = (userId: string) => `User ${userId.substring(0, 6)}`;
  const getPlanDetails = (planId: string) => {
      const plans: {[key: string]: {name: string, amount: string}} = {
          'premium-monthly': { name: 'Premium', amount: '$15.00/mo' },
          'basic-monthly': { name: 'Basic', amount: '$5.00/mo' },
          'free': { name: 'Free', amount: '$0.00/mo' }
      };
      return plans[planId] || { name: planId, amount: 'N/A' };
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Subscription Management</CardTitle>
        <CardDescription>Oversee all user subscriptions and payment details.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              )}
            {subscriptionsData?.map((sub) => {
              const planDetails = getPlanDetails(sub.planId);
              return (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{getUserName(sub.userId)}</TableCell>
                  <TableCell>
                    <Badge variant={planVariantMap[planDetails.name] || 'outline'}>{planDetails.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[sub.status] || 'outline'}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(sub.startDate)} - {formatDate(sub.endDate)}</TableCell>
                  <TableCell>{planDetails.amount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Invoice</DropdownMenuItem>
                        <DropdownMenuItem>Update Payment</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">Cancel Subscription</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
             {!isLoading && subscriptionsData?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        No subscriptions found.
                    </TableCell>
                </TableRow>
               )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


export default function SubscriptionsPage() {
    return (
        <FirebaseClientProvider>
            <SubscriptionsPageContent />
        </FirebaseClientProvider>
    )
}
