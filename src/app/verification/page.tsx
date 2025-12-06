'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, X, FileText, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FirebaseClientProvider, useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Therapist as BaseTherapist } from '@/app/therapists/page';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Therapist = BaseTherapist & {
    document_url?: string;
    card_url?: string;
    selfie_url?: string;
    signed_term_url?: string;
};

function VerificationPageContent() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const pendingTherapistsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'therapists'), where('status', '==', 'Pending'));
  }, [firestore]);

  const { data: pendingTherapists, isLoading: isLoadingTherapists } = useCollection<Therapist>(pendingTherapistsQuery);

  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Automatically select the first therapist if the list loads/changes
  useEffect(() => {
    if (pendingTherapists && pendingTherapists.length > 0) {
      // If there's no selection or the selected one is no longer in the pending list, select the first one.
      const isSelectedInList = pendingTherapists.some(t => t.id === selectedTherapist?.id);
      if (!isSelectedInList) {
        setSelectedTherapist(pendingTherapists[0]);
      }
    } else if (!isLoadingTherapists && pendingTherapists?.length === 0) {
      // If the list is loaded and empty, clear selection.
      setSelectedTherapist(null);
    }
  }, [pendingTherapists, isLoadingTherapists, selectedTherapist?.id]);

  const handleVerification = async (therapistId: string, newStatus: 'Active' | 'Rejected') => {
    if (!firestore || !auth?.currentUser) return;
    setIsUpdating(true);

    const therapistRef = doc(firestore, 'therapists', therapistId);
    const updateData: any = {
      status: newStatus,
      reviewed_at: serverTimestamp(),
      reviewed_by: auth.currentUser.uid,
    };
    
    // For now, we don't have a way to input a rejection reason, so we'll leave it out.
    // if (newStatus === 'Rejected') {
    //   updateData.rejection_reason = '...'; 
    // }

    try {
      await updateDoc(therapistRef, updateData);
      toast({
        title: 'Verification Complete',
        description: `The therapist has been ${newStatus === 'Active' ? 'approved' : 'rejected'}.`,
      });
      // The useEffect will handle selecting the next therapist
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Error',
        description: error.message || 'Could not update therapist status.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="font-headline">Verification Queue</CardTitle>
          <CardDescription>{isLoadingTherapists ? 'Loading...' : `${pendingTherapists?.length || 0} Therapists pending`}</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col gap-2">
                {isLoadingTherapists && (
                  <>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </>
                )}
                {pendingTherapists?.map(therapist => (
                    <Button 
                      key={therapist.id}
                      variant="ghost" 
                      className={`w-full justify-start ${selectedTherapist?.id === therapist.id ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedTherapist(therapist)}
                    >
                        {therapist.full_name}
                    </Button>
                ))}
                {!isLoadingTherapists && pendingTherapists?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending therapists.</p>
                )}
           </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        {selectedTherapist ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-7 w-7 md:hidden" onClick={() => setSelectedTherapist(null)}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                  </Button>
                <div>
                    <CardTitle className="font-headline">Verify: {selectedTherapist.full_name}</CardTitle>
                    <CardDescription>Review the documents and approve or reject.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-4">Checklist</h3>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="id-check" checked={!!selectedTherapist.document_url} disabled />
                            <Label htmlFor="id-check">Identity Verification</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="license-check" checked={!!selectedTherapist.card_url} disabled />
                            <Label htmlFor="license-check">License Verification</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="background-check" checked={!!selectedTherapist.selfie_url} disabled />
                            <Label htmlFor="background-check">Background Check (Selfie)</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="terms-check" checked={!!selectedTherapist.signed_term_url} disabled />
                            <Label htmlFor="terms-check">Signed Term</Label>
                        </div>
                    </div>
                     <div className="mt-6 flex gap-2">
                        <Button onClick={() => handleVerification(selectedTherapist.id, 'Active')} disabled={isUpdating}>
                          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                           Approve
                        </Button>
                        <Button variant="destructive" onClick={() => handleVerification(selectedTherapist.id, 'Rejected')} disabled={isUpdating}>
                           {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                           Reject
                        </Button>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-4">Document Viewer</h3>
                    <Card className="h-[400px]">
                        <CardHeader className="flex flex-row items-center justify-between p-2 border-b">
                            <p className="text-sm font-medium">massage_license.pdf</p>
                            <FileText className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <ScrollArea className="h-[340px]">
                            <CardContent className="p-4">
                               <p className="text-sm text-center text-muted-foreground py-20">PDF viewer coming soon.</p>
                            </CardContent>
                        </ScrollArea>
                    </Card>
                </div>
            </CardContent>
          </>
        ) : (
           <CardContent className="flex items-center justify-center h-full min-h-[500px]">
                <p className="text-muted-foreground">Select a therapist to start verification.</p>
           </CardContent>
        )}
      </Card>
    </div>
  );
};

export default function VerificationPage() {
    return (
        <FirebaseClientProvider>
            <VerificationPageContent />
        </FirebaseClientProvider>
    );
}
