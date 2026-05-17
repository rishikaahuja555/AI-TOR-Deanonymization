import { useEffect, useState } from 'react';
import { AlertTriangle, Globe, Zap, Shield, TrendingUp, Lock } from 'lucide-react';

export interface ActivityAlert {
  id: string;
  type: 'onion_detected' | 'wallet_found' | 'threat_spike' | 'exploit_detected' | 'breach_intel' | 'malware_signature';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const MOCK_ALERTS: ActivityAlert[] = [
  {
    id: '1',
    type: 'onion_detected',
    severity: 'critical',
    title: 'New Onion Domain Detected',
    description: 'xmkfonixbl7e3rkh.onion registered with ransomware infrastructure patterns',
    timestamp: new Date(Date.now() - 30000),
    metadata: { domain: 'xmkfonixbl7e3rkh.onion' },
  },
  {
    id: '2',
    type: 'wallet_found',
    severity: 'high',
    title: 'Crypto Wallet Activity Detected',
    description: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e - 15 BTC transferred',
    timestamp: new Date(Date.now() - 120000),
    metadata: { wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', amount: '15 BTC' },
  },
  {
    id: '3',
    type: 'threat_spike',
    severity: 'critical',
    title: 'Anomalous Threat Level Spike',
    description: '450% increase in darknet marketplace activity in last 2 hours',
    timestamp: new Date(Date.now() - 300000),
    metadata: { increase: '450%', period: '2h' },
  },
  {
    id: '4',
    type: 'exploit_detected',
    severity: 'high',
    title: 'CVE-2024-1234 Exploit In-The-Wild',
    description: 'Active exploitation detected across 12 victim organizations',
    timestamp: new Date(Date.now() - 600000),
    metadata: { cve: 'CVE-2024-1234', victims: 12 },
  },
  {
    id: '5',
    type: 'breach_intel',
    severity: 'critical',
    title: 'Major Breach Intelligence Published',
    description: '50M credentials dataset from Fortune 500 company leaked on underground forum',
    timestamp: new Date(Date.now() - 900000),
    metadata: { records: '50M', source: 'Fortune 500' },
  },
  {
    id: '6',
    type: 'malware_signature',
    severity: 'medium',
    title: 'New Malware Family Signature Added',
    description: 'Emotet variant detected in 3 new campaigns',
    timestamp: new Date(Date.now() - 1200000),
    metadata: { malware: 'Emotet', campaigns: 3 },
  },
];

const SEVERITY_CONFIG = {
  low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: Shield },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Zap },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: TrendingUp },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
};

const TYPE_ICONS: Record<ActivityAlert['type'], typeof Globe> = {
  onion_detected: Globe,
  wallet_found: Lock,
  threat_spike: TrendingUp,
  exploit_detected: Zap,
  breach_intel: AlertTriangle,
  malware_signature: Shield,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

interface Props {
  alerts?: ActivityAlert[];
  maxItems?: number;
}

export default function LiveActivityFeed({ alerts = MOCK_ALERTS, maxItems = 8 }: Props) {
  const [displayAlerts, setDisplayAlerts] = useState<ActivityAlert[]>(alerts.slice(0, maxItems));
  const [pulse, setPulse] = useState<string | null>(null);

  useEffect(() => {
    setDisplayAlerts(alerts.slice(0, maxItems));
    if (alerts.length > 0) {
      setPulse(alerts[0].id);
      setTimeout(() => setPulse(null), 2000);
    }
  }, [alerts, maxItems]);

  return (
    <div className="space-y-2">
      {displayAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-600 font-mono text-sm">NO RECENT ACTIVITY</div>
      ) : (
        displayAlerts.map((alert, idx) => {
          const severity = SEVERITY_CONFIG[alert.severity];
          const AlertIcon = TYPE_ICONS[alert.type];
          const severityIcon = severity.icon;

          return (
            <div
              key={alert.id}
              className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                pulse === alert.id ? 'animate-pulse' : ''
              } ${severity.bg} ${severity.border}`}
            >
              {/* Animated left border indicator */}
              <div className={`absolute left-0 top-0 h-full w-1 ${severity.color.replace('text-', 'bg-')}`} />

              <div className="flex items-start gap-3 p-3">
                {/* Icon */}
                <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${severity.bg} border ${severity.border}`}>
                  <AlertIcon size={14} className={severity.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-xs font-mono font-bold ${severity.color}`}>{alert.title}</p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{alert.description}</p>
                    </div>
                    <span className={`text-[10px] font-mono text-gray-500 flex-shrink-0 whitespace-nowrap`}>
                      {timeAgo(alert.timestamp)}
                    </span>
                  </div>

                  {/* Metadata chips */}
                  {alert.metadata && Object.entries(alert.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(alert.metadata)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <span key={key} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${severity.border} ${severity.color.replace('text-', 'bg-')}/20`}>
                            <span className="text-gray-500">{key}:</span> {String(value)}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Pulse indicator for most recent */}
                {idx === 0 && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
