'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ticketsData = [
  { id: 'TKT-001', subject: 'Problema de pagamento', user: 'user_123', status: 'Open', priority: 'High', agent: 'Admin', category: 'Faturamento' },
  { id: 'TKT-002', subject: 'Não consigo fazer login', user: 'user_456', status: 'In Progress', priority: 'Medium', agent: 'Support Team', category: 'Dúvidas' },
  { id: 'TKT-003', subject: 'Como atualizo meu perfil?', user: 'user_789', status: 'Closed', priority: 'Low', agent: 'Admin', category: 'Dúvidas' },
  { id: 'TKT-004', subject: 'Comportamento inadequado do terapeuta', user: 'user_abc', status: 'Open', priority: 'High', agent: 'Moderation', category: 'Denúncias' },
  { id: 'TKT-005', subject: 'Cobrança duplicada na fatura', user: 'user_def', status: 'In Progress', priority: 'High', agent: 'Admin', category: 'Faturamento' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'outline' } = {
  'Open': 'default', 'In Progress': 'secondary', 'Closed': 'outline',
};
const priorityVariant: { [key: string]: 'destructive' | 'default' | 'secondary' } = {
  'High': 'destructive', 'Medium': 'default', 'Low': 'secondary',
};

const categoryVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    'Faturamento': 'default',
    'Dúvidas': 'secondary',
    'Denúncias': 'destructive',
};

const SupportPage = () => {
  const [filter, setFilter] = useState('Todos');

  const filteredTickets = ticketsData.filter(ticket => {
    if (filter === 'Todos') return true;
    return ticket.category === filter;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Central de Suporte ao Usuário</CardTitle>
        <CardDescription>Gerencie tickets de suporte, atribua agentes e resolva problemas dos usuários.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Todos" onValueChange={setFilter} className="mb-4">
          <TabsList>
            <TabsTrigger value="Todos">Todos</TabsTrigger>
            <TabsTrigger value="Faturamento">Faturamento</TabsTrigger>
            <TabsTrigger value="Dúvidas">Dúvidas</TabsTrigger>
            <TabsTrigger value="Denúncias">Denúncias</TabsTrigger>
          </TabsList>
        </Tabs>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assunto</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Agente</TableHead>
              <TableHead><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map(ticket => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell><span className="font-mono text-xs">{ticket.user}</span></TableCell>
                <TableCell>
                    <Badge variant={categoryVariant[ticket.category as keyof typeof categoryVariant] || 'outline'}>
                        {ticket.category}
                    </Badge>
                </TableCell>
                <TableCell><Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge></TableCell>
                <TableCell><Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge></TableCell>
                <TableCell>{ticket.agent}</TableCell>
                <TableCell>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Ticket</DropdownMenuItem>
                        <DropdownMenuItem>Atribuir Agente</DropdownMenuItem>
                         <DropdownMenuItem>Escalonar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SupportPage;
