import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Database, FileText, TrendingUp, Activity, Shield, Zap, Brain, Radar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';
import ThreatBadge from '../components/ThreatBadge';
import EntityTypeBadge from '../components/EntityTypeBadge';
import ThreatLineChart from '../components/ThreatLineChart';
import ThreatHeatmap from '../components/ThreatHeatmap';
import LiveActivityFeed, { type ActivityAlert } from '../components/LiveActivityFeed';
import { classifyEntry, generateIntelligenceSummary } from '../lib/aiAnalysis';
import type { Page } from '../App';
import type { Entity, ActivityLog } from '../lib/types';
import { SAMPLE_ENTITIES } from '../lib/sampleData';

interface Props { onNavigate: (page: Page) => void }

const THREAT_CATEGORIES = [
  { label: 'Crypto Wallets', count: 8, pct: 32, color: 'bg-yellow-500' },
  { label: 'Onion URLs', count: 14, pct: 56, color: 'bg-red-500' },
  { label: 'Email Addresses', count: 22, pct: 72, color: 'bg-blue-500' },
  { label: 'IP Addresses', count: 6, pct: 24, color: 'bg-orange-500' },
  { label: 'Usernames', count: 18, pct: 64, color: 'bg-cyan-500' },
];

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

const SEED_ALERTS: Omit<ActivityAlert, 'id'>[] = [
  { type: 'onion_detected', severity: 'critical', title: 'New Onion Domain Detected', description: 'xmkfonixbl7e3rkh.onion registered with ransomware infrastructure patterns', timestamp: new Date(Date.now() - 30000), metadata: { domain: 'xmkfonixbl7e3rkh.onion' } },
  { type: 'wallet_found', severity: 'high', title: 'Crypto Wallet Activity Detected', description: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e - 15 BTC transferred', timestamp: new Date(Date.now() - 120000), metadata: { wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', amount: '15 BTC' } },
  { type: 'threat_spike', severity: 'critical', title: 'Anomalous Threat Level Spike', description: '450% increase in darknet marketplace activity in last 2 hours', timestamp: new Date(Date.now() - 300000), metadata: { increase: '450%', period: '2h' } },
  { type: 'exploit_detected', severity: 'high', title: 'CVE-2024-1234 Exploit In-The-Wild', description: 'Active exploitation detected across 12 victim organizations', timestamp: new Date(Date.now() - 600000), metadata: { cve: 'CVE-2024-1234', victims: 12 } },
  { type: 'breach_intel', severity: 'critical', title: 'Major Breach Intelligence Published', description: '50M credentials dataset from Fortune 500 company leaked on underground forum', timestamp: new Date(Date.now() - 900000), metadata: { records: '50M', source: 'Fortune 500' } },
  { type: 'malware_signature', severity: 'medium', title: 'New Malware Family Signature Added', description: 'Emotet variant detected in 3 new campaigns', timestamp: new Date(Date.now() - 1200000), metadata: { malware: 'Emotet', campaigns: 3 } },
];

export default function Dashboard({ onNavigate }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ datasets: 0, entities: 0, reports: 0, threats: 0 });
  const [recentEntities, setRecentEntities] = useState<Entity[]>([]);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAISummary] = useState('');
  const [suspiciousEntries, setSuspiciousEntries] = useState(0);
  const [threatAlerts, setThreatAlerts] = useState<ActivityAlert[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [{ count: dc }, { count: ec }, { count: rc }, { data: ents }, { data: logs }, { data: alerts }] = await Promise.all([
        supabase.from('datasets').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('entities').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('activity_logs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('threat_alerts').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(8),
      ]);

      const threats = (ents ?? []).filter((e: Entity) => e.threat_score >= 70).length;

      // AI Analysis
      const analysis = classifyEntry(JSON.stringify(ents ?? []));
      const summary = generateIntelligenceSummary(analysis, ents ?? []);
      setAISummary(summary);
      setSuspiciousEntries(analysis.classification === 'critical' ? threats : Math.floor(threats * 0.6));

      // Load or seed threat alerts
      if (alerts && alerts.length > 0) {
        setThreatAlerts(alerts.map((a: any) => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          timestamp: new Date(a.created_at),
          metadata: a.metadata,
        })));
      } else {
        // Seed sample alerts into Supabase
        const seedData = SEED_ALERTS.map(a => ({
          user_id: user!.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          metadata: a.metadata || {},
        }));
        await supabase.from('threat_alerts').insert(seedData);
        setThreatAlerts(SEED_ALERTS.map((a, i) => ({ ...a, id: `seed-${i}` })));
      }

      setStats({ datasets: dc ?? 0, entities: ec ?? 0, reports: rc ?? 0, threats });
      setRecentEntities(ents ?? []);
      setRecentLogs(logs ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  const displayEntities = recentEntities.length > 0
    ? recentEntities
    : SAMPLE_ENTITIES.slice(0, 6).map((e, i) => ({ ...e, id: `demo-${i}`, dataset_id: 'demo', user_id: 'demo', context: '', created_at: new Date().toISOString() } as Entity));

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
        <StatCard label="Datasets" value={loading ? '—' : stats.datasets} icon={<Database size={16} />} trend="+2 this week" trendUp accent="cyan" />
        <StatCard label="Entities Found" value={loading ? '—' : stats.entities} icon={<Search size={16} />} trend="+47 today" trendUp accent="cyan" />
        <StatCard label="High Threats" value={loading ? '—' : stats.threats} icon={<AlertTriangle size={16} />} trend="+3 critical" trendUp={false} accent="red" />
        <StatCard label="Reports" value={loading ? '—' : stats.reports} icon={<FileText size={16} />} trend="2 pending" trendUp accent="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Threat categories */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5 xl:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">THREAT CATEGORIES</h3>
          </div>
          <div className="space-y-3">
            {THREAT_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">{cat.label}</span>
                  <span className="text-gray-300">{cat.count}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full transition-all duration-700`}
                    style={{ width: `${cat.pct}%` }}
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
            {displayEntities.map(entity => (
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
            <p className="text-sm text-gray-300 mt-2 font-mono leading-relaxed">{aiSummary}</p>
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

      {/* Live Activity Feed */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-200 font-mono">LIVE THREAT ALERTS</h3>
          </div>
          <span className="text-[10px] font-mono text-green-400 animate-pulse">● LIVE</span>
        </div>
        <LiveActivityFeed alerts={threatAlerts} maxItems={6} />
      </div>

      {/* Old Activity section - now for logging */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={14} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-gray-200 font-mono">ANALYSIS ACTIVITY LOG</h3>
        </div>
        {recentLogs.length === 0 ? (
          <div className="space-y-2">
            {[
              { action: 'Dataset uploaded', details: 'darkweb_intel_03152024.txt', t: '2m ago' },
              { action: 'Entity analysis complete', details: '47 entities extracted', t: '5m ago' },
              { action: 'Report generated', details: 'ThreatReport_2024_Q1.pdf', t: '12m ago' },
              { action: 'New dataset analyzed', details: 'forum_dump_sample.txt', t: '1h ago' },
              { action: 'User login', details: 'Authentication successful', t: '2h ago' },
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
            {recentLogs.map(log => (
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
