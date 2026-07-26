'use client';

import React, { useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/lib/theme-context';
import { registerMonacoThemes } from '@/lib/monaco-themes';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

export function Editor({ value, onChange, language }: EditorProps) {
  const { theme, editorFontSize, wordWrap, minimap } = useTheme();
  const editorRef = useRef<any>(null);

  const handleBeforeMount = useCallback((monaco: any) => {
    registerMonacoThemes(monaco);
  }, []);

  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  const handleChange = useCallback((val: string | undefined) => {
    if (val !== undefined) onChange(val);
  }, [onChange]);

  return (
    <div className="flex-1 overflow-hidden" style={{ background: 'var(--vscode-bg)' }}>
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        theme={theme.monacoTheme}
        options={{
          fontSize: editorFontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          wordWrap: wordWrap ? 'on' : 'off',
          minimap: { enabled: minimap },
          scrollBeyondLastLine: true,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
        }}
      />
    </div>
  );
}