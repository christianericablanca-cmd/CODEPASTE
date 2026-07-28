'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Chrome, ArrowLeft, FileCode } from 'lucide-react';
import Link from 'next/link';

const demoCode = [
  "// ✨ Sign in to unlock paste management",
  "",
  "const myPastes = await api.pastes.list();",
  "// → returns all your pastes in one view",
  "",
  "await api.pastes.edit('abc123', {",
  "  content: encryptedContent,",
  "  visibility: 'private',",
  "  title: 'my-api-key.ts',",
  "});",
  "// → edit title, content, language & visibility",
  "",
  "await api.pastes.delete('abc123');",
  "// → remove pastes you no longer need",
  "",
  "const history = await api.pastes.history('abc123');",
  "// → version history with rollback support",
  "",
  "const key = await api.pastes.key('abc123');",
  "// → key escrow — never lose access",
];

function tokenize(code: string) {
  const tokens: { text: string; type: string }[] = [];
  const keywords = new Set(['const','await','return','new','import','export','from','function','if','else','for','of','in','true','false','null','undefined','async','interface','type','extends']);
  const builtins = new Set(['console','api','JSON','Promise','Array','Object','String','Number','Boolean']);
  let i = 0;
  while (i < code.length) {
    if (code[i] === '/' && code[i+1] === '/') { const s=i; while(i<code.length&&code[i]!=='\n')i++; tokens.push({text:code.slice(s,i),type:'cmt'}); continue; }
    if (code[i] === '`') { const s=i; i++; while(i<code.length&&code[i]!=='`')i++; if(i<code.length)i++; tokens.push({text:code.slice(s,i),type:'str'}); continue; }
    if (code[i] === "'" || code[i] === '"') { const q=code[i]; const s=i; i++; while(i<code.length&&code[i]!==q){if(code[i]==='\\')i++;i++;} if(i<code.length)i++; tokens.push({text:code.slice(s,i),type:'str'}); continue; }
    if (/\d/.test(code[i])) { const s=i; while(i<code.length&&/[\d.]/.test(code[i]))i++; tokens.push({text:code.slice(s,i),type:'num'}); continue; }
    if (/[a-zA-Z_$]/.test(code[i])) { const s=i; while(i<code.length&&/[\w$]/.test(code[i]))i++; const w=code.slice(s,i); if(keywords.has(w))tokens.push({text:w,type:'kw'}); else if(builtins.has(w))tokens.push({text:w,type:'builtin'}); else { let j=i; while(j<code.length&&code[j]===' ')j++; tokens.push({text:w,type:(j<code.length&&code[j]==='(')?'fn':'plain'}); } continue; }
    if (/[{}()\[\];,.:]/.test(code[i])) { tokens.push({text:code[i],type:'punc'}); i++; continue; }
    if (/\s/.test(code[i])) { const s=i; while(i<code.length&&/\s/.test(code[i]))i++; tokens.push({text:code.slice(s,i),type:'ws'}); continue; }
    tokens.push({text:code[i],type:'plain'}); i++;
  }
  return tokens;
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  const fullCode = useMemo(() => demoCode.join('\n'), []);
  const tokens = useMemo(() => tokenize(fullCode), [fullCode]);

  useEffect(() => {
    if (charIndex >= fullCode.length) return;
    const t = setInterval(() => {
      setCharIndex(i => Math.min(i + 1, fullCode.length));
    }, 12);
    return () => clearInterval(t);
  }, [charIndex, fullCode.length]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : `${location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  let remaining = charIndex;
  const parts: React.ReactNode[] = [];
  for (let ti = 0; ti < tokens.length; ti++) {
    if (remaining <= 0) break;
    const t = tokens[ti];
    const take = Math.min(remaining, t.text.length);
    remaining -= take;
    const text = t.text.slice(0, take);
    if (!text) continue;
    const cls = t.type === 'cmt' ? 'opacity-50 italic' : t.type === 'kw' ? 'text-[#c586c0]' : t.type === 'str' ? 'text-[#ce9178]' : t.type === 'num' ? 'text-[#b5cea8]' : t.type === 'builtin' ? 'text-[#dcdcaa]' : t.type === 'fn' ? 'text-[#dcdcaa]' : t.type === 'punc' ? '' : t.type === 'ws' ? '' : '';
    parts.push(<span key={ti} className={cls}>{text}</span>);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      <div className="w-full max-w-[1100px] flex flex-col-reverse md:flex-row rounded-lg border overflow-hidden" style={{ borderColor: 'var(--vscode-border)' }}>
        {/* Code panel - hide on small mobile, show on md+ */}
        <div className="flex-[2] hidden md:flex flex-col border-r" style={{ borderColor: 'var(--vscode-border)' }}>
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#27c93f' }} />
            </div>
            <div className="flex items-center gap-1.5 ml-4 px-3 py-1 rounded-t text-sm border-b-2" style={{ background: 'var(--vscode-tab)', borderColor: 'var(--vscode-accent)', color: 'var(--vscode-text)' }}>
              <FileCode size={14} />
              <span>benefits.ts</span>
            </div>
          </div>
          <div className="flex-1 p-6 sm:p-8 lg:p-10 overflow-auto flex items-center">
            <pre className="font-mono text-sm sm:text-base lg:text-lg leading-relaxed m-0 whitespace-pre" style={{ color: '#d4d4d4' }}>
              <code>{parts}</code>
              {charIndex < fullCode.length && (
                <span className="w-[2px] h-[1.1em] ml-0.5 align-middle" style={{ background: 'var(--vscode-accent)' }} />
              )}
            </pre>
          </div>
        </div>

        {/* Login panel */}
        <div className="w-full md:w-[420px] flex flex-col justify-center p-8 sm:p-10 lg:p-12 shrink-0" style={{ background: 'var(--vscode-sidebar)' }}>
          <Link href="/" className="text-sm flex items-center gap-1 mb-8 hover:opacity-80" style={{ color: 'var(--vscode-text-secondary)' }}>
            <ArrowLeft size={14} /> Back
          </Link>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--vscode-accent) 15%, transparent)' }}>
              <FileCode size={24} style={{ color: 'var(--vscode-accent)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--vscode-text)' }}>Sign in</h1>
            <p className="text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>Manage your pastes with full control.</p>
          </div>

          {error && (
            <div className="text-sm mb-6 p-3 rounded" style={{ background: '#3d1f1f', color: '#f48771' }}>
              {error}
            </div>
          )}

          <button onClick={handleGoogleLogin} disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 text-base rounded-lg border font-medium transition-all cursor-pointer hover:opacity-90 active:scale-[0.98] mb-6"
            style={{ background: 'var(--vscode-input)', color: 'var(--vscode-text)', borderColor: 'var(--vscode-border)' }}>
            <Chrome size={20} />
            {loading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
            <div className="font-semibold mb-3 text-base" style={{ color: 'var(--vscode-text)' }}>You get:</div>
            <ul className="space-y-2.5">
              {[
                ['Edit & delete pastes', 'c586c0'],
                ['Private & unlisted visibility', 'ce9178'],
                ['Version history & rollback', 'b5cea8'],
                ['Key escrow — never lose access', 'dcdcaa'],
                ['API tokens & data export', '27c93f'],
              ].map(([text, color], i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: `#${color}` }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
