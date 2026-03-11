"use client";

import { useEffect, useState } from 'react';
import { Users, Activity, FileText, AlertTriangle, Clock, DollarSign } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

interface DashboardData {
  users: { total: number; hlBound: number };
  copyTrades: { active: number };
  tradeLogs: { total: number; today: number; recentErrors: number };
  lastSync: { time: string; totalValue: string } | null;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${API}/admin/dashboard`, { headers: { 'x-admin-token': token || '' } })
      .then(r => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-gray-400 p-8">加载中...</div>;

  const cards = [
    { label: '总用户', value: data.users.total, sub: `${data.users.hlBound} 已绑定 HL`, icon: Users, color: 'text-cyan-400' },
    { label: '活跃跟单', value: data.copyTrades.active, sub: '当前进行中', icon: Activity, color: 'text-emerald-400' },
    { label: '交易日志', value: data.tradeLogs.total, sub: `今日 ${data.tradeLogs.today} 笔`, icon: FileText, color: 'text-purple-400' },
    { label: '异常/拒绝', value: data.tradeLogs.recentErrors, sub: '近24小时', icon: AlertTriangle, color: data.tradeLogs.recentErrors > 0 ? 'text-red-400' : 'text-emerald-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">仪表盘</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="p-5 bg-[#111113] rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{c.label}</span>
              <c.icon size={18} className={c.color} />
            </div>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Last Sync */}
      {data.lastSync && (
        <div className="p-5 bg-[#111113] rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400">最近策略同步</span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500">时间</p>
              <p className="text-white font-mono">{new Date(data.lastSync.time).toLocaleString('zh-CN')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">策略总价值</p>
              <p className="text-white font-mono">${parseFloat(data.lastSync.totalValue).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
