'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ActivityBar } from '@/components/activity-bar';
import { Sidebar } from '@/components/sidebar';
import { Editor } from '@/components/editor';
import { StatusBar } from '@/components/status-bar';
import { ThemePanel } from '@/components/theme-panel';
import { languages } from '@/lib/themes';
import { ChevronDown, Globe, Clock, Lock, FileCode, Loader2, Copy, Check, Plus, X } from 'lucide-react';
import { generateKey, encrypt, wrapE2EEKey } from '@/lib/crypto';
import { AuthStatus } from '@/components/auth-status';
import { useTheme } from '@/lib/theme-context';
import { createClient } from '@/lib/supabase-client';
import { useNotification, Notification } from '@/components/notification';

interface Tab {
  id: string;
  title: string;
  language: string;
  code: string;
}

const defaultCode = `const greet = (name: string): string => {
  return \`Hello, \${name}! Welcome to CodePaste.\`;
};

console.log(greet('Developer'));

// Share your code with a single link
const shareUrl = 'https://codepaste.app/p/abc123';
console.log('Share this:', shareUrl);
`;

export default function NewPaste() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'tab-0', title: 'hello-world', language: 'typescript', code: defaultCode }]);
  const [tabSeq, setTabSeq] = useState(1);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [sidebarTab, setSidebarTab] = useState('files');
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showExpiryDropdown, setShowExpiryDropdown] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState('never');
  const [visibility, setVisibility] = useState('public');
  const [pastePassword, setPastePassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { syncToServer } = useTheme();
  const { notification, showNotification } = useNotification();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const isSignedIn = !!data.user;
      setSignedIn(isSignedIn);
      if (!isSignedIn && visibility !== 'public') {
        setVisibility('public');
      }
    });
  }, []);

  const updateTab = useCallback((id: string, partial: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...partial } : t));
  }, []);

  const addTab = useCallback(() => {
    const newTab = { id: `tab-${tabSeq}`, title: 'untitled', language: 'typescript', code: '' };
    setTabSeq(prev => prev + 1);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabSeq]);

  const closeTab = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      if (id === activeTabId) {
        const newIdx = Math.min(idx, next.length - 1);
        setActiveTabId(next[newIdx].id);
      }
      return next;
    });
  }, [activeTabId]);

  const commitRename = useCallback(() => {
    if (renamingTabId && renameValue.trim()) {
      updateTab(renamingTabId, { title: renameValue.trim() });
    }
    setRenamingTabId(null);
  }, [renamingTabId, renameValue, updateTab]);

  const lineCount = useMemo(() => activeTab.code.split('\n').length, [activeTab]);
  const charCount = useMemo(() => activeTab.code.length, [activeTab]);
  const wordCount = useMemo(() => activeTab.code.split(/\s+/).filter(Boolean).length, [activeTab]);

  const selectedLang = languages.find(l => l.id === activeTab.language) || languages[0];

  const expiryOptions = [
    { id: 'never', label: 'Never' },
    { id: '10min', label: '10 Minutes' },
    { id: '1hour', label: '1 Hour' },
    { id: '1day', label: '1 Day' },
    { id: '1week', label: '1 Week' },
    { id: '1month', label: '1 Month' },
  ];

  const visibilityOptions = signedIn
    ? [
        { id: 'public', label: 'Public' },
        { id: 'unlisted', label: 'Unlisted' },
        { id: 'private', label: 'Private' },
      ]
    : [
        { id: 'public', label: 'Public' },
      ];

  const handlePaste = useCallback(async () => {
    if (!activeTab.code.trim()) return;
    if (showPasswordField && !pastePassword.trim()) {
      showNotification('Please enter a password', 'error');
      return;
    }
    setCreating(true);
    setCreatedUrl(null);
    try {
      const encryptionKey = await generateKey();
      const encryptedContent = await encrypt(activeTab.code, encryptionKey);

      const body: Record<string, unknown> = {
        content: encryptedContent,
        language: activeTab.language,
        title: activeTab.title,
        visibility,
        expiresIn: expiry === 'never' ? null : expiry,
      };

      if (pastePassword) {
        const wrapped = await wrapE2EEKey(encryptionKey, pastePassword);
        body.password_protected = true;
        body.wrapped_key = wrapped.wrapped;
        body.wrapped_key_salt = wrapped.salt;
        body.wrapped_key_iv = wrapped.iv;
      }

      body.owner_key = encryptionKey;

      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        try { localStorage.setItem(`ck_${data.slug}`, encryptionKey); } catch {}
        setCreatedUrl(`${data.url}#${encryptionKey}`);
        showNotification('Paste created!', 'success');
        syncToServer();
      } else {
        showNotification(data.error || 'Failed to create paste', 'error');
      }
    } catch (e) {
      showNotification(e instanceof Error ? e.message : 'An error occurred', 'error');
    } finally {
      setCreating(false);
    }
  }, [activeTab, visibility, expiry, pastePassword, showPasswordField, syncToServer]);

  const copyUrl = () => {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-dvh flex flex-col" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <h1 className="sr-only">New Paste</h1>
      {/* Top info bar */}
      <div className="px-2 sm:px-4 py-1.5 sm:py-2 border-b shrink-0" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto">
          <Link href="/" className="font-bold text-sm sm:text-base tracking-tight shrink-0 no-underline" style={{ color: 'var(--vscode-accent)' }}>CodePaste</Link>
          <input
            type="text"
            value={activeTab.title}
            onChange={(e) => updateTab(activeTab.id, { title: e.target.value })}
            placeholder="Paste title..."
            className="input-vscode max-w-[100px] sm:max-w-[180px] text-xs sm:text-sm"
          />
          {/* Language selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-sm rounded border transition-colors"
              style={{ background: 'var(--vscode-input)', color: 'var(--vscode-text)', borderColor: 'var(--vscode-border)' }}
            >
              <FileCode size={14} />
              {selectedLang.name}
              <ChevronDown size={12} />
            </button>
            {showLangDropdown && (
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-64 max-h-72 overflow-y-auto rounded border shadow-xl" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
                <div className="sticky top-0 px-3 py-2 text-xs font-semibold border-b" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>Language</div>
                {languages.map((l) => (
                  <button key={l.id} onClick={() => { updateTab(activeTab.id, { language: l.id }); setShowLangDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{ color: activeTab.language === l.id ? 'var(--vscode-accent)' : 'var(--vscode-text)', background: activeTab.language === l.id ? 'var(--vscode-selection)' : 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vscode-hover)'}
                    onMouseLeave={(e) => { if (activeTab.language !== l.id) e.currentTarget.style.background = 'transparent'; }}
                  >{l.name}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0" />
          <AuthStatus />
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {signedIn && (
              <Link href="/my-pastes" className="hidden sm:inline-flex text-xs px-2 py-1 rounded border no-underline transition-colors whitespace-nowrap" style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
                My Pastes
              </Link>
            )}
            {/* Visibility */}
            <div className="relative">
              <button
                onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded border transition-colors"
                style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}
              >
                <Lock size={10} /> <span className="hidden sm:inline">{visibility.charAt(0).toUpperCase() + visibility.slice(1)}</span><span className="sm:hidden">{visibility.charAt(0).toUpperCase()}</span>
              </button>
              {showVisibilityDropdown && (
                <div className="fixed right-4 top-auto z-50 mt-1 w-40 rounded border shadow-xl" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
                  <div className="px-3 py-2 text-xs font-semibold border-b" style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>Visibility</div>
                  {visibilityOptions.map((o) => (
                    <button key={o.id} onClick={() => { setVisibility(o.id); setShowVisibilityDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs transition-colors"
                      style={{ color: visibility === o.id ? 'var(--vscode-accent)' : 'var(--vscode-text)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vscode-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >{o.label}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Expiry */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowExpiryDropdown(!showExpiryDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border transition-colors"
                style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}
              >
                <Clock size={12} /> {expiryOptions.find(o => o.id === expiry)?.label || 'Never'}
              </button>
              {showExpiryDropdown && (
                <div className="fixed right-4 top-auto z-50 mt-1 w-40 rounded border shadow-xl" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
                  <div className="px-3 py-2 text-xs font-semibold border-b" style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>Expiry</div>
                  {expiryOptions.map((o) => (
                    <button key={o.id} onClick={() => { setExpiry(o.id); setShowExpiryDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs transition-colors"
                      style={{ color: expiry === o.id ? 'var(--vscode-accent)' : 'var(--vscode-text)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vscode-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >{o.label}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Password toggle */}
            <button
              onClick={() => setShowPasswordField(!showPasswordField)}
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded border transition-colors whitespace-nowrap"
              style={{ borderColor: showPasswordField ? 'var(--vscode-accent)' : 'var(--vscode-border)', color: showPasswordField ? 'var(--vscode-accent)' : 'var(--vscode-text-secondary)' }}
            >
              <Lock size={10} /> <span className="hidden sm:inline">{showPasswordField ? 'Password Set' : 'Password'}</span>
            </button>
            {/* Create button */}
            <button
              onClick={handlePaste}
              disabled={creating || !activeTab.code.trim()}
              className="btn-vscode flex items-center gap-1 sm:gap-2 text-[11px] sm:text-sm disabled:opacity-50 px-2 sm:px-3 py-1 sm:py-1.5 whitespace-nowrap"
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
              <span className="hidden sm:inline">{creating ? 'Creating...' : 'Create Paste'}</span>
              <span className="sm:hidden">{creating ? '...' : 'Create'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password input */}
      {showPasswordField && (
        <div className="flex items-center gap-2 px-2 sm:px-4 py-2 border-b" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
          <Lock size={12} style={{ color: 'var(--vscode-accent)' }} />
          <input type="password" value={pastePassword} onChange={(e) => setPastePassword(e.target.value)}
            placeholder="Paste password"
            className="input-vscode flex-1 text-xs sm:text-sm" />
        </div>
      )}

      {/* Created URL banner */}
      {notification && <Notification notification={notification} />}

      {createdUrl && (
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 border-b overflow-x-auto" style={{ background: 'var(--vscode-selection)', borderColor: 'var(--vscode-border)' }}>
          <span className="text-xs font-medium shrink-0" style={{ color: 'var(--vscode-status)' }}>✓ Created!</span>
          <a href={createdUrl} target="_blank" className="text-xs sm:text-sm underline truncate min-w-0" style={{ color: 'var(--vscode-accent)' }}>
            {createdUrl}
          </a>
          <button onClick={copyUrl} className="flex items-center gap-1 px-2 py-1 text-xs rounded border shrink-0" style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button onClick={() => setCreatedUrl(null)} className="shrink-0 hover:opacity-80" style={{ color: "var(--vscode-text-secondary)" }}><X size={14} /></button>
        </div>
      )}

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar
          activeTab={sidebarTab}
          onTabChange={(tab) => { setSidebarTab(tab); setShowThemePanel(false); }}
          onToggleThemePanel={() => setShowThemePanel(!showThemePanel)}
        />
        {showThemePanel ? (
          <ThemePanel onClose={() => setShowThemePanel(false)} />
        ) : (
          <Sidebar
            activeTab={sidebarTab}
            language={activeTab.language}
            onLanguageChange={(lang) => updateTab(activeTab.id, { language: lang })}
            title={activeTab.title}
            onTitleChange={(title) => updateTab(activeTab.id, { title })}
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={closeTab}
            onAddTab={addTab}
            onRenameTab={(id, title) => updateTab(id, { title })}
            code={activeTab.code}
          />
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center shrink-0 overflow-x-auto" style={{ background: 'var(--vscode-tab)' }}>
            {tabs.map((tab) => {
              const isRenaming = renamingTabId === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => { if (!isRenaming) setActiveTabId(tab.id); }}
                  onDoubleClick={() => { setRenamingTabId(tab.id); setRenameValue(tab.title); }}
                  className={`vscode-tab whitespace-nowrap ${tab.id === activeTabId ? 'active' : ''}`}
                >
                  <FileCode size={12} />
                  {isRenaming ? (
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingTabId(null);
                      }}
                      className="bg-transparent border border-[var(--vscode-accent)] outline-none text-xs px-1 rounded w-24"
                      style={{ color: 'var(--vscode-text)' }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span>{tab.title || 'untitled'}.{tab.language}</span>
                  )}
                  {tabs.length > 1 && !isRenaming && (
                    <button onClick={(e) => closeTab(tab.id, e)} className="ml-1 hover:opacity-80">
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={addTab}
              className="px-2 py-1.5 text-[var(--vscode-text-secondary)] hover:text-[var(--vscode-text)] transition-colors shrink-0"
              title="New tab"
            >
              <Plus size={14} />
            </button>
          </div>
          <Editor value={activeTab.code} onChange={(val) => updateTab(activeTab.id, { code: val })} language={activeTab.language} />
        </div>
      </div>

      <StatusBar
        language={selectedLang.name}
        lineCount={lineCount}
        charCount={charCount}
        wordCount={wordCount}
      />
    </div>
  );
}