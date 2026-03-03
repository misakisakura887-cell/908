"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function DevBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500/90 text-black px-4 py-1.5 text-center text-sm font-medium flex items-center justify-center gap-2">
      <AlertTriangle size={14} />
      开发环境 (HTTP) — 钱包签名时可能提示风险警告，属于正常现象
      <button onClick={() => setShow(false)} className="ml-2 hover:opacity-70">
        <X size={14} />
      </button>
    </div>
  );
}
