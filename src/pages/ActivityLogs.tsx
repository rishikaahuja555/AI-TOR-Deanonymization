import { useState } from 'react';
import { Activity, Search, Filter, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useActivityLogs } from '../lib/hooks';
import type { ActivityLog } from '../lib/types';

const SAMPLE_LOGS: ActivityLog[] = [
  { id: '1', user_id: 'demo', action: 'Entity analysis complete', details: '47 entities extracted from darkweb_intel_03152024.txt', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 120000).toISOString() },
  { id: '2', user_id: 'demo', action: 'Dataset uploaded', details: 'File: darkweb_intel_03152024.txt (12.4 KB)', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: '3', user_id: 'demo', action: 'Report generated', details: 'DarkWeb Marketplace Analysis Q1 2024', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 720000).toISOString() },
  { id: '4', user_id: 'demo', action: 'Relationship graph built', details: '23 edges constructed between 47 entities', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 900000).toISOString() },
  { id: '5', user_id: 'demo', action: 'Export entities CSV', details: 'entities_20240315.csv downloaded', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '6', user_id: 'demo', action: 'Dataset uploaded', details: 'File: forum_dump_sample.txt (8.1 KB)', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '7', user_id: 'demo', action: 'User login', details: 'Authentication successful from 127.0.0.1', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '8', user_id: 'demo', action: 'Report generated', details: 'Carding Forum Hierarchy Report', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000).toISOString() },
];

const ACTION_COLORS: Record<string, string> = {
  'Entity analysis complete': 'text-cyan-400',
  'Dataset uploaded': 'text-blue-400',
  'Report generated': 'text-green-400',
  'Relationship graph built': 'text-teal-400',
  'User login': 'text-gray-400',
  'Export entities CSV': 'text-yellow-400',
  'AI analysis complete': 'text-cyan-400',
  'Threat alert created': 'text-red-400',
  'TOR entity saved': 'text-orange-400',
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ActivityLogs() {
  const { user } = useAuth();
  const { logs, loading, refetch } = useActivityLogs(user?.id);
  const [search, setSearch] = useState('');

  const display = logs.length > 0 ? logs : SAMPLE_LOGS;
  const filtered = display.filter(l =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white font-mono">ACTIVITY LOGS</h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{filtered.length} EVENTS RECORDED</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-green-400 animate-pulse">● LIVE</span>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
          >
            <RefreshCw size={11} />
            REFRESH
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-gray-800/60 border border-gray-700 text-gray-400 px-3 py-2 rounded-lg text-xs font-mono hover:text-gray-200 transition-all">
            <Filter size={11} />
            FILTER
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Activity size={28} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500 font-mono text-sm">NO LOGS FOUND</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-800/30">
            {filtered.map((log, i) => {
              const color = ACTION_COLORS[log.action] ?? 'text-gray-400';
              return (
                <div key={log.id} className="flex items-start gap-4 py-3 hover:bg-gray-800/20 transition-colors group px-2 rounded-lg">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-4 mt-1">
                    <span className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`} />
                    {i < filtered.length - 1 && <span className="w-px flex-1 bg-gray-800/60" style={{ height: 20 }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-mono font-bold ${color}`}>{log.action}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{timeAgo(log.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{log.details || '—'}</p>
                    {log.ip_address && (
                      <p className="text-[10px] text-gray-600 font-mono mt-0.5">IP: {log.ip_address}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-gray-500 font-mono">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  {logs.length > 0 && (
                    <button
                      onClick={async () => {
                        await supabase.from('activity_logs').delete().eq('id', log.id);
                        refetch();
                      }}
                      className="flex-shrink-0 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
