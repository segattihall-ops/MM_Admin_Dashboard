'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Upload, Eye } from 'lucide-react';

const legalDocs = [
  { id: 'tos-v2.1', name: 'Terms of Service', version: 'v2.1', status: 'Published', lastUpdated: '2024-06-15' },
  { id: 'privacy-v1.5', name: 'Privacy Policy', version: 'v1.5', status: 'Published', lastUpdated: '2024-06-15' },
  { id: 'tos-v2.2-draft', name: 'Terms of Service', version: 'v2.2', status: 'Draft', lastUpdated: '2024-07-20' },
];

const LegalPage = () => {
  return (
    <Card>
        <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="font-headline">Legal Versioning</CardTitle>
                    <CardDescription>Manage and publish your legal documents.</CardDescription>
                </div>
                <Button size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Version
                </Button>
            </div>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {legalDocs.map(doc => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.name}</TableCell>
                            <TableCell>{doc.version}</TableCell>
                            <TableCell>
                                <Badge variant={doc.status === 'Published' ? 'default' : 'secondary'}>{doc.status}</Badge>
                            </TableCell>
                            <TableCell>{doc.lastUpdated}</TableCell>
                            <TableCell className="flex gap-2">
                                <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4" /> View</Button>
                                {doc.status === 'Draft' && <Button size="sm">Publish</Button>}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
};

export default LegalPage;
