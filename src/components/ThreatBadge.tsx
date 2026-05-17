interface ThreatBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function getThreatLevel(score: number): { label: string; color: string; bg: string; border: string; dot: string } {
  if (score >= 80) return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/40', dot: 'bg-red-500' };
  if (score >= 60) return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40', dot: 'bg-orange-500' };
  if (score >= 40) return { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', dot: 'bg-yellow-500' };
  return { label: 'LOW', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-500' };
}

export default function ThreatBadge({ score, size = 'sm' }: ThreatBadgeProps) {
  const { label, color, bg, border, dot } = getThreatLevel(score);
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-bold border rounded ${bg} ${border} ${color} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      <span className={`w-2 h-2 rounded-full ${dot} shadow-[0_0_4px_currentColor]`} style={{ color: dot.replace('bg-', '') }} />
      {label}
    </span>
  );
}
