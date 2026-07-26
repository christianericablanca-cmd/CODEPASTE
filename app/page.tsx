'use client';

import Link from 'next/link';
import { FileCode, Shield, Zap, Globe, Lock, Clock, ChevronRight, Terminal, Sparkles, Eye } from 'lucide-react';
import { AuthStatus } from '@/components/auth-status';
import { useEffect, useState, useMemo, ReactNode } from 'react';

const features = [
  { icon: Shield, title: 'End-to-End Encrypted', desc: 'Your code is encrypted in your browser before it ever reaches a server. Even we can\'t read your pastes.' },
  { icon: Zap, title: 'Multi-Tab Editor', desc: 'VS Code-inspired editor with multiple tabs, inline renaming, syntax highlighting, and 15 themes.' },
  { icon: Globe, title: '15 Themes', desc: 'Dark+, Nord, Dracula, Tokyo Night, Monokai, and more — with matching syntax colors.' },
  { icon: Lock, title: 'Password Protection', desc: 'Optional password layer on top of E2EE. Share the key out of band, keep your code safe.' },
  { icon: FileCode, title: '23 Languages', desc: 'TypeScript, JavaScript, Python, Rust, Go, and more. Full Monaco syntax highlighting.' },
  { icon: Clock, title: 'Auto-Expiry', desc: 'Set pastes to expire from 10 minutes to 1 month. Nothing lingers longer than it should.' },
];

const codeLines = [
  'const greet = (name: string): string => {',
  "  return `Hello, ${name}! Welcome to CodePaste.`;",
  '};',
  '',
  "console.log(greet('Developer'));",
  '',
  '// Share your code with a single link',
  "const url = 'https://codepaste.app/p/abc123';",
  "console.log('Share this:', url);",
];

function AnimatedCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <>{display.toLocaleString()}</>;
}

function tokenize(code: string): { text: string; type: string }[] {
  const tokens: { text: string; type: string }[] = [];
  const keywords = new Set(['const','let','var','function','return','if','else','for','while','class','import','export','from','new','typeof','in','of','as','true','false','null','undefined','this','async','await','import','extends','implements','interface','type']);
  const builtins = new Set(['console','Math','JSON','Array','Object','String','Number','Boolean','Date','RegExp','Error','Promise','Map','Set','parseInt','parseFloat','setTimeout','setInterval','fetch','require','module','process','Buffer','setImmediate','clearTimeout','clearInterval']);
  const typeNames = new Set(['string','number','boolean','void','any','never','unknown','Record','Partial','Required','Pick','Omit','Exclude','Extract']);
  let i = 0;
  while (i < code.length) {
    if (code[i] === '/' && code[i+1] === '/') {
      const s = i; while (i < code.length && code[i] !== '\n') i++;
      tokens.push({ text: code.slice(s, i), type: 'cmt' }); continue;
    }
    if (code[i] === '`') {
      const s = i; i++;
      while (i < code.length && code[i] !== '`') { if (code[i] === '$' && code[i+1] === '{') i++; i++; }
      if (i < code.length) i++;
      tokens.push({ text: code.slice(s, i), type: 'tmpl' }); continue;
    }
    if (code[i] === "'" || code[i] === '"') {
      const q = code[i]; const s = i; i++;
      while (i < code.length && code[i] !== q) { if (code[i] === '\\') i++; i++; }
      if (i < code.length) i++;
      tokens.push({ text: code.slice(s, i), type: 'str' }); continue;
    }
    if (/\d/.test(code[i])) {
      const s = i; while (i < code.length && /[\d.]/.test(code[i])) i++;
      tokens.push({ text: code.slice(s, i), type: 'num' }); continue;
    }
    if (/[a-zA-Z_$]/.test(code[i])) {
      const s = i; while (i < code.length && /[\w$]/.test(code[i])) i++;
      const w = code.slice(s, i);
      if (keywords.has(w)) tokens.push({ text: w, type: 'kw' });
      else if (typeNames.has(w)) tokens.push({ text: w, type: 'type' });
      else if (builtins.has(w)) tokens.push({ text: w, type: 'builtin' });
      else {
        let j = i; while (j < code.length && code[j] === ' ') j++;
        tokens.push({ text: w, type: (j < code.length && code[j] === '(') ? 'fn' : 'plain' });
      }
      continue;
    }
    if (code[i] === '=' && code[i+1] === '>') { tokens.push({ text: '=>', type: 'kw' }); i += 2; continue; }
    if (/[+\-*/%=<>!&|^~]/.test(code[i])) { tokens.push({ text: code[i], type: 'op' }); i++; continue; }
    if (/[{}()\[\];,.:]/.test(code[i])) { tokens.push({ text: code[i], type: 'punc' }); i++; continue; }
    if (/\s/.test(code[i])) { const s = i; while (i < code.length && /\s/.test(code[i])) i++; tokens.push({ text: code.slice(s, i), type: 'ws' }); continue; }
    tokens.push({ text: code[i], type: 'plain' }); i++;
  }
  return tokens;
}

function TypeWriter({ lines, className }: { lines: string[]; className?: string }) {
  const [charIndex, setCharIndex] = useState(0);
  const fullCode = useMemo(() => lines.join('\n'), [lines]);
  const tokens = useMemo(() => tokenize(fullCode), [fullCode]);

  useEffect(() => {
    setCharIndex(0);
    const total = fullCode.length;
    if (total === 0) return;
    const timer = setInterval(() => {
      setCharIndex(prev => prev >= total ? (clearInterval(timer), prev) : prev + 1);
    }, 20);
    return () => clearInterval(timer);
  }, [fullCode]);

  let remaining = charIndex;
  const parts: ReactNode[] = [];
  for (let ti = 0; ti < tokens.length; ti++) {
    if (remaining <= 0) break;
    const t = tokens[ti];
    const take = Math.min(remaining, t.text.length);
    remaining -= take;
    const text = t.text.slice(0, take);
    if (!text) continue;
    parts.push(t.type === 'ws' ? <span key={ti}>{text}</span> : <span key={ti} className={`sy-${t.type}`}>{text}</span>);
  }

  return <code className={className}>{parts}</code>;
}

function useVisibleFeatures(count: number) {
  const [visible, setVisible] = useState<number[]>([]);
  useEffect(() => {
    const timers = Array.from({ length: count }, (_, i) =>
      setTimeout(() => setVisible(p => [...p, i]), 500 + i * 120)
    );
    return () => timers.forEach(clearTimeout);
  }, [count]);
  return visible;
}

export default function LandingPage() {
  const [count, setCount] = useState<number | null>(null);
  const [heroIn, setHeroIn] = useState(false);
  const visibleFeatures = useVisibleFeatures(features.length);

  useEffect(() => {
    setHeroIn(true);
    fetch('/api/pastes?count=true')
      .then(r => r.json())
      .then(data => { if (typeof data.count === 'number') setCount(data.count); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: 'var(--vscode-bg)', color: 'var(--vscode-text)' }}>
      {/* Animated grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(var(--vscode-text) 1px, transparent 1px), linear-gradient(90deg, var(--vscode-text) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Nav */}
      <header className="relative flex items-center justify-between px-6 py-3 border-b shrink-0 z-10"
        style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <div className="flex items-center gap-8">
          <span className="font-bold text-lg tracking-tight flex items-center gap-2" style={{ color: 'var(--vscode-accent)' }}>
            <FileCode size={20} />
            CodePaste
          </span>
          <nav className="flex items-center gap-6 text-sm" style={{ color: 'var(--vscode-text-secondary)' }}>
            <Link href="/new" className="hover:text-[var(--vscode-text)] transition-colors">New Paste</Link>
            <Link href="/api-docs" className="hover:text-[var(--vscode-text)] transition-colors">API</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <AuthStatus />
          <Link href="/new" className="btn-vscode flex items-center gap-2 text-sm no-underline">
            <Sparkles size={14} />
            Create Paste
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none opacity-15 blur-3xl animate-float"
          style={{ background: `radial-gradient(circle, var(--vscode-accent) 0%, transparent 70%)` }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none opacity-10 blur-3xl animate-float"
          style={{ background: `radial-gradient(circle, #a855f7 0%, transparent 70%)`, animationDelay: '-2s' }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Badge */}
          <div className={`${heroIn ? 'animate-fade-in' : 'opacity-0'}`}
            style={heroIn ? { animationDelay: '0.1s' } : undefined}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-8 border"
              style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
              <span className="relative w-2 h-2 rounded-full" style={{ background: 'var(--vscode-status)' }}>
                <span className="absolute inset-0 rounded-full" style={{ background: 'var(--vscode-status)', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.4 }} />
              </span>
              {count !== null ? (
                <><AnimatedCounter target={count} /> pastes created</>
              ) : 'Private & encrypted'}
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            <span className={`inline-block ${heroIn ? 'animate-slide-up' : 'opacity-0'}`}
              style={heroIn ? { animationDelay: '0.2s' } : undefined}>
              Paste code.{' '}
            </span>
            <br />
            <span className={`inline-block ${heroIn ? 'animate-slide-up' : 'opacity-0'}`}
              style={heroIn ? { animationDelay: '0.4s' } : undefined}>
              <span className="bg-gradient-to-r from-[var(--vscode-accent)] via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Share instantly.
              </span>
            </span>
          </h1>

          <p className={`text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${heroIn ? 'animate-slide-up' : 'opacity-0'}`}
            style={{ color: 'var(--vscode-text-secondary)', ...(heroIn ? { animationDelay: '0.6s' } : {}) }}>
            A private, encrypted pastebin with a full VS Code-style editor.
            TypeScript, JavaScript, Python — paste any code, set a password, and share a link.
          </p>

          {/* CTA */}
          <div className={`flex items-center justify-center gap-4 flex-wrap ${heroIn ? 'animate-slide-up' : 'opacity-0'}`}
            style={heroIn ? { animationDelay: '0.8s' } : undefined}>
            <Link href="/new"
              className="group relative flex items-center gap-2 px-8 py-3.5 text-base rounded-lg font-semibold no-underline overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ background: 'var(--vscode-button)', color: 'var(--vscode-button-text, #ffffff)', boxShadow: '0 0 20px rgba(0,122,204,0.15)' }}>
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />
              <Sparkles size={18} className="relative z-10" />
              <span className="relative z-10">Create a Paste</span>
              <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features"
              className="px-8 py-3.5 text-base rounded-lg border font-medium transition-all duration-300 no-underline hover:scale-105 hover:border-[var(--vscode-accent)]/50"
              style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
              <Eye size={16} className="inline mr-1.5 -mt-0.5" />
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Code preview */}
      <section className="relative px-6 pb-16">
        <div className={`max-w-4xl mx-auto rounded-xl overflow-hidden border ${heroIn ? 'animate-slide-up' : 'opacity-0'}`}
          style={{ borderColor: 'var(--vscode-border)', ...(heroIn ? { animationDelay: '1s' } : {}) }}>
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ background: 'var(--vscode-tab)', borderColor: 'var(--vscode-border)' }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs ml-3 flex items-center gap-1.5" style={{ color: 'var(--vscode-text-secondary)' }}>
              <Terminal size={12} />
              hello-world.ts
            </span>
          </div>
          <pre className="p-5 text-sm overflow-x-auto min-h-[220px] leading-relaxed" style={{ background: 'var(--vscode-bg)' }}>
            <TypeWriter lines={codeLines} />
            <span className="inline-block w-[2px] h-[1em] ml-0.5 align-middle animate-blink" style={{ background: 'var(--vscode-accent)' }} />
          </pre>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-20 border-t" style={{ borderColor: 'var(--vscode-border)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why CodePaste?</h2>
          <p className="text-center mb-14 max-w-xl mx-auto" style={{ color: 'var(--vscode-text-secondary)' }}>
            Everything you need for sharing code, nothing you don&apos;t.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title}
                className="group rounded-xl border p-6 transition-all duration-500"
                style={{
                  background: 'var(--vscode-sidebar)',
                  borderColor: 'var(--vscode-border)',
                  opacity: visibleFeatures.includes(i) ? 1 : 0,
                  transform: visibleFeatures.includes(i) ? 'translateY(0)' : 'translateY(24px)',
                  transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease',
                }}>
                <div className="mb-3 w-fit p-2.5 rounded-lg transition-all duration-300 group-hover:bg-[var(--vscode-accent)]/10 group-hover:scale-110"
                  style={{ background: 'var(--vscode-accent)' }}>
                  <f.icon size={22} style={{ color: 'var(--vscode-button-text, #ffffff)' }} />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--vscode-text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-6 border-t text-xs" style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} CodePaste. Built for developers.</span>
          <div className="flex items-center gap-4">
            <Link href="/new" className="hover:text-[var(--vscode-text)] transition-colors">New Paste</Link>
            <Link href="/api-docs" className="hover:text-[var(--vscode-text)] transition-colors">API</Link>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}