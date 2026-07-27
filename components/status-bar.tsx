'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

interface StatusBarProps {
  language: string;
  lineCount: number;
  charCount: number;
  wordCount: number;
  pasteId?: string;
}

export function StatusBar({ language, lineCount, charCount, wordCount }: StatusBarProps) {
  const { theme, editorFontSize, setEditorFontSize, wordWrap, setWordWrap, minimap, setMinimap } = useTheme();
  const [userName, setUserName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        fetch('/api/profile').then(r => r.ok && r.json()).then(d => {
          setUserName(d.profile?.nickname || data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || '');
        }).catch(() => {});
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-between h-5 sm:h-6 px-2 sm:px-3 text-[10px] sm:text-xs shrink-0 overflow-x-auto" style={{ background: '#1e1e1e', color: '#cccccc', borderTop: '1px solid var(--vscode-border)' }}>
      <div className="flex items-center gap-0 sm:gap-1">
        {userName && (
          <Link href="/my-pastes" className="status-item hover:opacity-80 no-underline hidden sm:inline">{userName}</Link>
        )}
        <span className="status-item hidden sm:inline" style={{ color: 'var(--vscode-accent)' }}>{theme.name}</span>
        <span className="status-item">Ln {lineCount}, Col {charCount}</span>
        <span className="status-item hidden sm:inline">{wordCount} words</span>
        <span className="status-item">{language}</span>
      </div>
      <div className="flex items-center gap-0 sm:gap-1">
        <span className="status-item" onClick={() => setEditorFontSize(editorFontSize === 12 ? 14 : editorFontSize === 14 ? 16 : editorFontSize === 16 ? 18 : editorFontSize === 18 ? 20 : 12)}>
          {editorFontSize}px
        </span>
        <span className="status-item hidden sm:inline" onClick={() => setWordWrap(!wordWrap)}>
          {wordWrap ? 'Wrap' : 'No Wrap'}
        </span>
        <span className="status-item hidden sm:inline" onClick={() => setMinimap(!minimap)}>
          {minimap ? 'Minimap' : 'No Minimap'}
        </span>
        <span className="status-item hidden sm:inline">UTF-8</span>
        <span className="status-item hidden sm:inline">Spaces: 2</span>
      </div>
    </div>
  );
}
