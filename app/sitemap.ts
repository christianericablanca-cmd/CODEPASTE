import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function sitemap() {
  const siteUrl = 'https://codepaste.app';

  const { data: pastes } = await supabase
    .from('pastes')
    .select('slug, updated_at')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
    .limit(50000);

  const pasteUrls = (pastes || []).map((p: { slug: string; updated_at: string }) => ({
    url: `${siteUrl}/p/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${siteUrl}/new`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/my-pastes`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/api-docs`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    ...pasteUrls,
  ];
}
