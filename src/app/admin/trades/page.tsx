"use client";

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

interface TradeLog {
  id: string; userId: string; trigger: string; coin: string; market: string;
  side: string; requestedSz: number; requestedPx: number;
  filledSz: number | null; filledPx: number | null; hlOid: string | null;
  status: string; errorMsg: string | null; ratioUsed: number | null;
  createdAt: string;
  user: { walletAddress: string | null; hlAddress: string | null } | null;
}

export default function AdminTrades() {
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ status: '', coin: '' });

  const load = () => {
    const token = localStorage.getItem('admin_token');
    const params = new URLSearchParams({ limit: '100' });
    if (filter.status) params.set('status', filter.status);
    if (filter.coin) params.set('coin', filter.coin);
    fetch(`${API}/admin/trade-logs?${params}`, { headers: { 'x-admin-token': token || '' } })
      .then(r => r.json()).then(d => { setLogs(d.logs || []); setTotal(d.total || 0); }).catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);

  const exportCSV = () => {
    const token = localStorage.getItem('admin_token');
    window.open(`${API}/admin/trade-logs/export?x-admin-token=${token}`);
  };

  const statusColor: Record<string, string> = {
    filled: 'text-emerald-400 bg-emerald-500/10',
    partial: 'text-yellow-400 bg-yellow-500/10',
    rejected: 'text-red-400 bg-red-500/10',
    error: 'text-red-400 bg-red-500/10',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">交易审计日志</h1>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors">
          <Download size={14} /> 导出 CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 rounded-lg bg-[#111113] border border-white/10 text-sm text-white outline-none">
          <option value="">全部状态</option>
          <option value="filled">✅ 成交</option>
          <option value="rejected">❌ 拒绝</option>
          <option value="error">⚠️ 错误</option>
        </select>
        <input placeholder="搜索币种..." value={filter.coin} onChange={e => setFilter(f => ({ ...f, coin: e.target.value }))}
          className="px-3 py-2 rounded-lg bg-[#111113] border border-white/10 text-sm text-white outline-none w-40" />
      </div>

      <div className="bg-[#111113] rounded-xl border border-white/5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs">
              <th className="text-left p-3">时间</th>
              <th className="text-left p-3">用户</th>
              <th className="text-left p-3">触发</th>
              <th className="text-left p-3">标的</th>
              <th className="text-left p-3">方向</th>
              <th className="text-right p-3">请求量</th>
              <th className="text-right p-3">请求价</th>
              <th className="text-right p-3">成交量</th>
              <th className="text-right p-3">成交价</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">备注</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{new Date(l.createdAt).toLocaleString('zh-CN')}</td>
                <td className="p-3 font-mono text-xs text-gray-400">
                  {l.user?.hlAddress ? `${l.user.hlAddress.slice(0, 6)}...${l.user.hlAddress.slice(-4)}` : l.userId.slice(0, 8)}
                </td>
                <td className="p-3 text-xs">{l.trigger}</td>
                <td className="p-3 font-medium">{l.coin}</td>
                <td className="p-3">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${l.side === 'BUY' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {l.side}
                  </span>
                </td>
                <td className="p-3 text-right font-mono">{l.requestedSz}</td>
                <td className="p-3 text-right font-mono">${l.requestedPx.toFixed(2)}</td>
                <td className="p-3 text-right font-mono">{l.filledSz ?? '—'}</td>
                <td className="p-3 text-right font-mono">{l.filledPx ? `$${l.filledPx.toFixed(2)}` : '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColor[l.status] || 'text-gray-400'}`}>{l.status}</span>
                </td>
                <td className="p-3 text-xs text-gray-500 max-w-[200px] truncate">{l.errorMsg || l.hlOid || ''}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={11} className="p-8 text-center text-gray-500">暂无交易日志</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
