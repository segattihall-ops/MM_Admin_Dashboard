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
  { id: 'TKT-001', subject: 'Payment Issue', user: 'user_123', status: 'Open', priority: 'High', agent: 'Admin', category: 'Billing' },
  { id: 'TKT-002', subject: 'Can\'t log in', user: 'user_456', status: 'In Progress', priority: 'Medium', agent: 'Support Team', category: 'Questions' },
  { id: 'TKT-003', subject: 'How do I update my profile?', user: 'user_789', status: 'Closed', priority: 'Low', agent: 'Admin', category: 'Questions' },
  { id: 'TKT-004', subject: 'Inappropriate therapist behavior', user: 'user_abc', status: 'Open', priority: 'High', agent: 'Moderation', category: 'Reports' },
  { id: 'TKT-005', subject: 'Duplicate charge on invoice', user: 'user_def', status: 'In Progress', priority: 'High', agent: 'Admin', category: 'Billing' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'outline' } = {
  'Open': 'default', 'In Progress': 'secondary', 'Closed': 'outline',
};
const priorityVariant: { [key: string]: 'destructive' | 'default' | 'secondary' } = {
  'High': 'destructive', 'Medium': 'default', 'Low': 'secondary',
};

const categoryVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    'Billing': 'default',
    'Questions': 'secondary',
    'Reports': 'destructive',
};

const SupportPage = () => {
  const [filter, setFilter] = useState('All');

  const filteredTickets = ticketsData.filter(ticket => {
    if (filter === 'All') return true;
    return ticket.category === filter;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">User Support Center</CardTitle>
        <CardDescription>Manage support tickets, assign agents, and resolve user issues.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="All" onValueChange={setFilter} className="mb-4">
          <TabsList>
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Billing">Billing</TabsTrigger>
            <TabsTrigger value="Questions">Questions</TabsTrigger>
            <TabsTrigger value="Reports">Reports</TabsTrigger>
          </TabsList>
        </Tabs>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
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
                        <DropdownMenuItem>View Ticket</DropdownMenuItem>
                        <DropdownMenuItem>Assign Agent</DropdownMenuItem>
                         <DropdownMenuItem>Escalate</DropdownMenuItem>
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
