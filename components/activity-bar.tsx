'use client';

import React, { useState } from 'react';
import {
  Files,
  Search,
  Settings,
  Palette,
  Github,
} from 'lucide-react';

interface ActivityBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleThemePanel: () => void;
}

export function ActivityBar({ activeTab, onTabChange, onToggleThemePanel }: ActivityBarProps) {
  const items = [
    { id: 'files', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
  ];

  const bottomItems = [
    { id: 'theme', icon: Palette, label: 'Themes', onClick: onToggleThemePanel },
    { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="flex flex-col items-center w-12 py-2 gap-2 border-r shrink-0" style={{ background: 'var(--vscode-activity)', borderColor: 'var(--vscode-border)' }}>
      <div className="flex flex-col items-center gap-1 flex-1">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            title={label}
            className={`w-10 h-10 flex items-center justify-center rounded transition-colors relative ${
              activeTab === id
                ? 'text-[var(--vscode-accent)]'
                : 'text-[var(--vscode-text-secondary)] hover:text-[var(--vscode-text)]'
            }`}
          >
            {activeTab === id && (
              <div className="absolute left-0 w-0.5 h-6 rounded-r" style={{ background: 'var(--vscode-accent)' }} />
            )}
            <Icon size={22} />
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        {bottomItems.map(({ id, icon: Icon, label, onClick, href }) => (
          href ? (
            <a key={id} href={href} title={label}
              className="w-10 h-10 flex items-center justify-center rounded transition-colors text-[var(--vscode-text-secondary)] hover:text-[var(--vscode-text)]">
              <Icon size={20} />
            </a>
          ) : (
            <button key={id} onClick={onClick} title={label}
              className="w-10 h-10 flex items-center justify-center rounded transition-colors text-[var(--vscode-text-secondary)] hover:text-[var(--vscode-text)]">
              <Icon size={20} />
            </button>
          )
        ))}
      </div>
    </div>
  );
}
