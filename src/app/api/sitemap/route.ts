import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { listTherapists, logAdminAction } from '@/lib/supabase/crud';

export async function POST(request: Request) {
  const { admin } = await requireAdmin();
  const baseUrl = new URL(request.url).origin;
  const { data } = await listTherapists();

  const urlEntries =
    data?.map(
      (therapist) =>
        `<url><loc>${baseUrl}/therapists/${therapist.slug ?? therapist.id}</loc><changefreq>weekly</changefreq></url>`
    ) ?? [];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

  await logAdminAction('generate_sitemap', admin.id, { count: data?.length ?? 0 });
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
