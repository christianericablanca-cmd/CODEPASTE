'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';
import { themes } from '@/lib/themes';
import { X, Check } from 'lucide-react';

interface ThemePanelProps {
  onClose: () => void;
}

export function ThemePanel({ onClose }: ThemePanelProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-72 border-r flex flex-col" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--vscode-border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--vscode-text-secondary)' }}>Themes</span>
        <button onClick={onClose} className="text-[var(--vscode-text-secondary)] hover:text-[var(--vscode-text)]">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors"
            style={{
              background: theme.id === t.id ? 'var(--vscode-selection)' : 'transparent',
              color: 'var(--vscode-text)',
            }}
            onMouseEnter={(e) => { if (theme.id !== t.id) e.currentTarget.style.background = 'var(--vscode-hover)'; }}
            onMouseLeave={(e) => { if (theme.id !== t.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <div className="w-6 h-6 rounded border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--vscode-border)', background: t.className === 'theme-vscode-dark' ? '#1e1e1e' : t.className === 'theme-vscode-light' ? '#fff' : t.className === 'theme-monokai' ? '#272822' : t.className === 'theme-nord' ? '#2e3440' : t.className === 'theme-one-dark' ? '#282c34' : t.className === 'theme-github-dark' ? '#0d1117' : '#282a36' }}>
              {theme.id === t.id && <Check size={14} style={{ color: t.accent }} />}
            </div>
            <span className="flex-1 text-left">{t.name}</span>
            <span className="text-xs" style={{ color: t.accent }}>●</span>
          </button>
        ))}
      </div>
    </div>
  );
}
