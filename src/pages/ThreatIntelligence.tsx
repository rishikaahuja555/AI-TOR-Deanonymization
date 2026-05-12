import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Shield, Crosshair, Globe, Bitcoin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ThreatBadge, { getThreatLevel } from '../components/ThreatBadge';
import EntityTypeBadge from '../components/EntityTypeBadge';
import type { Entity } from '../lib/types';
import { SAMPLE_ENTITIES } from '../lib/sampleData';

const MOCK_THREAT_TIMELINE = [
  { date: 'Mar 10', critical: 3, high: 8, medium: 12 },
  { date: 'Mar 11', critical: 5, high: 10, medium: 9 },
  { date: 'Mar 12', critical: 2, high: 6, medium: 14 },
  { date: 'Mar 13', critical: 8, high: 15, medium: 7 },
  { date: 'Mar 14', critical: 6, high: 12, medium: 11 },
  { date: 'Mar 15', critical: 9, high: 18, medium: 8 },
  { date: 'Mar 16', critical: 4, high: 9, medium: 13 },
];

const THREAT_INDICATORS = [
  { ioc: 'nullbyte-payments.onion', type: 'Ransomware C2', score: 97, status: 'ACTIVE' },
  { ioc: '185.220.101.47', type: 'TOR Exit Node', score: 82, status: 'MONITORED' },
  { ioc: 'darkbyte_ops@securemail.is', type: 'Threat Actor', score: 88, status: 'ACTIVE' },
  { ioc: '0x742d35Cc6634C0532925', type: 'Crypto Laundering', score: 74, status: 'MONITORED' },
  { ioc: 'xmkfonixbl7e3rkh.onion', type: 'Illegal Marketplace', score: 92, status: 'ACTIVE' },
];

export default function ThreatIntelligence() {
  const { user } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('entities').select('*').eq('user_id', user.id)
      .order('threat_score', { ascending: false }).limit(50)
      .then(({ data }) => { setEntities(data ?? []); setLoading(false); });
  }, [user]);

  const display = entities.length > 0
    ? entities
    : SAMPLE_ENTITIES.map((e, i) => ({
        ...e, id: `demo-${i}`, dataset_id: 'demo', user_id: 'demo',
        context: '', created_at: new Date().toISOString(),
      } as Entity));

  const critical = display.filter(e => e.threat_score >= 80).length;
  const high = display.filter(e => e.threat_score >= 60 && e.threat_score < 80).length;
  const wallets = display.filter(e => e.type === 'wallet').length;
  const onions = display.filter(e => e.type === 'url').length;

  const maxTotal = Math.max(...MOCK_THREAT_TIMELINE.map(d => d.critical + d.high + d.medium));

  const summaryCards = [
    { label: 'CRITICAL THREATS', count: critical, icon: <AlertTriangle size={16} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'HIGH THREATS', count: high, icon: <TrendingUp size={16} />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'CRYPTO WALLETS', count: wallets, icon: <Bitcoin size={16} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'ONION DOMAINS', count: onions, icon: <Globe size={16} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(s => (
          <div key={s.label} className={`bg-gray-900 border ${s.border} rounded-xl p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-500 font-mono tracking-wider">{s.label}</p>
                <p className={`text-3xl font-bold font-mono mt-1 ${s.color}`}>{loading ? '—' : s.count}</p>
              </div>
              <div className={`${s.bg} border ${s.border} rounded-lg p-2 flex-shrink-0`}>
                <span className={s.color}>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Threat timeline */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">THREAT TIMELINE (7 DAYS)</h3>
          </div>
          <div className="flex items-end gap-2 h-32">
            {MOCK_THREAT_TIMELINE.map(d => {
              const total = d.critical + d.high + d.medium;
              const h = (total / maxTotal) * 100;
              const cPct = (d.critical / total) * 100;
              const hPct = (d.high / total) * 100;
              const mPct = (d.medium / total) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end rounded overflow-hidden bg-gray-800/40"
                    style={{ height: `${Math.max(h, 8)}%` }}>
                    <div className="w-full bg-red-500/80" style={{ height: `${cPct}%` }} />
                    <div className="w-full bg-orange-500/80" style={{ height: `${hPct}%` }} />
                    <div className="w-full bg-yellow-500/60" style={{ height: `${mPct}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">{d.date.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            {[['Critical', 'bg-red-500'], ['High', 'bg-orange-500'], ['Medium', 'bg-yellow-500']].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                <span className={`w-2 h-2 rounded-sm ${c}`} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Active indicators */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">ACTIVE THREAT INDICATORS</h3>
          </div>
          <div className="space-y-2">
            {THREAT_INDICATORS.map(ind => (
              <div key={ind.ioc} className="flex items-center gap-3 bg-gray-800/40 rounded-lg px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-200 truncate">{ind.ioc}</p>
                  <p className="text-[10px] font-mono text-gray-500">{ind.type}</p>
                </div>
                <ThreatBadge score={ind.score} />
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  ind.status === 'ACTIVE'
                    ? 'text-red-400 bg-red-500/10 border-red-500/25'
                    : 'text-gray-400 bg-gray-700/30 border-gray-600/25'
                }`}>
                  {ind.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top threats table */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-gray-200 font-mono">TOP THREAT ENTITIES</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">#</th>
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">TYPE</th>
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">VALUE</th>
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">THREAT</th>
                <th className="text-left text-gray-500 py-2 font-normal tracking-wider">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {[...display].sort((a, b) => b.threat_score - a.threat_score).slice(0, 10).map((e, i) => {
                const { color } = getThreatLevel(e.threat_score);
                return (
                  <tr key={e.id} className="border-b border-gray-800/20 hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-gray-600">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-2.5 pr-4"><EntityTypeBadge type={e.type as never} /></td>
                    <td className="py-2.5 pr-4 text-gray-200 max-w-60 truncate">{e.value}</td>
                    <td className="py-2.5 pr-4"><ThreatBadge score={e.threat_score} /></td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${e.threat_score}%` }} />
                        </div>
                        <span className={color}>{e.threat_score}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
