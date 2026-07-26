'use client';

import React, { useState, useMemo } from 'react';
import { FileCode, Plus, Search as SearchIcon, X } from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  language: string;
  code: string;
}

interface SidebarProps {
  activeTab: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  tabs?: Tab[];
  activeTabId?: string;
  onTabSelect?: (id: string) => void;
  onTabClose?: (id: string, e: React.MouseEvent) => void;
  onAddTab?: () => void;
  onRenameTab?: (id: string, title: string) => void;
  code?: string;
}

function ExplorerTab({ tab, activeTabId, onTabSelect, onTabClose, tabs, onRenameTab }: {
  tab: Tab; activeTabId?: string; onTabSelect?: (id: string) => void; onTabClose?: (id: string, e: React.MouseEvent) => void; tabs: Tab[]; onRenameTab?: (id: string, title: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const startRename = () => {
    setRenameValue(tab.title);
    setRenaming(true);
  };

  const commitRename = () => {
    if (renameValue.trim() && onRenameTab) onRenameTab(tab.id, renameValue.trim());
    setRenaming(false);
  };

  const cancelRename = () => setRenaming(false);

  return (
    <div
      onDoubleClick={startRename}
      onClick={() => { if (!renaming) onTabSelect?.(tab.id); }}
      className="flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer"
      style={{
        background: tab.id === activeTabId ? 'var(--vscode-selection)' : 'transparent',
        color: 'var(--vscode-text)',
      }}
    >
      <FileCode size={14} />
      {renaming ? (
        <input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename(); }}
          className="flex-1 bg-transparent border border-[var(--vscode-accent)] outline-none text-sm px-1 rounded"
          style={{ color: 'var(--vscode-text)' }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate flex-1">{tab.title || 'untitled'}.{tab.language}</span>
      )}
      {tabs.length > 1 && onTabClose && !renaming && (
        <button onClick={(e) => onTabClose(tab.id, e)} className="hover:opacity-80 shrink-0" style={{ color: 'var(--vscode-text-secondary)' }}>
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export function Sidebar({ activeTab, tabs, activeTabId, onTabSelect, onTabClose, onAddTab, onRenameTab, code }: SidebarProps) {
  if (activeTab === 'files') {
    return (
      <div className="w-64 border-r flex flex-col" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--vscode-border)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--vscode-text-secondary)' }}>Explorer</span>
          {onAddTab && (
            <button onClick={onAddTab} className="text-[var(--vscode-text-secondary)] hover:text-[var(--vscode-text)]"><Plus size={16} /></button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tabs && tabs.map((tab) => (
            <ExplorerTab key={tab.id} tab={tab} activeTabId={activeTabId} onTabSelect={onTabSelect} onTabClose={onTabClose} tabs={tabs} onRenameTab={onRenameTab} />
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'search') {
    return <SearchPanel code={code || ''} />;
  }

  return null;
}

function SearchPanel({ code }: { code: string }) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    if (!query.trim() || !code) return [];
    const lines = code.split('\n');
    const results: { line: number; text: string }[] = [];
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        results.push({ line: i + 1, text: line.trim() });
      }
    });
    return results;
  }, [query, code]);

  return (
    <div className="w-64 border-r flex flex-col" style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--vscode-border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--vscode-text-secondary)' }}>Search</span>
        <span className="text-[10px]" style={{ color: 'var(--vscode-text-secondary)' }}>{matches.length} results</span>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded border" style={{ background: 'var(--vscode-input)', borderColor: 'var(--vscode-border)' }}>
          <SearchIcon size={14} style={{ color: 'var(--vscode-text-secondary)' }} />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Find in file..."
            className="flex-1 bg-transparent border-0 outline-none text-xs"
            style={{ color: 'var(--vscode-text)' }}
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {query.trim() && matches.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: 'var(--vscode-text-secondary)' }}>No matches found</p>
        )}
        {matches.map((m, i) => (
          <div key={i} className="px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80" style={{ color: 'var(--vscode-text)' }}>
            <span className="mr-2 font-mono" style={{ color: 'var(--vscode-text-secondary)' }}>{m.line}</span>
            <span className="font-mono truncate">{m.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}