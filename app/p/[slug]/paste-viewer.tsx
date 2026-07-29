'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityBar } from '@/components/activity-bar';
import { StatusBar } from '@/components/status-bar';
import { ThemePanel } from '@/components/theme-panel';
import Link from 'next/link';
import { FileCode, Copy, Check, Clock, Eye, Shield, Loader2, Trash2, Edit3, GitFork, Lock, Save, X, History, ArrowLeft, Plus } from 'lucide-react';
import { decrypt, unwrapE2EEKey, generateKey, encrypt } from '@/lib/crypto';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { languages, themes } from '@/lib/themes';
import { useTheme } from '@/lib/theme-context';
import { useNotification, Notification } from '@/components/notification';
import { ConfirmDialog } from '@/components/confirm-dialog';
import dynamic from 'next/dynamic';
import { registerMonacoThemes } from '@/lib/monaco-themes';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface PasteData {
  id: string;
  slug: string;
  title: string;
  content: string;
  language: string;
  visibility: string;
  created_at: string;
  views: number;
  user_id: string | null;
  password_protected?: boolean;
  wrapped_key?: string;
  wrapped_key_salt?: string;
  wrapped_key_iv?: string;
}

export function PasteViewer({ paste, isOwner: serverIsOwner, ownerKey: serverOwnerKey }: { paste: PasteData; isOwner: boolean; ownerKey?: string | null }) {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(paste.password_protected ? false : true);
  const [decryptError, setDecryptError] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  const [deleting, setDeleting] = useState(false);
  const [forking, setForking] = useState(false);
  const [versions, setVersions] = useState<{ id: string; title: string; language: string; saved_at: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState(paste.title);
  const [editLang, setEditLang] = useState(paste.language);
  const [editVis, setEditVis] = useState(paste.visibility);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(serverIsOwner);
  const [monacoReady, setMonacoReady] = useState(false);
  const [createdDate, setCreatedDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { notification, showNotification } = useNotification();
  const router = useRouter();
  const { theme } = useTheme();
  const supabaseRef = useRef<ReturnType<typeof createClient>>();
  if (!supabaseRef.current) supabaseRef.current = createClient();

  useEffect(() => {
    if (serverIsOwner) { setIsOwner(true); return; }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled && user && user.id === paste.user_id) setIsOwner(true);
    })();
    return () => { cancelled = true; };
  }, [serverIsOwner, paste.user_id]);

  const doDecrypt = useCallback(async (keyOverride?: string) => {
    if (!paste.content && !keyOverride) return;
    setDecrypting(true);
    setDecryptError(false);
    try {
      let key = keyOverride || serverOwnerKey;
      if (!key) {
        try { key = localStorage.getItem(`ck_${paste.slug}`) || ''; } catch {}
      }
      if (!key) {
        key = window.location.hash.replace('#', '');
      }
      if (!key) {
        try {
          await supabaseRef.current!.auth.getUser();
          const res = await fetch(`/api/pastes/${paste.slug}/key`);
          if (res.ok) { const data = await res.json(); key = data.key; }
        } catch {}
      }
      if (key && paste.content) {
        const plaintext = await decrypt(paste.content, key);
        setDecrypted(plaintext);
        try { localStorage.removeItem(`ck_${paste.slug}`); } catch {}
        return;
      }
    } catch {}
    if (!paste.content) { setDecrypting(false); return; }
    setDecryptError(true);
    setDecrypting(false);
  }, [paste.slug, paste.content, serverOwnerKey]);

  const retryDecrypt = useRef<() => void>(() => {});
  retryDecrypt.current = () => { if (!decrypted) doDecrypt(); };

  useEffect(() => {
    if (!paste.password_protected && paste.content) {
      doDecrypt();
    }
  }, [paste.content, doDecrypt]);

  useEffect(() => {
    setCreatedDate(new Date(paste.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }));
  }, [paste.created_at]);

  useEffect(() => {
    const handler = () => retryDecrypt.current();
    window.addEventListener('click', handler);
    window.addEventListener('focus', handler);
    return () => { window.removeEventListener('click', handler); window.removeEventListener('focus', handler); };
  }, []);

  const handlePasswordSubmit = async () => {
    setPasswordError('');
    try {
      const e2eeKey = await unwrapE2EEKey(
        paste.wrapped_key!, password,
        paste.wrapped_key_salt!, paste.wrapped_key_iv!
      );
      await doDecrypt(e2eeKey);
      showNotification('Paste unlocked', 'success');
    } catch {
      setPasswordError('Wrong password');
      showNotification('Wrong password', 'error');
    }
  };

  const displayContent = decrypted || paste.content;
  const lineCount = displayContent.split('\n').length;
  const wordCount = displayContent.split(/\s+/).filter(Boolean).length;
  const [isEncrypted, setIsEncrypted] = useState(false);
  useEffect(() => { setIsEncrypted(!paste.password_protected && !!window.location.hash.replace('#', '')); }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const headers: Record<string, string> = {};
      let signedIn = false;
      try {
        const { data: { user } } = await supabaseRef.current!.auth.getUser();
        if (user) {
          signedIn = true;
          const { data: { session } } = await supabaseRef.current!.auth.getSession();
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch {}
      const res = await fetch(`/api/pastes/${paste.slug}`, { method: 'DELETE', headers });
      if (res.ok) {
        showNotification('Paste deleted', 'success');
        await new Promise(r => setTimeout(r, 1500));
        window.location.href = signedIn ? '/my-pastes' : '/';
      } else {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        showNotification('Delete failed: ' + err.error, 'error');
      }
    } catch (e) {
      showNotification('Delete error: ' + (e instanceof Error ? e.message : e), 'error');
    } finally { setDeleting(false); setConfirmDelete(false); }
  };

  const handleFork = async () => {
    setForking(true);
    try {
      const encryptionKey = await generateKey();
      const encryptedContent = await encrypt(displayContent, encryptionKey);
      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: encryptedContent,
          language: paste.language,
          title: paste.title + ' (fork)',
          visibility: 'public',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Fork created!', 'success');
        await new Promise(r => setTimeout(r, 1500));
        router.push(`/p/${data.slug}#${encryptionKey}`);
      } else showNotification('Failed to fork', 'error');
    } catch { showNotification('Network error', 'error'); } finally { setForking(false); }
  };

  const startEdit = () => {
    setEditContent(displayContent);
    setEditTitle(paste.title);
    setEditLang(paste.language);
    setEditVis(paste.visibility);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const encryptionKey = await generateKey();
      const encryptedContent = await encrypt(editContent, encryptionKey);
      const body: Record<string, unknown> = {
        content: encryptedContent,
        title: editTitle,
        language: editLang,
        visibility: editVis,
        owner_key: encryptionKey,
      };
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const { data: { user } } = await supabaseRef.current!.auth.getUser();
        if (user) {
          const { data: { session } } = await supabaseRef.current!.auth.getSession();
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch {}
      const res = await fetch(`/api/pastes/${paste.slug}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        window.history.replaceState(null, '', `#${encryptionKey}`);
        setDecrypted(editContent);
        setEditing(false);
        showNotification('Saved!', 'success');
      } else {
        try {
          const err = await res.json();
          showNotification('Save failed: ' + (err.error || res.statusText), 'error');
        } catch {
          showNotification('Save failed: HTTP ' + res.status, 'error');
        }
      }
    } catch (e) {
      showNotification('Save error: ' + (e instanceof Error ? e.message : JSON.stringify(e)), 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="h-dvh flex flex-col" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <h1 className="sr-only">{paste.title || 'Untitled'} - CodePaste</h1>
      <div className="flex items-center gap-1 sm:gap-3 px-1.5 sm:px-3 py-1 sm:py-1.5 border-b shrink-0 overflow-x-auto" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <div className="flex items-center gap-0 sm:gap-1 shrink-0">
          <Link href="/my-pastes" className="flex flex-col items-center gap-0 px-1.5 sm:px-2 py-1 rounded hover:bg-[var(--vscode-selection)] transition-colors no-underline min-w-0" style={{ color: 'var(--vscode-text-secondary)' }}>
            <ArrowLeft size={12} />
            <span className="text-[8px] sm:text-[9px] leading-none mt-0.5">Back</span>
          </Link>
          <Link href="/new" className="flex flex-col items-center gap-0 px-1.5 sm:px-2 py-1 rounded hover:bg-[var(--vscode-selection)] transition-colors no-underline min-w-0" style={{ color: 'var(--vscode-text-secondary)' }}>
            <Plus size={12} />
            <span className="text-[8px] sm:text-[9px] leading-none mt-0.5">New</span>
          </Link>
        </div>
        <span className="w-px h-4 shrink-0" style={{ background: 'var(--vscode-border)' }} />
        <Link href="/" className="font-bold text-xs sm:text-sm tracking-tight shrink-0 no-underline" style={{ color: 'var(--vscode-accent)' }}>CodePaste</Link>
        <span className="w-px h-4 shrink-0" style={{ background: 'var(--vscode-border)' }} />

        {editing ? (
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            className="input-vscode max-w-[140px] text-xs flex-1" />
        ) : (
          <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--vscode-text-secondary)' }}>{paste.title}</span>
        )}

        {editing ? (
          <select value={editLang} onChange={(e) => setEditLang(e.target.value)}
            className="input-vscode text-xs max-w-[90px]">
            {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider shrink-0"
            style={{ background: 'color-mix(in srgb, var(--vscode-accent) 20%, transparent)', color: 'var(--vscode-accent)' }}>{paste.language}</span>
        )}

        {editing && (
          <select value={editVis} onChange={(e) => setEditVis(e.target.value)}
            className="input-vscode text-xs max-w-[80px]">
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        )}

        <div className="flex-1" />

        {!editing && (
          <>
            <div className="hidden sm:flex items-center gap-2 text-[10px] shrink-0" style={{ color: 'var(--vscode-text-secondary)' }}>
              <span className="flex items-center gap-0.5"><Clock size={11} /> {createdDate}</span>
              <span className="flex items-center gap-0.5"><Eye size={11} /> {paste.views || 0}</span>
              {paste.password_protected && <Lock size={11} style={{ color: 'var(--vscode-status)' }} />}
              {isEncrypted && <Shield size={11} style={{ color: 'var(--vscode-accent)' }} />}
            </div>

            <div className="flex items-center gap-0 shrink-0">
              <button onClick={copyCode} className="flex flex-col items-center gap-0 px-2 py-1 rounded hover:bg-[var(--vscode-selection)] transition-colors min-w-0" style={{ color: 'var(--vscode-text-secondary)' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="text-[9px] leading-none mt-0.5">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button onClick={handleFork} disabled={forking}
                className="flex flex-col items-center gap-0 px-2 py-1 rounded hover:bg-[var(--vscode-selection)] transition-colors disabled:opacity-40 min-w-0"
                style={{ color: 'var(--vscode-text-secondary)' }}>
                <GitFork size={14} />
                <span className="text-[9px] leading-none mt-0.5">{forking ? 'Forking' : 'Fork'}</span>
              </button>
              <button onClick={() => router.push(`/p/${paste.slug}/raw${window.location.hash}`)}
                className="flex flex-col items-center gap-0 px-2 py-1 rounded hover:bg-[var(--vscode-selection)] transition-colors min-w-0"
                style={{ color: 'var(--vscode-text-secondary)' }}>
                <FileCode size={14} />
                <span className="text-[9px] leading-none mt-0.5">Raw</span>
              </button>
              {isOwner && (
                <button onClick={async () => {
                  setShowHistory(!showHistory);
                  if (!showHistory && versions.length === 0) {
                    setLoadingVersions(true);
                    try {
                      const res = await fetch(`/api/pastes/${paste.slug}/versions`);
                      if (res.ok) { const d = await res.json(); setVersions(d.versions || []); }
                    } catch {} finally { setLoadingVersions(false); }
                  }
                }}
                  className="flex flex-col items-center gap-0 px-2 py-1 rounded hover:bg-[var(--vscode-selection)] transition-colors min-w-0"
                  style={{ color: showHistory ? 'var(--vscode-accent)' : 'var(--vscode-text-secondary)' }}>
                  <History size={14} />
                  <span className="text-[9px] leading-none mt-0.5">History</span>
                </button>
              )}
              {isOwner && (
                <button onClick={startEdit}
                  className="flex flex-col items-center gap-0 px-2 py-1 rounded hover:bg-[var(--vscode-selection)] transition-colors min-w-0"
                  style={{ color: 'var(--vscode-text-secondary)' }}>
                  <Edit3 size={14} />
                  <span className="text-[9px] leading-none mt-0.5">Edit</span>
                </button>
              )}
              {isOwner && (
                <button onClick={() => setConfirmDelete(true)} disabled={deleting}
                  className="flex flex-col items-center gap-0 px-2 py-1 rounded hover:bg-[var(--vscode-selection)] transition-colors disabled:opacity-40 min-w-0"
                  style={{ color: '#f48771' }}>
                  <Trash2 size={14} />
                  <span className="text-[9px] leading-none mt-0.5">Delete</span>
                </button>
              )}
            </div>
          </>
        )}

        {editing && (
          <div className="flex items-center gap-1">
            <button onClick={handleSaveEdit} disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded font-medium transition-colors"
              style={{ background: 'var(--vscode-accent)', color: '#fff' }}>
              <Save size={12} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)}
              className="flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--vscode-selection)] transition-colors"
              style={{ color: 'var(--vscode-text-secondary)' }}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {notification && <Notification notification={notification} onClose={() => showNotification} />}

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setShowThemePanel(false); setShowHistory(false); }} onToggleThemePanel={() => setShowThemePanel(!showThemePanel)} />
        {showThemePanel && <ThemePanel onClose={() => setShowThemePanel(false)} />}
        {showHistory && (
          <div className="w-64 border-r flex flex-col" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--vscode-border)' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--vscode-text-secondary)' }}>Version History</span>
              <button onClick={() => setShowHistory(false)} className="text-[var(--vscode-text-secondary)] hover:text-[var(--vscode-text)]"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingVersions ? (
                <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin" /></div>
              ) : versions.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--vscode-text-secondary)' }}>No previous versions</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="px-3 py-2 rounded text-xs" style={{ background: 'var(--vscode-selection)' }}>
                    <p className="truncate font-medium">{v.title || 'untitled'}</p>
                    <p style={{ color: 'var(--vscode-text-secondary)' }}>{v.language} &middot; {new Date(v.saved_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center shrink-0" style={{ background: 'var(--vscode-tab)' }}>
            <div className="vscode-tab active"><FileCode size={12} /><span>{editTitle || paste.title}.{editing ? editLang : paste.language}</span></div>
          </div>
          <div className="flex-1 overflow-auto">
            {paste.password_protected && !decrypted ? (
              <div className="flex items-center justify-center h-full">
                <div className="p-8 rounded-lg border max-w-sm w-full" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
                  <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--vscode-accent)' }}>
                    <Lock size={18} /> <span className="font-semibold">Password Required</span>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'var(--vscode-text-secondary)' }}>This paste is password-protected.</p>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password" className="input-vscode w-full mb-2"
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
                  {passwordError && <p className="text-xs mb-2" style={{ color: '#f48771' }}>{passwordError}</p>}
                  <button onClick={handlePasswordSubmit} className="btn-vscode w-full text-sm">Unlock</button>
                </div>
              </div>
            ) : decrypting ? (
              <div className="flex items-center justify-center h-full gap-2 text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
                <Loader2 size={16} className="animate-spin" /> Decrypting...
              </div>
            ) : decryptError ? (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
                <Shield size={16} className="mr-2" /> Missing decryption key — this paste is end-to-end encrypted.
              </div>
            ) : editing ? (
              <MonacoEditor
                key="editor-edit"
                beforeMount={(monaco) => { registerMonacoThemes(monaco); }}
                height="100%"
                language={editLang}
                value={editContent}
                onChange={(val) => setEditContent(val || '')}
                theme={theme.monacoTheme}
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  wordWrap: 'on',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  padding: { top: 16, bottom: 16 },
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            ) : (
              <div className="relative h-full w-full">
                <pre className="h-full w-full overflow-auto font-mono text-sm leading-relaxed p-4 m-0" style={{ color: 'var(--vscode-text)', background: 'transparent', display: monacoReady ? 'none' : undefined }}>{displayContent}</pre>
                <MonacoEditor
                  key="editor-view"
                  beforeMount={(monaco) => { registerMonacoThemes(monaco); }}
                  onMount={() => { setMonacoReady(true); }}
                  height="100%"
                  language={paste.language}
                  value={displayContent}
                  theme={theme.monacoTheme}
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    readOnly: true,
                    domReadOnly: true,
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    padding: { top: 16, bottom: 16 },
                    automaticLayout: true,
                    tabSize: 2,
                    contextmenu: false,
                    quickSuggestions: false,
                    suggestOnTriggerCharacters: false,
                    parameterHints: { enabled: false },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <StatusBar
        language={paste.language}
        lineCount={lineCount}
        charCount={displayContent.length}
        wordCount={wordCount}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete paste"
        message="This will permanently delete this paste and all its versions. This action cannot be undone."
        confirmLabel="Delete forever"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeleting(false); }}
      />
    </div>
  );
}

