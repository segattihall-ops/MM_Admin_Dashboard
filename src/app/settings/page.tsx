import SettingsClient from './settings-client';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function SettingsPage() {
  const { data: apiKeysRow } = await supabaseAdmin.from('settings').select('metadata').eq('id', 'api-keys').maybeSingle();
  const { data: preferencesRow } = await supabaseAdmin.from('settings').select('metadata').eq('id', 'admin-settings').maybeSingle();

  return <SettingsClient apiKeys={(apiKeysRow as any)?.metadata ?? {}} preferences={(preferencesRow as any)?.metadata ?? {}} />;
}
