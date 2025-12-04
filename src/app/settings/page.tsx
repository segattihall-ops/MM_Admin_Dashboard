'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, KeyRound, Bell, Shield, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SettingsPage = () => {
  return (
    <Tabs defaultValue="apiKeys">
        <CardHeader className="px-0">
            <CardTitle className="font-headline">Configurações Gerais</CardTitle>
            <CardDescription>Gerencie as configurações mestre da sua aplicação.</CardDescription>
        </CardHeader>
        <TabsList className="mb-4">
            <TabsTrigger value="apiKeys"><KeyRound className="w-4 h-4 mr-2"/> Chaves de API</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2"/> Notificações</TabsTrigger>
            <TabsTrigger value="permissions"><Shield className="w-4 h-4 mr-2"/> Permissões</TabsTrigger>
        </TabsList>
        <TabsContent value="apiKeys">
            <Card>
                <CardHeader>
                    <CardTitle>Chaves de API</CardTitle>
                    <CardDescription>Gerencie chaves de API para serviços de terceiros.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Gerenciamento de Chaves</AlertTitle>
                        <AlertDescription>
                            Suas chaves secretas são armazenadas de forma segura no servidor. Insira-as aqui para habilitar as integrações. As chaves publicáveis são seguras para serem usadas no cliente.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label htmlFor="stripe-publishable-key">Chave Publicável do Stripe</Label>
                        <Input id="stripe-publishable-key" placeholder="pk_test_..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="stripe-secret-key">Chave Secreta do Stripe</Label>
                        <Input id="stripe-secret-key" type="password" placeholder="sk_test_..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="google-maps-key">Chave de API do Google Maps</Label>
                        <Input id="google-maps-key" placeholder="AIza..." />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button><Save className="mr-2 h-4 w-4"/> Salvar Chaves</Button>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="notifications">
             <Card>
                <CardHeader>
                    <CardTitle>Configurações de Notificação</CardTitle>
                    <CardDescription>Configure como os administradores recebem alertas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="new-user-email">Email para Novo Usuário</Label>
                            <p className="text-xs text-muted-foreground">
                                Enviar um email quando um novo usuário se cadastra.
                            </p>
                        </div>
                        <Switch id="new-user-email" defaultChecked/>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="payment-failed-slack">Alerta do Slack para Falha de Pagamento</Label>
                             <p className="text-xs text-muted-foreground">
                                Publicar no canal #billing quando um pagamento falha.
                            </p>
                        </div>
                        <Switch id="payment-failed-slack"/>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button><Save className="mr-2 h-4 w-4"/> Salvar Preferências</Button>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="permissions">
             <Card>
                <CardHeader>
                    <CardTitle>Permissões de Função</CardTitle>
                    <CardDescription>Defina o que cada função de usuário pode acessar e fazer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-10">Gerenciamento de permissões em breve.</p>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
};

export default SettingsPage;
