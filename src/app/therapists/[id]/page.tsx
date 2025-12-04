'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, FirebaseClientProvider, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

type TherapistProfile = {
    full_name: string;
    email: string;
    status: string;
    plan_name: string;
    subscription_status: string;
    updated_at: {
        toDate: () => Date;
    };
};

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  'Active': 'default',
  'Pending': 'secondary',
  'Inactive': 'destructive',
};

const subscriptionStatusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  'Active': 'default',
  'Canceled': 'destructive',
};

function TherapistProfilePageContent() {
    const { id } = useParams();
    const firestore = useFirestore();
    const therapistId = Array.isArray(id) ? id[0] : id;

    const therapistDocRef = useMemoFirebase(() => {
        if (!firestore || !therapistId) return null;
        return doc(firestore, 'therapists', therapistId);
    }, [firestore, therapistId]);

    const { data: therapist, isLoading, error } = useDoc<TherapistProfile>(therapistDocRef);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                     <Skeleton className="h-8 w-1/2" />
                     <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <Skeleton className="h-10" />
                         <Skeleton className="h-10" />
                         <Skeleton className="h-10" />
                         <Skeleton className="h-10" />
                    </div>
                </CardContent>
             </Card>
        );
    }

    if (error) {
        return <p>Error: {error.message}</p>;
    }

    if (!therapist) {
        return <p>Therapist not found.</p>;
    }

    return (
        <div className="space-y-6">
             <Button variant="outline" asChild>
                <Link href="/therapists">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Terapeutas
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={`https://picsum.photos/seed/${therapist.id}/100/100`} alt={therapist.full_name} />
                            <AvatarFallback>{therapist.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-3xl font-headline">{therapist.full_name}</CardTitle>
                            <CardDescription className="text-lg">{therapist.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-muted-foreground">Status do Perfil</p>
                            <p className="font-semibold"><Badge variant={statusVariantMap[therapist.status]}>{therapist.status}</Badge></p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-muted-foreground">Plano</p>
                            <p className="font-semibold">{therapist.plan_name}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-muted-foreground">Status da Assinatura</p>
                            <p className="font-semibold"><Badge variant={subscriptionStatusVariantMap[therapist.subscription_status]}>{therapist.subscription_status}</Badge></p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-muted-foreground">Última Atividade</p>
                            <p className="font-semibold">{therapist.updated_at ? therapist.updated_at.toDate().toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


export default function TherapistProfilePage() {
    return (
        <FirebaseClientProvider>
            <TherapistProfilePageContent />
        </FirebaseClientProvider>
    );
}

    