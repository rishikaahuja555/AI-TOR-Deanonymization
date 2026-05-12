import type { EntityType } from './types';

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
  threat_score: number;
  context: string;
}

const patterns: { type: EntityType; regex: RegExp; baseThreat: number; confidence: number }[] = [
  {
    type: 'email',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    baseThreat: 45,
    confidence: 0.95,
  },
  {
    type: 'url',
    regex: /(?:https?:\/\/|http?:\/\/)?(?:[a-zA-Z0-9\-]+\.)+(?:onion|com|net|org|io|co)[\/\w\-\.\?\=\&\%\#]*/g,
    baseThreat: 60,
    confidence: 0.9,
  },
  {
    type: 'wallet',
    regex: /\b(?:1|3|bc1)[A-HJ-NP-Za-km-z1-9]{25,39}\b|\b0x[a-fA-F0-9]{40}\b|[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g,
    baseThreat: 75,
    confidence: 0.88,
  },
  {
    type: 'ip',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    baseThreat: 55,
    confidence: 0.92,
  },
  {
    type: 'username',
    regex: /(?:^|\s)@([a-zA-Z0-9_]{3,20})(?:\s|$)/gm,
    baseThreat: 30,
    confidence: 0.8,
  },
  {
    type: 'alias',
    regex: /(?:aka|alias|known as|goes by|handle[:\s]+)["']?([a-zA-Z0-9_\-\s]{3,30})["']?/gi,
    baseThreat: 35,
    confidence: 0.75,
  },
  {
    type: 'phone',
    regex: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s][0-9]{3}[-.\s][0-9]{4}/g,
    baseThreat: 40,
    confidence: 0.85,
  },
];

function getContext(text: string, match: string, radius = 60): string {
  const idx = text.indexOf(match);
  if (idx === -1) return '';
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + match.length + radius);
  return text.slice(start, end).replace(/\n/g, ' ').trim();
}

function jitter(base: number, range = 20): number {
  return Math.min(100, Math.max(0, base + (Math.random() * range - range / 2)));
}

export function extractEntities(text: string): ExtractedEntity[] {
  const seen = new Set<string>();
  const results: ExtractedEntity[] = [];

  for (const { type, regex, baseThreat, confidence } of patterns) {
    const matches = Array.from(text.matchAll(regex));
    for (const match of matches) {
      const raw = (match[1] ?? match[0]).trim();
      const key = `${type}:${raw.toLowerCase()}`;
      if (seen.has(key) || raw.length < 3) continue;
      seen.add(key);

      const isTor = raw.includes('.onion');
      const threatBonus = isTor ? 25 : 0;

      results.push({
        type,
        value: raw,
        confidence: Math.min(1, confidence + (isTor ? 0.05 : 0)),
        threat_score: Math.round(jitter(baseThreat + threatBonus, 15)),
        context: getContext(text, match[0]),
      });
    }
  }

  return results;
}

export function buildRelationships(entities: { id: string; type: EntityType; value: string }[]) {
  const edges: { source_entity_id: string; target_entity_id: string; relationship_type: string; strength: number }[] = [];
  const used = new Set<string>();

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i];
      const b = entities[j];
      const key = [a.id, b.id].sort().join('-');
      if (used.has(key)) continue;

      let strength = 0;
      let rel = '';

      if (a.type === 'email' && b.type === 'username') {
        strength = 0.85;
        rel = 'identity_link';
      } else if (a.type === 'wallet' && b.type === 'email') {
        strength = 0.7;
        rel = 'financial_link';
      } else if (a.type === 'url' && b.type === 'ip') {
        strength = 0.9;
        rel = 'infrastructure';
      } else if (a.type === 'alias' && (b.type === 'username' || b.type === 'email')) {
        strength = 0.8;
        rel = 'identity_alias';
      } else if (Math.random() < 0.25) {
        strength = Math.random() * 0.5 + 0.2;
        rel = 'co_occurrence';
      }

      if (strength > 0) {
        used.add(key);
        edges.push({ source_entity_id: a.id, target_entity_id: b.id, relationship_type: rel, strength });
      }
    }
  }

  return edges;
}
