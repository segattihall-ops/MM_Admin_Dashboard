'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const flaggedPhotos = [
    { id: 'ph001', src: 'https://picsum.photos/seed/flagged1/600/400', reason: 'Low Quality', user: 'user_abc' },
];

const riskyBios = [
    { id: 'bio001', text: 'Offering services not listed. Contact me directly for more info... 😉', user: 'user_xyz', risk: 'High' },
    { id: 'bio002', text: 'Guaranteed results, the best massage you will ever have.', user: 'user_qwe', risk: 'Medium' },
];

const riskVariantMap: { [key: string]: 'destructive' | 'secondary' } = {
  'High': 'destructive',
  'Medium': 'secondary',
};

const ModerationPage = () => {
  return (
    <Tabs defaultValue="photos">
        <TabsList className="mb-4">
            <TabsTrigger value="photos">Flagged Photos</TabsTrigger>
            <TabsTrigger value="bios">Risky Bios</TabsTrigger>
        </TabsList>
        <TabsContent value="photos">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Photo Moderation</CardTitle>
                    <CardDescription>Review and approve or reject photos flagged by users or AI.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    {flaggedPhotos.length > 0 ? flaggedPhotos.map(photo => (
                        <div key={photo.id}>
                            <div className="relative aspect-video max-w-2xl mx-auto rounded-lg overflow-hidden border">
                                <Image src={photo.src} alt="Flagged content" layout="fill" objectFit="cover" data-ai-hint="blurry image" />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Reason: <Badge variant="secondary">{photo.reason}</Badge> | User: <span className="font-mono text-xs">{photo.user}</span></p>
                            <div className="mt-4 flex justify-center gap-4">
                                <Button variant="outline" size="icon"><ArrowLeft /></Button>
                                <Button variant="destructive" size="lg"><ThumbsDown className="mr-2"/> Reject</Button>
                                <Button size="lg"><ThumbsUp className="mr-2"/> Approve</Button>
                                <Button variant="outline" size="icon"><ArrowRight /></Button>
                            </div>
                        </div>
                    )) : <p className="text-muted-foreground py-10">No photos to moderate.</p>}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="bios">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Bio Moderation</CardTitle>
                    <CardDescription>Review profile bios that have been flagged for risky or inappropriate content.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {riskyBios.map(bio => (
                         <div key={bio.id} className="p-4 border rounded-lg flex justify-between items-start">
                             <div>
                                <p className="text-sm">{bio.text}</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Risk: <Badge variant={riskVariantMap[bio.risk]}>{bio.risk}</Badge> | User: <span className="font-mono text-xs">{bio.user}</span>
                                 </p>
                             </div>
                             <div className="flex gap-2">
                                <Button variant="ghost" size="sm">Ignore</Button>
                                <Button variant="destructive" size="sm">Remove Bio</Button>
                             </div>
                         </div>
                    ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
};

export default ModerationPage;
