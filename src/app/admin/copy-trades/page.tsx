"use client";

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminCopyTrades() {
  const [trades, setTrades] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const params = filter ? `?status=${filter}` : '';
    fetch(`${API}/admin/copy-trades${params}`, { headers: { 'x-admin-token': token || '' } })
      .then(r => r.json()).then(d => setTrades(Array.isArray(d) ? d : [])).catch(() => {});
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">跟单管理</h1>
      <div className="flex gap-2 mb-6">
        {['', 'active', 'paused', 'stopped'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === s ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
            {s || '全部'} {s === 'active' ? '🟢' : s === 'paused' ? '🟡' : s === 'stopped' ? '🔴' : ''}
          </button>
        ))}
      </div>

      <div className="bg-[#111113] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs">
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">用户</th>
              <th className="text-left p-4">策略</th>
              <th className="text-right p-4">金额</th>
              <th className="text-right p-4">比例</th>
              <th className="text-left p-4">状态</th>
              <th className="text-right p-4">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-4 font-mono text-xs text-gray-400">{t.id.slice(0, 12)}</td>
                <td className="p-4 font-mono text-xs">
                  {t.user?.hlAddress ? `${t.user.hlAddress.slice(0, 8)}...` : t.userId.slice(0, 8)}
                </td>
                <td className="p-4">{t.strategyId === 'longtou' ? '龙头多头策略' : t.strategyId}</td>
                <td className="p-4 text-right font-mono">${parseFloat(t.amount).toFixed(2)}</td>
                <td className="p-4 text-right font-mono">{(parseFloat(t.ratio) * 100).toFixed(4)}%</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    t.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' :
                    t.status === 'paused' ? 'text-yellow-400 bg-yellow-500/10' :
                    'text-gray-400 bg-white/5'
                  }`}>{t.status}</span>
                </td>
                <td className="p-4 text-right text-xs text-gray-500">{new Date(t.createdAt).toLocaleString('zh-CN')}</td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">暂无跟单记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
