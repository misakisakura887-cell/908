"use client";

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminSnapshots() {
  const [snapshots, setSnapshots] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${API}/admin/snapshots?limit=50`, { headers: { 'x-admin-token': token || '' } })
      .then(r => r.json()).then(d => setSnapshots(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">策略快照</h1>
      <p className="text-sm text-gray-500 mb-6">金明老师仓位同步历史</p>

      <div className="space-y-3">
        {snapshots.map(s => {
          const positions = (s.positions || []) as any[];
          const orders = (s.orders || []) as any[];
          const tradeable = positions.filter((p: any) => p.tradeable !== false);
          return (
            <div key={s.id} className="p-5 bg-[#111113] rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{new Date(s.createdAt).toLocaleString('zh-CN')}</span>
                  <span className="text-lg font-bold text-white">${parseFloat(s.totalValue).toFixed(2)}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">{tradeable.length} 可交易</span>
                  <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded">{positions.length - tradeable.length} 不活跃</span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded">{orders.length} 挂单</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {positions.map((p: any, i: number) => (
                  <div key={i} className={`p-2 rounded text-xs ${p.tradeable !== false ? 'bg-white/5' : 'bg-white/[0.02] opacity-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.coin}</span>
                      <span className={p.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400'}>{p.direction}</span>
                    </div>
                    <div className="text-gray-500 mt-1">{p.size} @ ${p.entryPrice}</div>
                    <div className="text-gray-500">价值: ${p.value?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {snapshots.length === 0 && <p className="text-gray-500 text-center py-12">暂无快照</p>}
      </div>
    </div>
  );
}
