interface ThreatBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function getThreatLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 80) return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
  if (score >= 60) return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
  if (score >= 40) return { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  return { label: 'LOW', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
}

export default function ThreatBadge({ score, size = 'sm' }: ThreatBadgeProps) {
  const { label, color, bg, border } = getThreatLevel(score);
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-bold border rounded ${bg} ${border} ${color} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
      {label}
    </span>
  );
}
