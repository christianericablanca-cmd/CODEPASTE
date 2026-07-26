'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import { themes } from '@/lib/themes';
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
    <div className="flex items-center justify-between h-6 px-3 text-xs shrink-0" style={{ background: '#1e1e1e', color: '#cccccc', borderTop: '1px solid var(--vscode-border)' }}>
      <div className="flex items-center gap-1">
        {userName && (
          <Link href="/my-pastes" className="status-item hover:opacity-80 no-underline">{userName}</Link>
        )}
        <span className="status-item" style={{ color: 'var(--vscode-accent)' }}>{theme.name}</span>
        <span className="status-item">Ln {lineCount}, Col {charCount}</span>
        <span className="status-item">{wordCount} words</span>
        <span className="status-item">{language}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="status-item" onClick={() => setEditorFontSize(editorFontSize === 12 ? 14 : editorFontSize === 14 ? 16 : editorFontSize === 16 ? 18 : editorFontSize === 18 ? 20 : 12)}>
          {editorFontSize}px
        </span>
        <span className="status-item" onClick={() => setWordWrap(!wordWrap)}>
          {wordWrap ? 'Wrap' : 'No Wrap'}
        </span>
        <span className="status-item" onClick={() => setMinimap(!minimap)}>
          {minimap ? 'Minimap' : 'No Minimap'}
        </span>
        <span className="status-item">UTF-8</span>
        <span className="status-item">Spaces: 2</span>
      </div>
    </div>
  );
}
