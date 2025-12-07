import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { logAdminAction } from '@/lib/supabase/crud';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SETTINGS_TABLE = 'settings';
const SETTINGS_ID = 'admin-settings';

export async function GET() {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from(SETTINGS_TABLE).select('*').eq('id', SETTINGS_ID).maybeSingle();
  if (error) return failure(error.message, 500);
  return success(data ?? {});
}

export async function POST(request: Request) {
  const { admin } = await requireAdmin();
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries());
  }
  const { data, error } = await supabaseAdmin
    .from(SETTINGS_TABLE)
    .upsert({ id: SETTINGS_ID, metadata: payload })
    .select()
    .maybeSingle();

  if (error) return failure(error.message, 400);
  await logAdminAction('save_settings', admin.id, { keys: Object.keys(payload || {}) });
  return success(data);
}
