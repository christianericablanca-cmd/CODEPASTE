'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, defaultTheme, themes } from './themes';
import { createClient } from './supabase-client';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  editorFontSize: number;
  setEditorFontSize: (size: number) => void;
  wordWrap: boolean;
  setWordWrap: (wrap: boolean) => void;
  minimap: boolean;
  setMinimap: (show: boolean) => void;
  syncToServer: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function loadLocal(key: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) || fallback;
}

function applyThemeClass(cls: string) {
  const fontClasses = Array.from(document.documentElement.classList)
    .filter(c => c.startsWith('__'))
    .join(' ');
  document.documentElement.className = [cls, fontClasses].filter(Boolean).join(' ');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [editorFontSize, setEditorFontSizeState] = useState(14);
  const [wordWrap, setWordWrapState] = useState(false);
  const [minimap, setMinimapState] = useState(true);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('codepaste-theme', t.id);
    applyThemeClass(t.className);
  };
  const setEditorFontSize = (v: number) => { setEditorFontSizeState(v); localStorage.setItem('codepaste-fontsize', String(v)); };
  const setWordWrap = (v: boolean) => { setWordWrapState(v); localStorage.setItem('codepaste-wordwrap', String(v)); };
  const setMinimap = (v: boolean) => { setMinimapState(v); localStorage.setItem('codepaste-minimap', String(v)); };

  useEffect(() => {
    const savedTheme = loadLocal('codepaste-theme', '');
    const found = themes.find(t => t.id === savedTheme);
    if (found) {
      setThemeState(found);
      applyThemeClass(found.className);
    } else {
      applyThemeClass(defaultTheme.className);
    }
    const fs = parseInt(loadLocal('codepaste-fontsize', '14'));
    if (!isNaN(fs)) setEditorFontSizeState(fs);
    setWordWrapState(loadLocal('codepaste-wordwrap', 'false') === 'true');
    setMinimapState(loadLocal('codepaste-minimap', 'true') !== 'false');
    setInitialized(true);
  }, []);

  const syncToServer = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const preferences = { theme: theme.id, editorFontSize, wordWrap, minimap };
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences }),
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, editorFontSize, setEditorFontSize, wordWrap, setWordWrap, minimap, setMinimap, syncToServer }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
