export interface Theme {
  id: string;
  name: string;
  className: string;
  monacoTheme: string;
  accent: string;
}

export const themes: Theme[] = [
  { id: 'vscode-dark', name: 'Dark+', className: 'theme-vscode-dark', monacoTheme: 'vs-dark', accent: '#007acc' },
  { id: 'vscode-light', name: 'Light+', className: 'theme-vscode-light', monacoTheme: 'vs', accent: '#007acc' },
  { id: 'monokai', name: 'Monokai', className: 'theme-monokai', monacoTheme: 'monokai', accent: '#a6e22e' },
  { id: 'nord', name: 'Nord', className: 'theme-nord', monacoTheme: 'nord', accent: '#88c0d0' },
  { id: 'one-dark', name: 'One Dark Pro', className: 'theme-one-dark', monacoTheme: 'one-dark', accent: '#61afef' },
  { id: 'github-dark', name: 'GitHub Dark', className: 'theme-github-dark', monacoTheme: 'github-dark', accent: '#58a6ff' },
  { id: 'dracula', name: 'Dracula', className: 'theme-dracula', monacoTheme: 'dracula', accent: '#bd93f9' },
  { id: 'tokyo-night', name: 'Tokyo Night', className: 'theme-tokyo-night', monacoTheme: 'tokyo-night', accent: '#7aa2f7' },
  { id: 'synthwave', name: 'SynthWave \'84', className: 'theme-synthwave', monacoTheme: 'synthwave', accent: '#ff7edb' },
  { id: 'catppuccin', name: 'Catppuccin Mocha', className: 'theme-catppuccin', monacoTheme: 'catppuccin', accent: '#cba6f7' },
  { id: 'night-owl', name: 'Night Owl', className: 'theme-night-owl', monacoTheme: 'night-owl', accent: '#82aaff' },
  { id: 'gruvbox', name: 'Gruvbox Dark', className: 'theme-gruvbox', monacoTheme: 'gruvbox', accent: '#fabd2f' },
  { id: 'ayu-dark', name: 'Ayu Dark', className: 'theme-ayu-dark', monacoTheme: 'ayu-dark', accent: '#e6b450' },
  { id: 'cobalt2', name: 'Cobalt2', className: 'theme-cobalt2', monacoTheme: 'cobalt2', accent: '#ffc600' },
  { id: 'shades-of-purple', name: 'Shades of Purple', className: 'theme-shades-of-purple', monacoTheme: 'shades-of-purple', accent: '#a479e3' },
];

export const defaultTheme = themes[0];

export const languages = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'jsx', name: 'JSX' },
  { id: 'tsx', name: 'TSX' },
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Bash' },
  { id: 'yaml', name: 'YAML' },
  { id: 'json', name: 'JSON' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'dockerfile', name: 'Dockerfile' },
  { id: 'plaintext', name: 'Plain Text' },
];
