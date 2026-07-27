import React from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Eye, FileCode } from 'lucide-react';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return {
    title: `${params.username}'s pastes`,
    description: `Public code pastes by ${params.username} on CodePaste.`,
    openGraph: {
      title: `${params.username}'s pastes - CodePaste`,
      description: `Public code pastes by ${params.username} on CodePaste.`,
      images: [{ url: '/opengraph-image.svg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/opengraph-image.svg'],
    },
  };
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname')
    .ilike('nickname', params.username)
    .limit(1);

  const profile = profiles?.[0];
  if (!profile) notFound();

  const { data: pastes } = await supabase
    .from('pastes')
    .select('slug, title, language, created_at, views')
    .eq('user_id', profile.id)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b shrink-0" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="font-bold text-base sm:text-lg tracking-tight" style={{ color: 'var(--vscode-accent)' }}>CodePaste</Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
            <Link href="/new" className="hover:text-[var(--vscode-text)] transition-colors">New Paste</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold">{profile.nickname}</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--vscode-text-secondary)' }}>
            {pastes?.length || 0} public paste{(pastes?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>

        {!pastes || pastes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>No public pastes yet.</p>
        ) : (
          <div className="space-y-2">
            {pastes.map((p: { slug: string; title: string; language: string; created_at: string; views: number }) => (
              <Link key={p.slug} href={`/p/${p.slug}`}
                className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 rounded border transition-colors no-underline"
                style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text)' }}>
                <FileCode size={14} className="hidden sm:block" style={{ color: 'var(--vscode-accent)' }} />
                <span className="flex-1 font-medium truncate text-sm sm:text-base">{p.title || 'untitled'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider shrink-0" style={{ background: 'color-mix(in srgb, var(--vscode-accent) 20%, transparent)', color: 'var(--vscode-accent)' }}>{p.language}</span>
                <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>
                  <Eye size={12} /> {p.views || 0}
                </span>
                <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>
                  <Clock size={12} /> {new Date(p.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
