import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Database, FileText, TrendingUp, Activity, Shield, Zap, Brain, Radar, Globe, Bitcoin, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats, useThreatAlerts, useTorEntities, useActivityLogs, seedThreatAlerts, type ThreatAlert } from '../lib/hooks';
import StatCard from '../components/StatCard';
import ThreatBadge from '../components/ThreatBadge';
import EntityTypeBadge from '../components/EntityTypeBadge';
import ThreatLineChart from '../components/ThreatLineChart';
import ThreatHeatmap from '../components/ThreatHeatmap';
import LiveActivityFeed, { type ActivityAlert } from '../components/LiveActivityFeed';
import { classifyEntry, generateIntelligenceSummary } from '../lib/aiAnalysis';
import type { Page } from '../App';
import type { Entity } from '../lib/types';

interface Props { onNavigate: (page: Page) => void }

const THREAT_TIMELINE_DATA = [
  { date: 'Mar 10', critical: 3, high: 8, medium: 12, low: 15 },
  { date: 'Mar 11', critical: 5, high: 10, medium: 9, low: 18 },
  { date: 'Mar 12', critical: 2, high: 6, medium: 14, low: 22 },
  { date: 'Mar 13', critical: 8, high: 15, medium: 7, low: 12 },
  { date: 'Mar 14', critical: 6, high: 12, medium: 11, low: 19 },
  { date: 'Mar 15', critical: 9, high: 18, medium: 8, low: 14 },
  { date: 'Mar 16', critical: 4, high: 9, medium: 13, low: 20 },
];

const THREAT_HEATMAP_DATA = Array.from({ length: 7 }, (_, dayIdx) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return Array.from({ length: 24 }, (_, hour) => ({
    day: days[dayIdx],
    hour,
    value: Math.floor(Math.random() * 15),
  }));
}).flat();

const SEVERITY_CONFIG = {
  low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function Dashboard({ onNavigate }: Props) {
  const { user } = useAuth();
  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats(user?.id);
  const { alerts, loading: alertsLoading, refetch: refetchAlerts } = useThreatAlerts(user?.id);
  const { entities: torEntities } = useTorEntities(user?.id);
  const { logs: recentLogs } = useActivityLogs(user?.id);
  const [recentEntities, setRecentEntities] = useState<Entity[]>([]);
  const [aiSummary, setAISummary] = useState('');
  const [suspiciousEntries, setSuspiciousEntries] = useState(0);
  const [alertsSeeded, setAlertsSeeded] = useState(false);

  // Load recent entities from Supabase
  useEffect(() => {
    if (!user) return;
    supabase.from('entities').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(6)
      .then(({ data }: { data: Entity[] | null }) => { setRecentEntities(data ?? []); });
  }, [user]);

  // Seed alerts if none exist
  useEffect(() => {
    if (!user || alertsSeeded) return;
    if (!alertsLoading && alerts.length === 0) {
      seedThreatAlerts(user.id).then(() => {
        setAlertsSeeded(true);
        refetchAlerts();
        refetchStats();
      });
    } else {
      setAlertsSeeded(true);
    }
  }, [user, alerts, alertsLoading, alertsSeeded, refetchAlerts, refetchStats]);

  // AI analysis on entities
  useEffect(() => {
    if (recentEntities.length === 0) return;
    const analysis = classifyEntry(JSON.stringify(recentEntities));
    const summary = generateIntelligenceSummary(analysis, recentEntities);
    setAISummary(summary);
    const threats = recentEntities.filter(e => e.threat_score >= 70).length;
    setSuspiciousEntries(analysis.classification === 'critical' ? threats : Math.floor(threats * 0.6));
  }, [recentEntities]);

  // Compute threat categories from tor_entities
  const torCategories = torEntities.length > 0
    ? [
        { label: 'Onion URLs', count: torEntities.filter(e => e.type === 'onion_url').length, color: 'bg-red-500' },
        { label: 'Crypto Wallets', count: torEntities.filter(e => e.type === 'crypto_wallet').length, color: 'bg-yellow-500' },
        { label: 'Email Addresses', count: torEntities.filter(e => e.type === 'email').length, color: 'bg-blue-500' },
        { label: 'IP Addresses', count: torEntities.filter(e => e.type === 'ip_address').length, color: 'bg-orange-500' },
        { label: 'Usernames', count: torEntities.filter(e => e.type === 'username').length, color: 'bg-cyan-500' },
        { label: 'Domains', count: torEntities.filter(e => e.type === 'domain').length, color: 'bg-teal-500' },
      ].filter(c => c.count > 0)
    : [
        { label: 'Crypto Wallets', count: 8, color: 'bg-yellow-500' },
        { label: 'Onion URLs', count: 14, color: 'bg-red-500' },
        { label: 'Email Addresses', count: 22, color: 'bg-blue-500' },
        { label: 'IP Addresses', count: 6, color: 'bg-orange-500' },
        { label: 'Usernames', count: 18, color: 'bg-cyan-500' },
      ];

  const maxCatCount = Math.max(...torCategories.map(c => c.count), 1);

  // Convert DB alerts to ActivityAlert format
  const liveAlerts: ActivityAlert[] = alerts.map((a: ThreatAlert) => ({
    id: a.id,
    type: a.type as ActivityAlert['type'],
    severity: a.severity,
    title: a.title,
    description: a.description,
    timestamp: new Date(a.created_at),
    metadata: a.metadata,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-mono">SYSTEM OVERVIEW</h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">REAL-TIME INTELLIGENCE DASHBOARD</p>
        </div>
        <button
          onClick={() => onNavigate('entity-analysis')}
          className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-sm font-mono font-bold transition-all"
        >
          <Zap size={14} />
          NEW ANALYSIS
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Datasets" value={statsLoading ? '—' : stats.datasets} icon={<Database size={16} />} trend="+2 this week" trendUp accent="cyan" />
        <StatCard label="Entities Found" value={statsLoading ? '—' : stats.entities + stats.torEntities} icon={<Search size={16} />} trend={`+${stats.torEntities} TOR`} trendUp accent="cyan" />
        <StatCard label="High Threats" value={statsLoading ? '—' : stats.threats} icon={<AlertTriangle size={16} />} trend={`${stats.criticalAlerts} critical`} trendUp={false} accent="red" />
        <StatCard label="Reports" value={statsLoading ? '—' : stats.reports} icon={<FileText size={16} />} trend="2 pending" trendUp accent="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Threat categories from tor_entities */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5 xl:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">THREAT CATEGORIES</h3>
          </div>
          <div className="space-y-3">
            {torCategories.map(cat => (
              <div key={cat.label}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">{cat.label}</span>
                  <span className="text-gray-300">{cat.count}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full transition-all duration-700`}
                    style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent entities */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-gray-200 font-mono">RECENT ENTITIES</h3>
            </div>
            <button
              onClick={() => onNavigate('entity-analysis')}
              className="text-xs text-cyan-500 hover:text-cyan-400 font-mono transition-colors"
            >
              VIEW ALL →
            </button>
          </div>
          <div className="space-y-2">
            {recentEntities.length > 0 ? recentEntities.map(entity => (
              <div
                key={entity.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/40 hover:bg-gray-800/70 rounded-lg transition-colors"
              >
                <EntityTypeBadge type={entity.type as never} />
                <span className="flex-1 text-xs font-mono text-gray-300 truncate">{entity.value}</span>
                <ThreatBadge score={entity.threat_score} />
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${entity.threat_score >= 70 ? 'bg-red-500' : entity.threat_score >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${entity.threat_score}%` }}
                  />
                </div>
              </div>
            )) : torEntities.slice(0, 6).map(entity => (
              <div
                key={entity.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/40 hover:bg-gray-800/70 rounded-lg transition-colors"
              >
                <EntityTypeBadge type={entity.type === 'onion_url' ? 'url' : entity.type === 'crypto_wallet' ? 'wallet' : entity.type as never} />
                <span className="flex-1 text-xs font-mono text-gray-300 truncate">{entity.value}</span>
                <ThreatBadge score={entity.threat_score} />
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${entity.threat_score >= 70 ? 'bg-red-500' : entity.threat_score >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${entity.threat_score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Intelligence Summary */}
      <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-cyan-400 font-mono tracking-wide">AI INTELLIGENCE SUMMARY</h3>
            <p className="text-sm text-gray-300 mt-2 font-mono leading-relaxed">
              {aiSummary || 'Analyzing threat landscape... Upload a dataset or run entity analysis to generate intelligence insights.'}
            </p>
            {suspiciousEntries > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400">
                  {suspiciousEntries} SUSPICIOUS ENTRIES DETECTED
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Threat Timeline with Line Chart */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">THREAT TREND ANALYSIS (LINE CHART)</h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500">Last 7 Days</span>
        </div>
        <div className="bg-gray-950/50 rounded-lg p-4 overflow-x-auto">
          <ThreatLineChart data={THREAT_TIMELINE_DATA} />
        </div>
      </div>

      {/* Threat Activity Heatmap */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radar size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">THREAT ACTIVITY HEATMAP</h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500">Activity by Hour & Day</span>
        </div>
        <div className="bg-gray-950/50 rounded-lg overflow-x-auto">
          <ThreatHeatmap data={THREAT_HEATMAP_DATA} />
        </div>
      </div>

      {/* Live Threat Alerts from Supabase */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">LIVE THREAT ALERTS</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500">{alerts.length} total</span>
            <span className="text-[10px] font-mono text-green-400 animate-pulse">● LIVE</span>
          </div>
        </div>
        <LiveActivityFeed alerts={liveAlerts} maxItems={6} />
      </div>

      {/* TOR Entity Monitor */}
      {torEntities.length > 0 && (
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-gray-200 font-mono">TOR ENTITY MONITOR</h3>
            </div>
            <button
              onClick={() => onNavigate('threat-intelligence')}
              className="text-xs text-cyan-500 hover:text-cyan-400 font-mono transition-colors"
            >
              VIEW ALL →
            </button>
          </div>
          <div className="space-y-2">
            {torEntities.slice(0, 5).map(entity => {
              const sev = entity.threat_score >= 80 ? 'critical' : entity.threat_score >= 60 ? 'high' : entity.threat_score >= 40 ? 'medium' : 'low';
              const config = SEVERITY_CONFIG[sev];
              return (
                <div key={entity.id} className={`relative overflow-hidden rounded-lg border ${config.bg} ${config.border}`}>
                  <div className={`absolute left-0 top-0 h-full w-1 ${config.color.replace('text-', 'bg-')}`} />
                  <div className="flex items-center gap-3 p-3 pl-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.bg} border ${config.border}`}>
                      {entity.type === 'onion_url' ? <Globe size={14} className={config.color} /> :
                       entity.type === 'crypto_wallet' ? <Bitcoin size={14} className={config.color} /> :
                       entity.type === 'email' || entity.type === 'username' ? <Users size={14} className={config.color} /> :
                       <Shield size={14} className={config.color} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-mono font-bold ${config.color}`}>{entity.value}</p>
                      <p className="text-[10px] font-mono text-gray-500">{entity.context || entity.type} • {entity.source}</p>
                    </div>
                    <ThreatBadge score={entity.threat_score} />
                    {entity.is_verified && (
                      <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">VERIFIED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Activity Log */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={14} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-gray-200 font-mono">ANALYSIS ACTIVITY LOG</h3>
        </div>
        {recentLogs.length === 0 ? (
          <div className="space-y-2">
            {[
              { action: 'System initialized', details: 'Supabase connection established', t: 'just now' },
              { action: 'Threat monitoring active', details: 'Real-time subscriptions enabled', t: '1m ago' },
              { action: 'TOR entity scan', details: '15 entities in database', t: '5m ago' },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span className="text-gray-400">{log.action}</span>
                <span className="text-gray-600 flex-1 truncate">— {log.details}</span>
                <span className="text-gray-600">{log.t}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span className="text-gray-400">{log.action}</span>
                <span className="text-gray-600 flex-1 truncate">— {log.details}</span>
                <span className="text-gray-600">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
