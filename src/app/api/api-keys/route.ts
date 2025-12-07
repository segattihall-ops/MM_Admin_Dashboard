import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { logAdminAction } from '@/lib/supabase/crud';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SETTINGS_TABLE = 'settings';
const API_KEYS_ID = 'api-keys';

export async function GET() {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from(SETTINGS_TABLE).select('*').eq('id', API_KEYS_ID).maybeSingle();
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
    .upsert({ id: API_KEYS_ID, metadata: payload })
    .select()
    .maybeSingle();

  if (error) return failure(error.message, 400);
  await logAdminAction('update_api_keys', admin.id, { keys: Object.keys(payload || {}) });
  return success(data);
}
