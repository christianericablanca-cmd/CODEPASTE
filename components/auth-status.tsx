'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, Settings } from 'lucide-react';

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const supabase = createClient();

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const { profile } = await res.json();
        setNickname(profile.nickname || '');
      }
    } catch {}
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      if (data.user) fetchProfile();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    const avatar = user.user_metadata?.avatar_url;
    const name = nickname || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Dev';
    return (
      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
        {avatar ? (
          <img src={avatar} alt="" className="w-5 h-5 rounded-full shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-[var(--vscode-accent)] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {name[0].toUpperCase()}
          </div>
        )}
        <Link href="/my-pastes" className="hidden sm:inline truncate max-w-[100px] hover:text-[var(--vscode-text)] transition-colors">{name}</Link>
        <Link href="/settings" className="hover:text-[var(--vscode-text)] transition-colors"><Settings size={12} /></Link>
        <button onClick={handleLogout} className="hover:text-[var(--vscode-text)] transition-colors"><LogOut size={12} /></button>
      </div>
    );
  }

  return (
    <Link href="/auth/login" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm hover:text-[var(--vscode-text)] transition-colors" style={{ color: 'var(--vscode-text-secondary)' }}>
      <LogIn size={12} /> <span className="hidden sm:inline">Sign In</span>
    </Link>
  );
}
