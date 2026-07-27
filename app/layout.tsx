import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://codepaste.app'),
  title: {
    default: 'CodePaste - Paste code, share instantly',
    template: '%s - CodePaste',
  },
  description: 'A modern, beautiful code sharing platform for developers. VS Code inspired editor with syntax highlighting.',
  openGraph: {
    type: 'website',
    siteName: 'CodePaste',
    title: 'CodePaste - Paste code, share instantly',
    description: 'A modern, beautiful code sharing platform for developers. VS Code inspired editor with syntax highlighting.',
    url: 'https://codepaste.app',
    images: [{ url: '/opengraph-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodePaste - Paste code, share instantly',
    description: 'A modern, beautiful code sharing platform for developers. VS Code inspired editor with syntax highlighting.',
    images: ['/opengraph-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e1e1e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={'theme-vscode-dark ' + inter.variable + ' ' + jetbrainsMono.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://brlcrelgvkzhzbfgmecg.supabase.co" />
        <link rel="canonical" href="https://codepaste.app" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'CodePaste',
              url: 'https://codepaste.app',
              description: 'A modern, beautiful code sharing platform for developers. VS Code inspired editor with syntax highlighting.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://codepaste.app/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              var cls = document.documentElement.className;
              var fontClass = cls.split(' ').filter(function(c) { return c.startsWith('__'); }).join(' ');
              var t = localStorage.getItem('codepaste-theme') || 'vscode-dark';
              document.documentElement.className = 'theme-' + t + (fontClass ? ' ' + fontClass : '');
            } catch(e) {
              document.documentElement.className = 'theme-vscode-dark';
            }
          `,
        }} />
        <style>{`
          :root {
            --font-inter: ${inter.style.fontFamily};
            --font-mono: ${jetbrainsMono.style.fontFamily};
          }
        `}</style>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
