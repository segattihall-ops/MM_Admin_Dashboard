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
import type { Therapist } from '@/app/therapists/page';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
    if (!isLoadingTherapists && pendingTherapists) {
      if(pendingTherapists.length > 0 && !selectedTherapist) {
        setSelectedTherapist(pendingTherapists[0]);
      } else if (pendingTherapists.length === 0) {
        setSelectedTherapist(null);
      }
    }
  }, [pendingTherapists, isLoadingTherapists, selectedTherapist]);

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
        title: 'Verificação Completa',
        description: `O terapeuta foi ${newStatus === 'Active' ? 'aprovado' : 'rejeitado'}.`,
      });
      // After update, select the next therapist in the list or null if none left
      const updatedList = pendingTherapists?.filter(t => t.id !== therapistId) || [];
      setSelectedTherapist(updatedList.length > 0 ? updatedList[0] : null);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro na verificação',
        description: error.message || 'Não foi possível atualizar o status do terapeuta.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="font-headline">Fila de Verificação</CardTitle>
          <CardDescription>{isLoadingTherapists ? 'Carregando...' : `${pendingTherapists?.length || 0} Terapeutas pendentes`}</CardDescription>
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
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum terapeuta pendente.</p>
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
                    <span className="sr-only">Voltar</span>
                  </Button>
                <div>
                    <CardTitle className="font-headline">Verificar: {selectedTherapist.full_name}</CardTitle>
                    <CardDescription>Revise os documentos e aprove ou rejeite.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-4">Checklist</h3>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="id-check" checked={!!selectedTherapist.document_url} disabled />
                            <Label htmlFor="id-check">Verificação de identidade</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="license-check" checked={!!selectedTherapist.card_url} disabled />
                            <Label htmlFor="license-check">Verificação de licença</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="background-check" checked={!!selectedTherapist.selfie_url} disabled />
                            <Label htmlFor="background-check">Verificação de antecedentes (Selfie)</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="terms-check" checked={!!selectedTherapist.signed_term_url} disabled />
                            <Label htmlFor="terms-check">Termo Assinado</Label>
                        </div>
                    </div>
                     <div className="mt-6 flex gap-2">
                        <Button onClick={() => handleVerification(selectedTherapist.id, 'Active')} disabled={isUpdating}>
                          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                           Aprovar
                        </Button>
                        <Button variant="destructive" onClick={() => handleVerification(selectedTherapist.id, 'Rejected')} disabled={isUpdating}>
                           {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                           Rejeitar
                        </Button>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-4">Visualizador de Documentos</h3>
                    <Card className="h-[400px]">
                        <CardHeader className="flex flex-row items-center justify-between p-2 border-b">
                            <p className="text-sm font-medium">licenca_massagem.pdf</p>
                            <FileText className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <ScrollArea className="h-[340px]">
                            <CardContent className="p-4">
                               <p className="text-sm text-center text-muted-foreground py-20">Visualizador de PDF em breve.</p>
                            </CardContent>
                        </ScrollArea>
                    </Card>
                </div>
            </CardContent>
          </>
        ) : (
           <CardContent className="flex items-center justify-center h-full min-h-[500px]">
                <p className="text-muted-foreground">Selecione um terapeuta para iniciar a verificação.</p>
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
