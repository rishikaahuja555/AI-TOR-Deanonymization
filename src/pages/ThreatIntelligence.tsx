import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Shield, Crosshair, Globe, Bitcoin, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTorEntities, useThreatAlerts, type TorEntity, type ThreatAlert } from '../lib/hooks';
import ThreatBadge, { getThreatLevel } from '../components/ThreatBadge';
import type { Entity } from '../lib/types';

const TYPE_COLORS: Record<string, string> = {
  onion_url: 'text-red-400 bg-red-500/10 border-red-500/25',
  crypto_wallet: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  email: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  ip_address: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
  username: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  domain: 'text-teal-400 bg-teal-500/10 border-teal-500/25',
};

export default function ThreatIntelligence() {
  const { user } = useAuth();
  const { entities: torEntities, loading: torLoading, refetch: refetchTor } = useTorEntities(user?.id);
  const { alerts } = useThreatAlerts(user?.id);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!user) return;
    supabase.from('entities').select('*').eq('user_id', user.id)
      .order('threat_score', { ascending: false }).limit(50)
      .then(({ data }: { data: Entity[] | null }) => { setEntities(data ?? []); });
  }, [user]);

  // Merge tor_entities and entities for display
  const allThreats = [
    ...torEntities.map((te: TorEntity) => ({
      id: te.id,
      type: te.type,
      value: te.value,
      threat_score: te.threat_score,
      confidence: Number(te.confidence),
      context: te.context,
      source: te.source,
      is_verified: te.is_verified,
      created_at: te.created_at,
    })),
    ...entities.map((e: Entity) => ({
      id: e.id,
      type: e.type,
      value: e.value,
      threat_score: e.threat_score,
      confidence: e.confidence,
      context: e.context || '',
      source: 'entity_analysis',
      is_verified: false,
      created_at: e.created_at,
    })),
  ];

  const filtered = allThreats
    .filter(t => {
      const matchType = filterType === 'all' || t.type === filterType;
      const matchSearch = !search || t.value.toLowerCase().includes(search.toLowerCase()) || t.context.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    })
    .sort((a, b) => b.threat_score - a.threat_score);

  const critical = allThreats.filter(e => e.threat_score >= 80).length;
  const high = allThreats.filter(e => e.threat_score >= 60 && e.threat_score < 80).length;
  const wallets = allThreats.filter(e => e.type === 'crypto_wallet').length;
  const onions = allThreats.filter(e => e.type === 'onion_url').length;

  const activeAlerts = alerts.filter((a: ThreatAlert) => a.severity === 'critical' || a.severity === 'high');

  const types = ['all', ...Array.from(new Set(allThreats.map(e => e.type)))];

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
                <p className={`text-3xl font-bold font-mono mt-1 ${s.color}`}>{torLoading ? '—' : s.count}</p>
              </div>
              <div className={`${s.bg} border ${s.border} rounded-lg p-2 flex-shrink-0`}>
                <span className={s.color}>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Active threat alerts */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crosshair size={14} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-gray-200 font-mono">ACTIVE THREAT ALERTS</h3>
            </div>
            <span className="text-[10px] font-mono text-green-400 animate-pulse">● LIVE</span>
          </div>
          <div className="space-y-2">
            {activeAlerts.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono text-center py-4">No active threat alerts</p>
            ) : (
              activeAlerts.slice(0, 5).map((ind: ThreatAlert) => {
                const sev = SEVERITY_MAP[ind.severity] || SEVERITY_MAP.medium;
                return (
                  <div key={ind.id} className={`flex items-center gap-3 ${sev.bg} rounded-lg px-3 py-2.5 border ${sev.border}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-200 truncate">{ind.title}</p>
                      <p className="text-[10px] font-mono text-gray-500 truncate">{ind.description}</p>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${sev.badge}`}>
                      {ind.severity.toUpperCase()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Threat type distribution */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">THREAT TYPE DISTRIBUTION</h3>
          </div>
          <div className="space-y-3">
            {types.filter(t => t !== 'all').map(type => {
              const count = allThreats.filter(e => e.type === type).length;
              const maxCount = Math.max(...types.filter(t => t !== 'all').map(t => allThreats.filter(e => e.type === t).length), 1);
              const style = TYPE_COLORS[type] || 'text-gray-400 bg-gray-500/10 border-gray-500/25';
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-gray-400">{type.replace('_', ' ').toUpperCase()}</span>
                    <span className="text-gray-300">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${style.split(' ')[0].replace('text-', 'bg-')}`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top threats table */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">TOP THREAT ENTITIES</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search threats..."
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
            <button
              onClick={refetchTor}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            >
              <RefreshCw size={11} />
              REFRESH
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1 flex-wrap mb-4">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded border transition-all ${
                filterType === t ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'text-gray-500 border-gray-700 hover:text-gray-300'
              }`}
            >
              {t === 'all' ? 'ALL' : t.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">#</th>
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">TYPE</th>
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">VALUE</th>
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">THREAT</th>
                <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">SOURCE</th>
                <th className="text-left text-gray-500 py-2 font-normal tracking-wider">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 15).map((e, i) => {
                const { color } = getThreatLevel(e.threat_score);
                return (
                  <tr key={e.id} className="border-b border-gray-800/20 hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-gray-600">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${TYPE_COLORS[e.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/25'}`}>
                        {e.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-200 max-w-60 truncate">{e.value}</td>
                    <td className="py-2.5 pr-4"><ThreatBadge score={e.threat_score} /></td>
                    <td className="py-2.5 pr-4 text-gray-500">{e.source}</td>
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
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <Shield size={28} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 font-mono text-sm">NO THREATS FOUND</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SEVERITY_MAP: Record<string, { bg: string; border: string; badge: string }> = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/25', badge: 'text-red-400 bg-red-500/10 border-red-500/25' },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500/25', badge: 'text-orange-400 bg-orange-500/10 border-orange-500/25' },
  medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
  low: { bg: 'bg-green-500/10', border: 'border-green-500/25', badge: 'text-green-400 bg-green-500/10 border-green-500/25' },
};
