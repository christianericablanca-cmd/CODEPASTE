import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "vscode-bg": "var(--vscode-bg)",
        "vscode-sidebar": "var(--vscode-sidebar)",
        "vscode-activity": "var(--vscode-activity)",
        "vscode-activity-hover": "var(--vscode-activity-hover)",
        "vscode-activity-active": "var(--vscode-activity-active)",
        "vscode-tab": "var(--vscode-tab)",
        "vscode-tab-active": "var(--vscode-tab-active)",
        "vscode-border": "var(--vscode-border)",
        "vscode-text": "var(--vscode-text)",
        "vscode-text-secondary": "var(--vscode-text-secondary)",
        "vscode-line": "var(--vscode-line)",
        "vscode-hover": "var(--vscode-hover)",
        "vscode-selection": "var(--vscode-selection)",
        "vscode-status": "var(--vscode-status)",
        "vscode-input": "var(--vscode-input)",
        "vscode-button": "var(--vscode-button)",
        "vscode-button-hover": "var(--vscode-button-hover)",
        "vscode-accent": "var(--vscode-accent)",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "Fira Code", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
