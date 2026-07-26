import type { editor } from 'monaco-editor';

type Monaco = typeof import('monaco-editor');

interface TokenColor {
  token: string;
  foreground?: string;
  fontStyle?: string;
}

interface MonacoTheme {
  base: 'vs' | 'vs-dark' | 'hc-black';
  inherit: boolean;
  colors: Record<string, string>;
  rules: TokenColor[];
}

function defineTheme(monaco: Monaco, name: string, theme: MonacoTheme) {
  monaco.editor.defineTheme(name, theme);
}

export function registerMonacoThemes(monaco: Monaco) {
  defineTheme(monaco, 'monokai', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#272822', 'editor.foreground': '#f8f8f2' },
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
    ],
  });

  defineTheme(monaco, 'nord', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#2e3440', 'editor.foreground': '#d8dee9' },
    rules: [
      { token: 'comment', foreground: '616e88', fontStyle: 'italic' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'type', foreground: '8fbcbb' },
      { token: 'function', foreground: '88c0d0' },
    ],
  });

  defineTheme(monaco, 'one-dark', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#282c34', 'editor.foreground': '#abb2bf' },
    rules: [
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'type', foreground: 'e5c07b' },
      { token: 'function', foreground: '61afef' },
    ],
  });

  defineTheme(monaco, 'github-dark', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#0d1117', 'editor.foreground': '#c9d1d9' },
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
    ],
  });

  defineTheme(monaco, 'dracula', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#282a36', 'editor.foreground': '#f8f8f2' },
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'type', foreground: '8be9fd' },
      { token: 'function', foreground: '50fa7b' },
    ],
  });

  defineTheme(monaco, 'tokyo-night', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#1a1b26', 'editor.foreground': '#a9b1d6' },
    rules: [
      { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'bb9af7' },
      { token: 'string', foreground: '9ece6a' },
      { token: 'number', foreground: 'ff9e64' },
      { token: 'type', foreground: '2ac3de' },
      { token: 'function', foreground: '7aa2f7' },
    ],
  });

  defineTheme(monaco, 'synthwave', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#2b213a', 'editor.foreground': '#e2e8f0' },
    rules: [
      { token: 'comment', foreground: '6c6783', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7edb' },
      { token: 'string', foreground: 'ffea76' },
      { token: 'number', foreground: 'bf7af0' },
      { token: 'type', foreground: '7ddfff' },
      { token: 'function', foreground: 'f29e74' },
    ],
  });

  defineTheme(monaco, 'catppuccin', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#1e1e2e', 'editor.foreground': '#cdd6f4' },
    rules: [
      { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'cba6f7' },
      { token: 'string', foreground: 'a6e3a1' },
      { token: 'number', foreground: 'fab387' },
      { token: 'type', foreground: '89b4fa' },
      { token: 'function', foreground: '89dceb' },
    ],
  });

  defineTheme(monaco, 'night-owl', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#011627', 'editor.foreground': '#d6deeb' },
    rules: [
      { token: 'comment', foreground: '637777', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c792ea' },
      { token: 'string', foreground: 'ecc48d' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'type', foreground: '82aaff' },
      { token: 'function', foreground: '82aaff' },
    ],
  });

  defineTheme(monaco, 'gruvbox', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#282828', 'editor.foreground': '#ebdbb2' },
    rules: [
      { token: 'comment', foreground: '928374', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'fb4934' },
      { token: 'string', foreground: 'b8bb26' },
      { token: 'number', foreground: 'd3869b' },
      { token: 'type', foreground: 'fabd2f' },
      { token: 'function', foreground: '8ec07c' },
    ],
  });

  defineTheme(monaco, 'ayu-dark', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#0f1419', 'editor.foreground': '#e6e1cf' },
    rules: [
      { token: 'comment', foreground: '5c6773', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7733' },
      { token: 'string', foreground: 'c2d94c' },
      { token: 'number', foreground: 'dfb679' },
      { token: 'type', foreground: '59c2ff' },
      { token: 'function', foreground: 'ffb454' },
    ],
  });

  defineTheme(monaco, 'cobalt2', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#193549', 'editor.foreground': '#ffffff' },
    rules: [
      { token: 'comment', foreground: '7e8a9e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ffc600' },
      { token: 'string', foreground: '3ad900' },
      { token: 'number', foreground: 'ff628c' },
      { token: 'type', foreground: '9effff' },
      { token: 'function', foreground: 'ffc600' },
    ],
  });

  defineTheme(monaco, 'shades-of-purple', {
    base: 'vs-dark', inherit: true,
    colors: { 'editor.background': '#2d2b55', 'editor.foreground': '#e1dfff' },
    rules: [
      { token: 'comment', foreground: '6d6b8b', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff9d00' },
      { token: 'string', foreground: 'a5ff90' },
      { token: 'number', foreground: 'ff628c' },
      { token: 'type', foreground: '9effff' },
      { token: 'function', foreground: 'fad000' },
    ],
  });
}
