import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <span className="text-6xl font-bold" style={{ color: 'var(--vscode-accent)' }}>404</span>
      <p className="text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>This page doesn&apos;t exist.</p>
      <Link href="/" className="btn-vscode no-underline text-sm">Go home</Link>
    </div>
  );
}
