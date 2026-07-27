'use client';

import React, { useState, useRef } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

type NotifType = 'success' | 'error';

interface NotifState {
  message: string;
  type: NotifType;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotifState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = (message: string, type: NotifType) => {
    if (timer.current) clearTimeout(timer.current);
    setNotification({ message, type });
    timer.current = setTimeout(() => setNotification(null), 3000);
  };

  return { notification, showNotification: show };
}

export function Notification({ notification, onClose }: { notification: NotifState; onClose?: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-xs"
      style={{
        background: notification.type === 'success' ? '#2ea043' : '#da3633',
        color: '#fff',
      }}
    >
      {notification.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      <span>{notification.message}</span>
      <button onClick={onClose} className="ml-1 hover:opacity-80 text-white/70 hover:text-white" aria-label="Dismiss">&times;</button>
    </div>
  );
}
