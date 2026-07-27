'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useTheme } from '@/lib/theme-context';
import { themes } from '@/lib/themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotification, Notification } from '@/components/notification';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Save, ArrowLeft, Trash2, Key, Plus, X, Copy, Check, Download } from 'lucide-react';

interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export default function SettingsPage() {
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme, setTheme, editorFontSize, setEditorFontSize, wordWrap, setWordWrap, minimap, setMinimap } = useTheme();

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [rawToken, setRawToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const { notification, showNotification } = useNotification();

  const supabase = createClient();

  const fetchTokens = async () => {
    const res = await fetch('/api/tokens');
    if (res.ok) {
      const { tokens } = await res.json();
      setTokens(tokens || []);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      const res = await fetch('/api/profile');
      if (res.ok) {
        const { profile } = await res.json();
        setNickname(profile.nickname || '');
        if (profile.preferences?.theme) {
          const t = themes.find((x: { id: string }) => x.id === profile.preferences.theme);
          if (t) setTheme(t);
        }
      }
      await fetchTokens();
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    const preferences = { theme: theme.id, editorFontSize, wordWrap, minimap };
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim() || 'dev', preferences }),
    });
    if (res.ok) { setSaved(true); showNotification('Settings saved', 'success'); }
    else { setError('Failed to save'); showNotification('Failed to save', 'error'); }
    setSaving(false);
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) return;
    setCreatingToken(true);
    const res = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTokenName.trim() }),
    });
    if (res.ok) {
      const { token } = await res.json();
      setRawToken(token.raw_token);
      setNewTokenName('');
      showNotification('Token created', 'success');
      await fetchTokens();
    } else {
      showNotification('Failed to create token', 'error');
    }
    setCreatingToken(false);
  };

  const handleRevokeToken = async (id: string) => {
    setConfirmRevoke(null);
    const res = await fetch(`/api/tokens/${id}`, { method: 'DELETE' });
    if (res.ok) { showNotification('Token revoked', 'success'); await fetchTokens(); }
    else showNotification('Failed to revoke', 'error');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <header className="flex items-center gap-3 sm:gap-4 px-3 sm:px-6 py-3 border-b shrink-0" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <Link href="/my-pastes" className="hover:text-[var(--vscode-text)] transition-colors" style={{ color: 'var(--vscode-text-secondary)' }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 className="font-bold text-sm sm:text-base text-[var(--vscode-accent)]">Settings</h1>
      </header>

      {notification && <Notification notification={notification} />}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--vscode-text-secondary)' }}>Profile</h2>
          <div className="space-y-3">
            <label className="text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>Nickname</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)}
              placeholder="Your display name" className="input-vscode w-full" maxLength={30} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--vscode-text-secondary)' }}>Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-2 block" style={{ color: 'var(--vscode-text-secondary)' }}>Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => (
                  <button key={t.id} onClick={() => setTheme(t)}
                    className="px-2 py-2 text-xs rounded border text-center transition-colors"
                    style={{
                      background: theme.id === t.id ? 'var(--vscode-selection)' : 'var(--vscode-input)',
                      borderColor: theme.id === t.id ? 'var(--vscode-accent)' : 'var(--vscode-border)',
                      color: theme.id === t.id ? 'var(--vscode-text)' : 'var(--vscode-text-secondary)',
                    }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>Font size: {editorFontSize}px</span>
              <input type="range" min="10" max="24" value={editorFontSize}
                onChange={(e) => setEditorFontSize(Number(e.target.value))}
                className="w-32" />
            </div>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} />
              Word wrap
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={minimap} onChange={(e) => setMinimap(e.target.checked)} />
              Minimap
            </label>
          </div>
        </section>

        {error && <p className="text-xs" style={{ color: '#f48771' }}>{error}</p>}
        {saved && <p className="text-xs" style={{ color: '#7ecb7e' }}>Saved!</p>}

        <button onClick={handleSave} disabled={saving}
          className="btn-vscode flex items-center gap-2 text-sm">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {/* API Tokens */}
        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--vscode-text-secondary)' }}>API Tokens</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--vscode-text-secondary)' }}>
            Use tokens to create and manage pastes programmatically.{' '}
            <Link href="/api-docs" className="underline" style={{ color: 'var(--vscode-accent)' }}>View API docs</Link>
          </p>

          {rawToken && (
            <div className="p-3 mb-3 rounded border" style={{ background: 'var(--vscode-selection)', borderColor: 'var(--vscode-accent)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--vscode-accent)' }}>Token created — copy it now, you won&apos;t see it again!</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs p-2 rounded break-all" style={{ background: 'var(--vscode-input)', color: 'var(--vscode-text)' }}>{rawToken}</code>
                <button onClick={() => { navigator.clipboard.writeText(rawToken); setCopied(true); setTimeout(() => setCopied(false), 2000); showNotification('Token copied', 'success'); }}
                  className="btn-vscode text-xs flex items-center gap-1">
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <input value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="Token name (e.g. CI script)" className="input-vscode flex-1 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateToken()} />
            <button onClick={handleCreateToken} disabled={creatingToken || !newTokenName.trim()}
              className="btn-vscode flex items-center gap-1 text-sm">
              <Plus size={14} /> {creatingToken ? 'Creating...' : 'Create'}
            </button>
          </div>

          <div className="space-y-1">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded border text-xs"
                style={{ borderColor: 'var(--vscode-border)' }}>
                <Key size={12} style={{ color: 'var(--vscode-accent)' }} />
                <span className="flex-1">{t.name}</span>
                <span style={{ color: 'var(--vscode-text-secondary)' }}>{t.prefix}</span>
                <span style={{ color: 'var(--vscode-text-secondary)' }}>
                  {t.last_used_at ? `Used ${new Date(t.last_used_at).toLocaleDateString()}` : 'Never used'}
                </span>
                <button onClick={() => setConfirmRevoke(t.id)}
                  className="hover:text-[#f48771] transition-colors"><X size={14} /></button>
              </div>
            ))}
            {tokens.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>No tokens yet.</p>
            )}
          </div>
        </section>

        {/* Export */}
        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--vscode-text-secondary)' }}>Export Data</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--vscode-text-secondary)' }}>
            Download all your pastes as a JSON file.
          </p>
          <a href="/api/export" className="btn-vscode inline-flex items-center gap-2 text-sm no-underline">
            <Download size={14} /> Export as JSON
          </a>
        </section>

        {/* Danger zone */}
        <hr className="border-t" style={{ borderColor: 'var(--vscode-border)' }} />
        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#f48771' }}>Danger Zone</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--vscode-text-secondary)' }}>
            Delete your account and all your pastes permanently. This cannot be undone.
          </p>
          <button onClick={() => setConfirmDeleteAccount(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded border transition-colors cursor-pointer"
            style={{ borderColor: '#f48771', color: '#f48771' }}>
            <Trash2 size={14} /> Delete Account
          </button>
        </section>
      </main>

      <ConfirmDialog
        open={confirmRevoke !== null}
        title="Revoke token"
        message="Revoke this token? Any scripts or applications using it will immediately stop working."
        confirmLabel="Revoke"
        onConfirm={() => handleRevokeToken(confirmRevoke!)}
        onCancel={() => setConfirmRevoke(null)}
      />

      <ConfirmDialog
        open={confirmDeleteAccount}
        title="Delete account"
        message="This will permanently delete your account and ALL your pastes. This action cannot be undone. Are you sure?"
        confirmLabel="Delete everything"
        onConfirm={async () => {
          setConfirmDeleteAccount(false);
          try {
            const res = await fetch('/api/profile', { method: 'DELETE' });
            if (res.ok) {
              showNotification('Account deleted', 'success');
              await supabase.auth.signOut();
              router.push('/');
            } else {
              showNotification('Failed to delete account', 'error');
            }
          } catch { showNotification('Network error', 'error'); }
        }}
        onCancel={() => setConfirmDeleteAccount(false)}
      />
    </div>
  );
}
