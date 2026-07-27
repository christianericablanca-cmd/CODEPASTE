'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative rounded-lg border shadow-xl w-full max-w-sm mx-4"
        style={{ background: 'var(--vscode-sidebar)', borderColor: 'var(--vscode-border)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--vscode-border)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#f48771' }}>
            <AlertTriangle size={16} />
            {title}
          </div>
          <button onClick={onCancel} className="hover:opacity-80" style={{ color: 'var(--vscode-text-secondary)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4 text-xs leading-relaxed" style={{ color: 'var(--vscode-text)' }}>
          {message}
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--vscode-border)' }}>
          <button onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded border transition-colors"
            style={{ borderColor: 'var(--vscode-border)', color: 'var(--vscode-text-secondary)' }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className="px-3 py-1.5 text-xs rounded font-medium transition-colors"
            style={{ background: '#da3633', color: '#fff' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
