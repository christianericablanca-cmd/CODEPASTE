'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Chrome } from 'lucide-react';

export default function SignupPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <div className="w-full max-w-sm p-8 rounded-lg border" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <h1 className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--vscode-accent)' }}>Create an account</h1>
        <p className="text-xs text-center mb-6" style={{ color: 'var(--vscode-text-secondary)' }}>Sign up with Google to get started</p>
        {error && <p className="text-xs mb-4 text-center" style={{ color: '#f48771' }}>{error}</p>}
        <button onClick={handleGoogleSignup} disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm rounded border font-medium transition-colors cursor-pointer"
          style={{ background: 'var(--vscode-input)', color: 'var(--vscode-text)', borderColor: 'var(--vscode-border)' }}>
          <Chrome size={18} />
          {loading ? 'Redirecting...' : 'Sign up with Google'}
        </button>
      </div>
    </div>
  );
}
