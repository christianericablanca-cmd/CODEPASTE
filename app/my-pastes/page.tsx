'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { Clock, Eye, FileCode, Globe, Lock, Shield } from 'lucide-react';

export default function MyPastesPage() {
  const [pastes, setPastes] = useState<any[] | null>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPastes();
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) loadPastes(); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  async function loadPastes() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/auth/login'; return; }

      const { data: p } = await supabase
        .from('pastes')
        .select('slug, title, language, visibility, created_at, views')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const profile = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .maybeSingle();

      const n = profile?.data?.nickname || user.user_metadata?.full_name || user.email?.split('@')[0];
      setPastes(p || []);
      setNickname(n || '');
    } catch (e) {
      console.error(e);
      setPastes([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b shrink-0" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="font-bold text-base sm:text-lg tracking-tight" style={{ color: 'var(--vscode-accent)' }}>CodePaste</Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
            <Link href="/new" className="hover:text-[var(--vscode-text)] transition-colors">New Paste</Link>
            <Link href="/my-pastes" className="hover:text-[var(--vscode-text)] transition-colors hidden sm:inline" style={{ color: 'var(--vscode-text)' }}>My Pastes</Link>
          </nav>
        </div>
        <Link href="/settings" className="btn-vscode flex items-center gap-1 sm:gap-2 text-xs sm:text-sm no-underline px-2 sm:px-3 py-1 sm:py-1.5">
          Settings
        </Link>
      </header>

      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{nickname}&apos;s Pastes</h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--vscode-text-secondary)' }}>{loading ? '...' : (pastes?.length || 0) + ' paste' + ((pastes?.length || 0) !== 1 ? 's' : '')}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>Loading...</p>
          </div>
        ) : !pastes || pastes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>No pastes yet.</p>
            <Link href="/new" className="btn-vscode inline-flex items-center gap-2 mt-4 text-sm no-underline">
              <FileCode size={14} /> Create your first paste
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {pastes.map((p: any) => (
              <Link key={p.slug} href={`/p/${p.slug}`}
                className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 rounded border transition-colors no-underline"
                style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text)' }}>
                <FileCode size={14} className="hidden sm:block" style={{ color: 'var(--vscode-accent)' }} />
                <span className="flex-1 font-medium truncate text-sm sm:text-base">{p.title || 'untitled'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider shrink-0" style={{ background: 'color-mix(in srgb, var(--vscode-accent) 20%, transparent)', color: 'var(--vscode-accent)' }}>{p.language}</span>
                {p.visibility === 'private' ? (
                  <Lock size={12} style={{ color: 'var(--vscode-status)' }} />
                ) : p.visibility === 'unlisted' ? (
                  <Shield size={12} style={{ color: 'var(--vscode-text-secondary)' }} />
                ) : (
                  <Globe size={12} style={{ color: 'var(--vscode-text-secondary)' }} />
                )}
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
