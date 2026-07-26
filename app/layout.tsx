import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CodePaste - Paste code, share instantly',
  description: 'A modern, beautiful code sharing platform for developers. VS Code inspired editor with syntax highlighting.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="theme-vscode-dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = localStorage.getItem('codepaste-theme') || 'vscode-dark';
              document.documentElement.className = 'theme-' + t;
            } catch(e) {
              document.documentElement.className = 'theme-vscode-dark';
            }
          `
        }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
