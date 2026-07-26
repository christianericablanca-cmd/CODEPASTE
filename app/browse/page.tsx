import React from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Clock, Eye, FileCode } from 'lucide-react';
import { AuthStatus } from '@/components/auth-status';

interface Paste {
  slug: string;
  title: string;
  language: string;
  created_at: string;
  views: number;
}

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  const { data: pastes } = await supabase
    .from('pastes')
    .select('slug, title, language, created_at, views')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <header className="flex items-center justify-between px-6 py-3 border-b shrink-0" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-lg tracking-tight" style={{ color: 'var(--vscode-accent)' }}>CodePaste</Link>
          <nav className="flex items-center gap-6 text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
            <Link href="/new" className="hover:text-[var(--vscode-text)] transition-colors">New Paste</Link>
            <Link href="/browse" className="hover:text-[var(--vscode-text)] transition-colors">Browse</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <AuthStatus />
          <Link href="/new" className="btn-vscode flex items-center gap-2 text-sm no-underline">
            <FileCode size={14} /> Create Paste
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Recent Public Pastes</h1>
        {!pastes || pastes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>No public pastes yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {pastes.map((p: Paste) => (
              <Link key={p.slug} href={`/p/${p.slug}`}
                className="flex items-center gap-4 px-4 py-3 rounded border transition-colors no-underline"
                style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text)' }}>
                <FileCode size={16} style={{ color: 'var(--vscode-accent)' }} />
                <span className="flex-1 font-medium truncate">{p.title || 'untitled'}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--vscode-selection)', color: 'var(--vscode-text-secondary)' }}>{p.language}</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>
                  <Eye size={12} /> {p.views || 0}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>
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
