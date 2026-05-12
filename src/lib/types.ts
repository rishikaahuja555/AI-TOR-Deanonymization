export type EntityType = 'email' | 'username' | 'wallet' | 'url' | 'alias' | 'phone' | 'ip';

export interface Entity {
  id: string;
  dataset_id: string;
  user_id: string;
  type: EntityType;
  value: string;
  confidence: number;
  threat_score: number;
  context: string;
  created_at: string;
}

export interface Relationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  user_id: string;
  relationship_type: string;
  strength: number;
  created_at: string;
}

export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  content: string;
  file_size: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  dataset_id: string | null;
  title: string;
  summary: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  entity_count: number;
  findings: Finding[];
  created_at: string;
}

export interface Finding {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  type: EntityType;
  value: string;
  threat_score: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: string;
}
