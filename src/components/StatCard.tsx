import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: 'cyan' | 'red' | 'yellow' | 'green';
}

const accentMap = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: 'text-cyan-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: 'text-yellow-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: 'text-green-400' },
};

export default function StatCard({ label, value, icon, trend, trendUp, accent = 'cyan' }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div className={`bg-gray-900 border ${a.border} rounded-xl p-5 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${a.bg} rounded-full blur-2xl -translate-y-6 translate-x-6`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 font-mono tracking-wider uppercase">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${a.text} font-mono`}>{value}</p>
          {trend && (
            <p className={`text-xs mt-1 font-mono ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 ${a.bg} border ${a.border} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <span className={a.icon}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
