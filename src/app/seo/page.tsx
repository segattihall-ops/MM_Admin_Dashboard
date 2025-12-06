'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Globe, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SeoPage = () => {
    return (
        <Tabs defaultValue="metadata">
            <CardHeader className="px-0">
                <CardTitle className="font-headline">SEO Dashboard</CardTitle>
                <CardDescription>Optimize your entire website for search engines.</CardDescription>
            </CardHeader>
            <TabsList className="mb-4">
                <TabsTrigger value="metadata">Metadata Editor</TabsTrigger>
                <TabsTrigger value="sitemap">Sitemap Tools</TabsTrigger>
                <TabsTrigger value="json-ld">JSON-LD Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="metadata">
                <Card>
                    <CardHeader>
                        <CardTitle>Global Metadata</CardTitle>
                        <CardDescription>Define the default metadata for your entire site.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="meta-title">Meta Title</Label>
                                <Input id="meta-title" defaultValue="MasseurMatch - Find your ideal massage therapist" />
                                <p className="text-sm text-muted-foreground">The title that appears in search results and browser tabs.</p>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="meta-description">Meta Description</Label>
                                <Textarea id="meta-description" rows={3} defaultValue="The largest directory of massage therapists. Find qualified professionals near you." />
                                <p className="text-sm text-muted-foreground">A brief summary of your page's content, used by search engines.</p>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="keywords">Keywords</Label>
                                <Input id="keywords" defaultValue="massage, masseur, therapy, wellness, relaxation" />
                                <p className="text-sm text-muted-foreground">Relevant keywords for your site, separated by commas.</p>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            <TabsContent value="sitemap">
                 <Card>
                    <CardHeader>
                        <CardTitle>Sitemap Management</CardTitle>
                        <CardDescription>Manage and view your site's sitemap.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                         <div className="grid gap-3">
                            <Label htmlFor="sitemap-url">Sitemap URL</Label>
                            <div className="flex items-center gap-2">
                                <Input id="sitemap-url" defaultValue="https://www.masseurmatch.com/sitemap.xml" readOnly />
                                 <Button variant="outline">Copy</Button>
                            </div>
                            <p className="text-sm text-muted-foreground">Use this URL to submit to search engines like Google and Bing.</p>
                        </div>
                         <Button>
                            <Globe className="mr-2 h-4 w-4" />
                            Regenerate Sitemap
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="json-ld">
                 <Card>
                    <CardHeader>
                        <CardTitle>JSON-LD Preview</CardTitle>
                        <CardDescription>See how your structured data will appear in search results.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="p-4 bg-muted rounded-lg">
                            <pre className="text-xs text-foreground whitespace-pre-wrap font-code">
{`{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "MasseurMatch",
  "url": "https://www.masseurmatch.com/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.masseurmatch.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}`}
                            </pre>
                        </div>
                        <Button variant="outline">
                            <Code className="mr-2 h-4 w-4" />
                            Test with Google's Tool
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

export default SeoPage;
