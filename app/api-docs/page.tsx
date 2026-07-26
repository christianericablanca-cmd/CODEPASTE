import React from 'react';
import Link from 'next/link';
import { FileCode, ArrowLeft } from 'lucide-react';

const curl = (code: string) => (
  <pre className="text-sm p-4 rounded overflow-x-auto my-3" style={{ background: 'var(--vscode-input)', color: 'var(--vscode-text)' }}>
    <code>{code}</code>
  </pre>
);

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <header className="flex items-center gap-4 px-6 py-3 border-b shrink-0" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <Link href="/" className="hover:text-[var(--vscode-text)] transition-colors" style={{ color: 'var(--vscode-text-secondary)' }}>
          <ArrowLeft size={18} />
        </Link>
        <span className="font-bold text-base" style={{ color: 'var(--vscode-accent)' }}>API Documentation</span>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--vscode-selection)', color: 'var(--vscode-text-secondary)' }}>v1</span>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-10">
        <section>
          <h2 className="text-lg font-bold mb-2">Authentication</h2>
          <p className="text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
            Generate an API token in your <Link href="/settings" className="underline" style={{ color: 'var(--vscode-accent)' }}>settings</Link> page.
            Include it in the <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--vscode-selection)' }}>Authorization</code> header.
          </p>
          {curl(`curl -H "Authorization: Bearer cp_your_token_here" \\\n  https://codepaste.app/api/pastes`)}
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">List Your Pastes</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--vscode-text-secondary)' }}>GET /api/pastes</p>
          {curl(`curl -H "Authorization: Bearer cp_your_token_here" \\\n  https://codepaste.app/api/pastes?limit=10&offset=0`)}
          <p className="text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>Returns your pastes (public + private). Omit token to get only public pastes.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Create a Paste</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--vscode-text-secondary)' }}>POST /api/pastes</p>
          {curl(`curl -X POST -H "Authorization: Bearer cp_your_token_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"content":"Hello world!","language":"plaintext","title":"my-paste","visibility":"public"}' \\\n  https://codepaste.app/api/pastes`)}
          <div className="space-y-1 text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>
            <p><strong style={{ color: 'var(--vscode-text)' }}>body parameters:</strong></p>
            <p><code className="px-1 py-0.5 rounded" style={{ background: 'var(--vscode-selection)' }}>content</code> (required) — The paste content (max 1MB)</p>
            <p><code className="px-1 py-0.5 rounded" style={{ background: 'var(--vscode-selection)' }}>language</code> — Syntax language (default: plaintext)</p>
            <p><code className="px-1 py-0.5 rounded" style={{ background: 'var(--vscode-selection)' }}>title</code> — Paste title (default: untitled)</p>
            <p><code className="px-1 py-0.5 rounded" style={{ background: 'var(--vscode-selection)' }}>visibility</code> — public, unlisted, or private (default: public)</p>
            <p><code className="px-1 py-0.5 rounded" style={{ background: 'var(--vscode-selection)' }}>expiresIn</code> — 10min, 1hour, 1day, 1week, 1month</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Get a Paste</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--vscode-text-secondary)' }}>GET /api/pastes/[slug]</p>
          {curl(`curl https://codepaste.app/api/pastes/abc123`)}
          <p className="text-xs" style={{ color: 'var(--vscode-text-secondary)' }}>Returns the paste metadata (content is encrypted, use the web UI to view).</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Delete a Paste</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--vscode-text-secondary)' }}>DELETE /api/pastes/[slug]</p>
          {curl(`curl -X DELETE -H "Authorization: Bearer cp_your_token_here" \\\n  https://codepaste.app/api/pastes/abc123`)}
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Response Format</h2>
          {curl(`{
  "pastes": [
    {
      "slug": "abc123",
      "title": "my-paste",
      "language": "plaintext",
      "visibility": "public",
      "created_at": "2026-07-26T...",
      "views": 0
    }
  ]
}`)}
        </section>

        <footer className="text-xs pt-6 border-t" style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
          <Link href="/settings" className="underline" style={{ color: 'var(--vscode-accent)' }}>Generate an API token</Link> to get started.
        </footer>
      </main>
    </div>
  );
}
