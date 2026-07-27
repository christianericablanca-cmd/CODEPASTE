import React from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { PasteViewer } from './paste-viewer';
import { serverDecryptKey } from '@/lib/server-crypto';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

async function getPaste(slug: string) {
  const { data } = await supabase
    .from('pastes')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const paste = await getPaste(params.slug);
  if (!paste) return { title: 'Not Found' };
  const title = paste.title || 'Untitled';
  return {
    title,
    description: `View ${title} — a ${paste.language} paste on CodePaste`,
    openGraph: {
      title: `${title} - CodePaste`,
      description: `View ${title} — a ${paste.language} paste on CodePaste`,
      url: `https://codepaste.app/p/${params.slug}`,
      images: [{ url: '/opengraph-image.svg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - CodePaste`,
      description: `View ${title} — a ${paste.language} paste on CodePaste`,
      images: ['/opengraph-image.svg'],
    },
  };
}

export default async function PastePage({ params }: PageProps) {
  const paste = await getPaste(params.slug);
  if (!paste) notFound();

  let isOwner = false;
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    isOwner = !!user && user.id === paste.user_id;

    if (paste.visibility === 'private' && !isOwner) {
      redirect('/auth/login');
    }
  } catch {
    if (paste.visibility === 'private') {
      redirect('/auth/login');
    }
  }

  let ownerKey: string | null = null;
  if (paste.owner_key_enc) {
    try {
      ownerKey = serverDecryptKey(paste.owner_key_enc);
    } catch {}
  }

  await supabase.from('pastes').update({ views: (paste.views || 0) + 1 }).eq('id', paste.id);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'CodePaste', item: 'https://codepaste.app' },
      { '@type': 'ListItem', position: 2, name: paste.title || 'Untitled', item: `https://codepaste.app/p/${params.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <PasteViewer paste={paste} isOwner={isOwner} ownerKey={ownerKey} />
    </>
  );
}
