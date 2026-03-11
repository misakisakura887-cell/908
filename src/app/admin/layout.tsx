"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Activity, Database, LogOut } from 'lucide-react';

const NAV = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/trades', label: '交易审计', icon: FileText },
  { href: '/admin/copy-trades', label: '跟单管理', icon: Activity },
  { href: '/admin/snapshots', label: '策略快照', icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (t) setToken(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true); setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
      } else {
        setError(data.error || '登录失败');
      }
    } catch { setError('网络错误'); }
    setLogging(false);
  };

  const logout = () => { localStorage.removeItem('admin_token'); setToken(null); };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-[#111113] rounded-2xl border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-1">Mirror AI 管理后台</h1>
          <p className="text-sm text-gray-500 mb-6">请登录管理员账户</p>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <input type="text" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white mb-3 outline-none focus:border-cyan-500" />
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white mb-4 outline-none focus:border-cyan-500" />
          <button type="submit" disabled={logging}
            className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors disabled:opacity-50">
            {logging ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#111113] border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <h1 className="text-lg font-bold text-white">Mirror AI</h1>
          <p className="text-xs text-gray-500">管理后台</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <item.icon size={16} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full">
            <LogOut size={14} /> 退出登录
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
