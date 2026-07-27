'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ActivityBar } from '@/components/activity-bar';
import { StatusBar } from '@/components/status-bar';
import { ThemePanel } from '@/components/theme-panel';
import { FileCode, Copy, Check, Clock, Eye, Shield, Loader2, Trash2, Edit3, GitFork, Lock, Save, X, History } from 'lucide-react';
import { decrypt, unwrapE2EEKey, generateKey, encrypt } from '@/lib/crypto';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/toast';
import { languages, themes } from '@/lib/themes';
import { useTheme } from '@/lib/theme-context';
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

export function PasteViewer({ paste, isOwner: serverIsOwner }: { paste: PasteData; isOwner: boolean }) {
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
  const router = useRouter();
const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    if (!paste.password_protected) {
      doDecrypt('');
    }
  }, [paste.content]);

  useEffect(() => {
    if (serverIsOwner) { setIsOwner(true); return; }
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === paste.user_id) setIsOwner(true);
    })();
  }, [serverIsOwner, paste.user_id]);

  const doDecrypt = async (keyOverride?: string) => {
    setDecrypting(true);
    setDecryptError(false);
    try {
      const hash = window.location.hash.replace('#', '');
      const sessionKey = sessionStorage.getItem(`paste-key-${paste.slug}`);
      const key = keyOverride || hash || sessionKey;
      if (key) {
        const plaintext = await decrypt(paste.content, key);
        setDecrypted(plaintext);
      } else {
        setDecryptError(true);
      }
    } catch {
      setDecryptError(true);
    } finally {
      setDecrypting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordError('');
    try {
      const e2eeKey = await unwrapE2EEKey(
        paste.wrapped_key!, password,
        paste.wrapped_key_salt!, paste.wrapped_key_iv!
      );
      await doDecrypt(e2eeKey);
    } catch {
      setPasswordError('Wrong password');
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
    if (!confirm('Delete this paste permanently?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pastes/${paste.slug}`, { method: 'DELETE' });
      if (res.ok) router.push('/');
      else toast('Failed to delete');
    } catch { toast('Network error'); } finally { setDeleting(false); }
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
      if (res.ok) router.push(`/p/${data.slug}#${encryptionKey}`);
      else toast('Failed to fork');
    } catch { toast('Network error'); } finally { setForking(false); }
  };

  const startEdit = () => {
    setEditContent(displayContent);
    setEditTitle(paste.title);
    setEditLang(paste.language);
    setEditVis(paste.visibility);
    setEditing(true);
  };

  const handleSaveEdit = useCallback(async () => {
    setSaving(true);
    try {
      const encryptionKey = await generateKey();
      const encryptedContent = await encrypt(editContent, encryptionKey);
      const res = await fetch(`/api/pastes/${paste.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: encryptedContent,
          title: editTitle,
          language: editLang,
          visibility: editVis,
        }),
      });
      if (res.ok) {
        setDecrypted(editContent);
        setEditing(false);
        window.location.hash = encryptionKey;
      } else {
        toast('Failed to save');
      }
    } catch { toast('Network error'); } finally { setSaving(false); }
  }, [editContent, editTitle, editLang, editVis, paste.slug]);

  const createdDate = new Date(paste.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <div className="flex items-center gap-4 px-4 py-2 border-b shrink-0" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <a href="/" className="font-bold text-base tracking-tight" style={{ color: 'var(--vscode-accent)' }}>CodePaste</a>
        {editing ? (
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            className="input-vscode max-w-[180px] text-sm" />
        ) : (
          <span className="text-sm truncate" style={{ color: 'var(--vscode-text-secondary)' }}>{paste.title}</span>
        )}
        {editing ? (
          <select value={editLang} onChange={(e) => setEditLang(e.target.value)}
            className="input-vscode text-xs max-w-[100px]">
            {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--vscode-selection)', color: 'var(--vscode-text-secondary)' }}>{paste.language}</span>
        )}
        {editing && (
          <select value={editVis} onChange={(e) => setEditVis(e.target.value)}
            className="input-vscode text-xs max-w-[90px]">
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>
          <span className="flex items-center gap-1"><Clock size={12} /> {createdDate}</span>
          <span className="flex items-center gap-1"><Eye size={12} /> {paste.views || 0}</span>
          {paste.password_protected && (
            <span className="flex items-center gap-1" style={{ color: 'var(--vscode-status)' }}><Lock size={12} /> Password</span>
          )}
          {isEncrypted && (
            <span className="flex items-center gap-1" style={{ color: 'var(--vscode-accent)' }}><Shield size={12} /> E2EE</span>
          )}
        </div>

        {!editing && (
          <>
            <button onClick={copyCode} className="btn-vscode flex items-center gap-2 text-sm">
              {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleFork} disabled={forking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors"
              style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
              <GitFork size={12} /> {forking ? 'Forking...' : 'Fork'}
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors"
                style={{ borderColor: showHistory ? 'var(--vscode-accent)' : 'var(--vscode-border)', color: showHistory ? 'var(--vscode-accent)' : 'var(--vscode-text-secondary)' }}>
                <History size={12} /> History
              </button>
            )}
            {isOwner && (
              <button onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors"
                style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
                <Edit3 size={12} /> Edit
              </button>
            )}
            {isOwner && (
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors"
                style={{ borderColor: '#f48771', color: '#f48771' }}>
                <Trash2 size={12} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </>
        )}
        {editing && (
          <>
            <button onClick={handleSaveEdit} disabled={saving}
              className="btn-vscode flex items-center gap-2 text-sm">
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors"
              style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
              <X size={12} /> Cancel
            </button>
          </>
        )}
      </div>

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
              <MonacoEditor
                beforeMount={(monaco) => { registerMonacoThemes(monaco); }}
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
    </div>
  );
}

