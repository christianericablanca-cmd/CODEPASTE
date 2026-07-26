import React from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { PasteViewer } from './paste-viewer';
import type { Metadata } from 'next';

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
  if (!paste) return { title: 'Not Found - CodePaste' };
  return { title: `${paste.title || 'Untitled'} - CodePaste` };
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

  await supabase.from('pastes').update({ views: (paste.views || 0) + 1 }).eq('id', paste.id);

  return <PasteViewer paste={paste} isOwner={isOwner} />;
}
