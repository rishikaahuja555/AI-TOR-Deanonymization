import type { EntityType } from '../lib/types';

interface Props { type: EntityType }

const typeStyles: Record<EntityType, { label: string; color: string; bg: string }> = {
  email:    { label: 'EMAIL',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25' },
  username: { label: 'USER',    color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/25' },
  wallet:   { label: 'WALLET',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/25' },
  url:      { label: 'URL',     color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25' },
  alias:    { label: 'ALIAS',   color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/25' },
  phone:    { label: 'PHONE',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/25' },
  ip:       { label: 'IP',      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25' },
};

export default function EntityTypeBadge({ type }: Props) {
  const s = typeStyles[type] ?? typeStyles.alias;
  return (
    <span className={`inline-block text-[10px] font-mono font-bold border rounded px-1.5 py-0.5 ${s.color} ${s.bg}`}>
      {s.label}
    </span>
  );
}
