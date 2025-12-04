'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Bar, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirebaseClientProvider, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const revenueData: any[] = [];
const subscriptionsChartData: any[] = [];

type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: 'Active' | 'Canceled';
  startDate: { toDate: () => Date };
  endDate: { toDate: () => Date };
};

const statusVariantMap: { [key: string]: 'default' | 'destructive' | 'outline' } = {
  'Active': 'default',
  'Canceled': 'destructive',
};

const planVariantMap: { [key: string]: 'default' | 'secondary' } = {
    'Premium': 'default',
    'Basic': 'secondary',
};

function SubscriptionsTable() {
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
                  <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
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
                        Nenhuma assinatura encontrada.
                    </TableCell>
                </TableRow>
               )}
          </TableBody>
        </Table>
    )
}

const BillingPageContent = () => {
  return (
    <>
    <Alert className="mb-6">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Modo de Desenvolvimento</AlertTitle>
        <AlertDescription>
          Esta página está usando dados de exemplo. Para conectar sua conta do Stripe, insira suas chaves de API na <Button variant="link" className="p-0 h-auto"><a href="/settings">página de configurações</a></Button>.
        </AlertDescription>
      </Alert>
    <Tabs defaultValue="overview">
        <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="logs">Logs de Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
             <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Receita (Últimos 6 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {revenueData.length > 0 ? (
                            <ChartContainer config={{ revenue: { label: 'Revenue', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                                <BarChart data={revenueData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                         ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Dados de receita aparecerão aqui.
                            </div>
                         )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Novas Assinaturas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {subscriptionsChartData.length > 0 ? (
                            <ChartContainer config={{ count: { label: 'Subscriptions', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                                <LineChart data={subscriptionsChartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="count" stroke="var(--color-count)" />
                                </LineChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Dados de novas assinaturas aparecerão aqui.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="subscriptions">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Gerenciamento de Assinaturas</CardTitle>
                    <CardDescription>Visão geral de todas as assinaturas ativas e passadas.</CardDescription>
                </CardHeader>
                <CardContent>
                   <SubscriptionsTable />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="logs">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Logs de Eventos do Stripe</CardTitle>
                    <CardDescription>Monitore todos os eventos de webhook do Stripe.</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-center text-muted-foreground py-10">Os logs de eventos do Stripe aparecerão aqui após a configuração.</p>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
    </>
  );
};

export default function BillingPage() {
    return (
        <FirebaseClientProvider>
            <BillingPageContent />
        </FirebaseClientProvider>
    );
}
