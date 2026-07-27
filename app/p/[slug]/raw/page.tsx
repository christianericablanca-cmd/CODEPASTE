'use client';

import { useState, useEffect } from 'react';
import { decrypt } from '@/lib/crypto';
import { Loader2, Shield, Lock } from 'lucide-react';

export default function RawPastePage({ params }: { params: { slug: string } }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const hash = window.location.hash.replace('#', '');
        let key = hash || '';

        if (!key) {
          try {
            const res = await fetch(`/api/pastes/${params.slug}/key`);
            if (res.ok) {
              const data = await res.json();
              key = data.key || '';
            }
          } catch {}
        }

        const res = await fetch(`/api/pastes/${params.slug}`);
        if (!res.ok) { setError('Paste not found'); setLoading(false); return; }
        const { paste } = await res.json();

        if (paste.password_protected) {
          setError('This paste is password-protected. Open it in the viewer to unlock.');
          setLoading(false);
          return;
        }

        if (key) {
          const plaintext = await decrypt(paste.content, key);
          setContent(plaintext);
        } else {
          setError('Missing decryption key');
        }
      } catch {
        setError('Failed to load paste');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center gap-2" style={{ background: '#1e1e1e', color: '#9ca3af' }}>
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 px-4" style={{ background: '#1e1e1e', color: '#9ca3af' }}>
        {error.includes('password') ? <Lock size={24} /> : <Shield size={24} />}
        <p className="text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <main>
      <h1 className="sr-only">Raw paste - {params.slug}</h1>
      <pre className="h-dvh overflow-auto p-3 sm:p-6 text-xs sm:text-sm leading-relaxed m-0" style={{
        background: '#1e1e1e', color: '#d4d4d4',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>{content}</pre>
    </main>
  );
}
