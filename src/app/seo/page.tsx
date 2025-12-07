import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Globe, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listTherapists } from '@/lib/supabase/crud';
import { PageHeader } from '@/components/layout/page-header';

export default async function SeoPage() {
  const { data: therapists } = await listTherapists();
  const sitemapPreview = therapists?.slice(0, 5) ?? [];

  return (
    <div>
      <PageHeader
        title="SEO Dashboard"
        description="Optimize your entire website for search engines with server-fetched data."
      />
      <Tabs defaultValue="metadata">
        <TabsList className="mb-4">
          <TabsTrigger value="metadata">Metadata Editor</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap Tools</TabsTrigger>
          <TabsTrigger value="json-ld">JSON-LD Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Global Metadata</CardTitle>
              <CardDescription>Define the default metadata stored via Supabase.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input id="meta-title" name="title" defaultValue="MasseurMatch - Find your ideal massage therapist" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="meta-description">Meta Description</Label>
                  <Textarea id="meta-description" name="description" rows={3} defaultValue="The largest directory of massage therapists. Find qualified professionals near you." />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input id="keywords" name="keywords" defaultValue="massage, masseur, therapy, wellness, relaxation" />
                </div>
              </form>
            </CardContent>
            <CardContent className="border-t px-6 py-4">
              <form action="/api/settings" method="post">
                <Input type="hidden" name="seo" value="true" />
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sitemap">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Management</CardTitle>
              <CardDescription>Manage and view your site's sitemap based on live therapist data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="sitemap-url">Sitemap URL</Label>
                <Input id="sitemap-url" defaultValue="https://www.masseurmatch.com/sitemap.xml" readOnly />
              </div>
              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">Preview (first 5 therapists):</p>
                <ul className="text-sm text-muted-foreground list-disc pl-4">
                  {sitemapPreview.map((t) => (
                    <li key={t.id}>
                      /therapists/{t.slug ?? t.id} ({t.status ?? 'unknown'})
                    </li>
                  ))}
                  {sitemapPreview.length === 0 && <li>No therapist records found.</li>}
                </ul>
              </div>
              <form action="/api/sitemap" method="post" target="_blank">
                <Button type="submit">
                  <Globe className="mr-2 h-4 w-4" />
                  Regenerate Sitemap
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="json-ld">
          <Card>
            <CardHeader>
              <CardTitle>JSON-LD Preview</CardTitle>
              <CardDescription>Structured data sample powered by Supabase counts.</CardDescription>
            </CardHeader>
          </Card>
          <CardContent className="grid gap-6">
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-code">{`{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "MasseurMatch",
  "url": "https://www.masseurmatch.com/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.masseurmatch.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "numberOfTherapists": ${therapists?.length ?? 0}
}`}</pre>
            </div>
            <Button variant="outline">
              <Code className="mr-2 h-4 w-4" />
              Test with Google's Tool
            </Button>
          </CardContent>
        </TabsContent>
      </Tabs>
    </div>
  );
}
