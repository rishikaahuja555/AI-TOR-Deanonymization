import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { ActivityLog, Report } from './types';

export interface ThreatAlert {
  id: string;
  user_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface TorEntity {
  id: string;
  user_id: string;
  type: string;
  value: string;
  threat_score: number;
  confidence: number;
  context: string;
  source: string;
  metadata: Record<string, any>;
  is_verified: boolean;
  created_at: string;
}

export interface DashboardStats {
  datasets: number;
  entities: number;
  reports: number;
  threats: number;
  torEntities: number;
  criticalAlerts: number;
}

export function useDashboardStats(userId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    datasets: 0, entities: 0, reports: 0, threats: 0, torEntities: 0, criticalAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    const [ds, es, rs, te, ta] = await Promise.all([
      supabase.from('datasets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('entities').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('tor_entities').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('threat_alerts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('severity', 'critical'),
    ]);
    const { data: ents } = await supabase.from('entities').select('threat_score').eq('user_id', userId);
    const threats = (ents ?? []).filter((e: { threat_score: number }) => e.threat_score >= 70).length;
    setStats({
      datasets: ds.count ?? 0,
      entities: es.count ?? 0,
      reports: rs.count ?? 0,
      threats,
      torEntities: te.count ?? 0,
      criticalAlerts: ta.count ?? 0,
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  return { stats, loading, refetch: fetchStats };
}

export function useThreatAlerts(userId: string | undefined) {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('threat_alerts').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    setAlerts(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAlerts();

    if (!userId) return;
    const channel = supabase
      .channel('threat_alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threat_alerts', filter: `user_id=eq.${userId}` },
        () => { fetchAlerts(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAlerts, userId]);

  return { alerts, loading, refetch: fetchAlerts };
}

export function useTorEntities(userId: string | undefined) {
  const [entities, setEntities] = useState<TorEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntities = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('tor_entities').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
    setEntities(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchEntities();

    if (!userId) return;
    const channel = supabase
      .channel('tor_entities_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tor_entities', filter: `user_id=eq.${userId}` },
        () => { fetchEntities(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEntities, userId]);

  return { entities, loading, refetch: fetchEntities };
}

export function useActivityLogs(userId: string | undefined) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('activity_logs').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
    setLogs(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchLogs();

    if (!userId) return;
    const channel = supabase
      .channel('activity_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs', filter: `user_id=eq.${userId}` },
        () => { fetchLogs(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLogs, userId]);

  return { logs, loading, refetch: fetchLogs };
}

export function useReports(userId: string | undefined) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('reports').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    setReports(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchReports();

    if (!userId) return;
    const channel = supabase
      .channel('reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `user_id=eq.${userId}` },
        () => { fetchReports(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReports, userId]);

  return { reports, loading, refetch: fetchReports };
}

export async function seedThreatAlerts(userId: string) {
  const alerts = [
    { user_id: userId, type: 'onion_detected', severity: 'critical', title: 'New Onion Domain Detected', description: 'xmkfonixbl7e3rkh.onion registered with ransomware infrastructure patterns', metadata: { domain: 'xmkfonixbl7e3rkh.onion' } },
    { user_id: userId, type: 'wallet_found', severity: 'high', title: 'Crypto Wallet Activity Detected', description: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e - 15 BTC transferred', metadata: { wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', amount: '15 BTC' } },
    { user_id: userId, type: 'threat_spike', severity: 'critical', title: 'Anomalous Threat Level Spike', description: '450% increase in darknet marketplace activity in last 2 hours', metadata: { increase: '450%', period: '2h' } },
    { user_id: userId, type: 'exploit_detected', severity: 'high', title: 'CVE-2024-1234 Exploit In-The-Wild', description: 'Active exploitation detected across 12 victim organizations', metadata: { cve: 'CVE-2024-1234', victims: 12 } },
    { user_id: userId, type: 'breach_intel', severity: 'critical', title: 'Major Breach Intelligence Published', description: '50M credentials dataset from Fortune 500 company leaked on underground forum', metadata: { records: '50M', source: 'Fortune 500' } },
    { user_id: userId, type: 'malware_signature', severity: 'medium', title: 'New Malware Family Signature Added', description: 'Emotet variant detected in 3 new campaigns', metadata: { malware: 'Emotet', campaigns: 3 } },
  ];
  await supabase.from('threat_alerts').insert(alerts);
}

export async function logActivity(userId: string, action: string, details: string) {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    details,
    ip_address: '',
  });
}
