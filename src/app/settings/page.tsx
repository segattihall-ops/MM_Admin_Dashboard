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
            <CardTitle className="font-headline">General Settings</CardTitle>
            <CardDescription>Manage the master settings for your application.</CardDescription>
        </CardHeader>
        <TabsList className="mb-4">
            <TabsTrigger value="apiKeys"><KeyRound className="w-4 h-4 mr-2"/> API Keys</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2"/> Notifications</TabsTrigger>
            <TabsTrigger value="permissions"><Shield className="w-4 h-4 mr-2"/> Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="apiKeys">
            <Card>
                <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Manage API keys for third-party services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Key Management</AlertTitle>
                        <AlertDescription>
                            Your secret keys are securely stored on the server. Enter them here to enable integrations. Publishable keys are safe to use on the client.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label htmlFor="stripe-publishable-key">Stripe Publishable Key</Label>
                        <Input id="stripe-publishable-key" placeholder="pk_test_..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="stripe-secret-key">Stripe Secret Key</Label>
                        <Input id="stripe-secret-key" type="password" placeholder="sk_test_..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="google-maps-key">Google Maps API Key</Label>
                        <Input id="google-maps-key" placeholder="AIza..." />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button><Save className="mr-2 h-4 w-4"/> Save Keys</Button>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="notifications">
             <Card>
                <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Configure how admins receive alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="new-user-email">New User Email</Label>
                            <p className="text-xs text-muted-foreground">
                                Send an email when a new user signs up.
                            </p>
                        </div>
                        <Switch id="new-user-email" defaultChecked/>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="payment-failed-slack">Payment Failure Slack Alert</Label>
                             <p className="text-xs text-muted-foreground">
                                Post to #billing channel when a payment fails.
                            </p>
                        </div>
                        <Switch id="payment-failed-slack"/>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button><Save className="mr-2 h-4 w-4"/> Save Preferences</Button>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="permissions">
             <Card>
                <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                    <CardDescription>Define what each user role can access and do.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-10">Permission management coming soon.</p>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
};

export default SettingsPage;
