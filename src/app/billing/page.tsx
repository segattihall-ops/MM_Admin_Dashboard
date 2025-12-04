'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Bar, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const revenueData = [
  { date: '01/24', revenue: 4000 }, { date: '02/24', revenue: 3000 }, { date: '03/24', revenue: 5000 },
  { date: '04/24', revenue: 4500 }, { date: '05/24', revenue: 6000 }, { date: '06/24', revenue: 5500 }
];

const subscriptionsData = [
  { date: '01/24', count: 200 }, { date: '02/24', count: 210 }, { date: '03/24', count: 250 },
  { date: '04/24', count: 270 }, { date: '05/24', count: 300 }, { date: '06/24', count: 320 }
];

const logsData = [
  { id: 'evt_1', type: 'charge.succeeded', amount: '$59.00', date: '2024-07-21 14:30' },
  { id: 'evt_2', type: 'customer.subscription.created', details: 'user_123', date: '2024-07-21 14:29' },
  { id: 'evt_3', type: 'charge.failed', amount: '$59.00', reason: 'Insufficient funds', date: '2024-07-20 10:05' },
  { id: 'evt_4', type: 'payout.paid', amount: '$2,345.67', date: '2024-07-20 09:00' },
];

const BillingPage = () => {
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
                         <ChartContainer config={{ revenue: { label: 'Revenue', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                            <BarChart data={revenueData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Novas Assinaturas</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{ count: { label: 'Subscriptions', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                            <LineChart data={subscriptionsData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Line type="monotone" dataKey="count" stroke="var(--color-count)" />
                            </LineChart>
                        </ChartContainer>
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
                   <p className="text-center text-muted-foreground py-10">Tabela de assinaturas em breve.</p>
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tipo de Evento</TableHead>
                                <TableHead>Detalhes</TableHead>
                                <TableHead>Data</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logsData.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <Badge variant={log.type.includes('fail') ? 'destructive' : 'secondary'}>{log.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs">{log.amount || log.details || log.reason}</span>
                                    </TableCell>
                                    <TableCell>{log.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
    </>
  );
};

export default BillingPage;
