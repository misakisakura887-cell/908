"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

interface UserRow {
  id: string; walletAddress: string | null; hlAddress: string | null;
  email: string | null; usdtBalance: string; isAdmin: boolean;
  isBlocked: boolean; createdAt: string;
  _count: { copyTrades: number; tradeLogs: number };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${API}/admin/users?limit=100`, { headers: { 'x-admin-token': token || '' } })
      .then(r => r.json()).then(d => { setUsers(d.users || []); setTotal(d.total || 0); }).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">用户管理</h1>
      <p className="text-sm text-gray-500 mb-6">共 {total} 个用户</p>
      
      <div className="bg-[#111113] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs">
              <th className="text-left p-4">钱包地址</th>
              <th className="text-left p-4">HL 地址</th>
              <th className="text-right p-4">跟单数</th>
              <th className="text-right p-4">交易日志</th>
              <th className="text-right p-4">状态</th>
              <th className="text-right p-4">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <Link href={`/admin/users/${u.id}`} className="text-cyan-400 hover:underline font-mono text-xs">
                    {u.walletAddress ? `${u.walletAddress.slice(0, 8)}...${u.walletAddress.slice(-4)}` : u.email || u.id.slice(0, 10)}
                  </Link>
                </td>
                <td className="p-4 font-mono text-xs text-gray-400">
                  {u.hlAddress ? `${u.hlAddress.slice(0, 8)}...${u.hlAddress.slice(-4)}` : <span className="text-yellow-500">未绑定</span>}
                </td>
                <td className="p-4 text-right">{u._count.copyTrades}</td>
                <td className="p-4 text-right">{u._count.tradeLogs}</td>
                <td className="p-4 text-right">
                  {u.isBlocked ? <span className="text-red-400">封禁</span> :
                   u.isAdmin ? <span className="text-purple-400">管理员</span> :
                   <span className="text-emerald-400">正常</span>}
                </td>
                <td className="p-4 text-right text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">暂无用户</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
