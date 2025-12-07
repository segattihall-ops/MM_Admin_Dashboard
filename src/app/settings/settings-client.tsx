'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, KeyRound, Bell, Shield, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

type Props = {
  apiKeys: Record<string, string>;
  preferences: Record<string, any>;
};

export default function SettingsClient({ apiKeys, preferences }: Props) {
  const { toast } = useToast();
  const [keys, setKeys] = useState<Record<string, string>>(apiKeys);
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({
    newUserEmail: preferences.newUserEmail ?? false,
    paymentFailedSlack: preferences.paymentFailedSlack ?? false,
  });

  const saveKeys = async () => {
    const response = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keys),
    });
    if (response.ok) {
      toast({ title: 'Keys saved' });
    } else {
      const body = await response.json().catch(() => null);
      toast({ title: 'Error saving keys', description: body?.error?.message, variant: 'destructive' });
    }
  };

  const savePreferences = async () => {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...preferences, ...notificationPrefs }),
    });
    if (response.ok) {
      toast({ title: 'Preferences saved' });
    } else {
      const body = await response.json().catch(() => null);
      toast({ title: 'Error saving preferences', description: body?.error?.message, variant: 'destructive' });
    }
  };

  return (
    <Tabs defaultValue="apiKeys">
      <CardHeader className="px-0">
        <CardTitle className="font-headline">General Settings</CardTitle>
        <CardDescription>Manage the master settings synced with Supabase.</CardDescription>
      </CardHeader>
      <TabsList className="mb-4">
        <TabsTrigger value="apiKeys">
          <KeyRound className="w-4 h-4 mr-2" /> API Keys
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="w-4 h-4 mr-2" /> Notifications
        </TabsTrigger>
        <TabsTrigger value="permissions">
          <Shield className="w-4 h-4 mr-2" /> Permissions
        </TabsTrigger>
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
              <AlertDescription>Your secret keys are stored in Supabase (admin_settings/api-keys).</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="stripe-publishable-key">Stripe Publishable Key</Label>
              <Input
                id="stripe-publishable-key"
                placeholder="pk_test_..."
                value={keys.stripePublishableKey ?? ''}
                onChange={(e) => setKeys((prev) => ({ ...prev, stripePublishableKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-secret-key">Stripe Secret Key</Label>
              <Input
                id="stripe-secret-key"
                type="password"
                placeholder="sk_test_..."
                value={keys.stripeSecretKey ?? ''}
                onChange={(e) => setKeys((prev) => ({ ...prev, stripeSecretKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-maps-key">Google Maps API Key</Label>
              <Input
                id="google-maps-key"
                placeholder="AIza..."
                value={keys.googleMapsKey ?? ''}
                onChange={(e) => setKeys((prev) => ({ ...prev, googleMapsKey: e.target.value }))}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveKeys}>
              <Save className="mr-2 h-4 w-4" /> Save Keys
            </Button>
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
                <p className="text-xs text-muted-foreground">Send an email when a new user signs up.</p>
              </div>
              <Switch
                id="new-user-email"
                checked={notificationPrefs.newUserEmail}
                onCheckedChange={(checked) => setNotificationPrefs((prev) => ({ ...prev, newUserEmail: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="payment-failed-slack">Payment Failure Slack Alert</Label>
                <p className="text-xs text-muted-foreground">Post to #billing channel when a payment fails.</p>
              </div>
              <Switch
                id="payment-failed-slack"
                checked={notificationPrefs.paymentFailedSlack}
                onCheckedChange={(checked) => setNotificationPrefs((prev) => ({ ...prev, paymentFailedSlack: checked }))}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={savePreferences}>
              <Save className="mr-2 h-4 w-4" /> Save Preferences
            </Button>
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
}
