import type { EntityType } from './types';

export interface AIAnalysisResult {
  classification: 'suspicious' | 'normal' | 'critical';
  confidence: number;
  reasons: string[];
  nlpKeywords: string[];
  predictedThreatScore: number;
}

export interface ThreatActorProfile {
  identifier: string;
  aliases: string[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  operationalPattern: string;
  knownInfrastructure: string[];
  estimatedActivity: string;
}

export interface IOCExtraction {
  type: EntityType;
  value: string;
  confidence: number;
  context: string;
  temporalIndicators: string[];
}

export function classifyEntry(text: string): AIAnalysisResult {
  const lowerText = text.toLowerCase();
  const keywords = ['exploit', 'vulnerability', 'ransomware', 'malware', 'botnet', 'c2', 'payload', 'breach', 'stolen', 'compromised', 'darknet', 'onion', 'tor', 'cryptocurrency', 'laundering', 'fraud', 'carding', 'phishing', 'ddos'];
  const foundKeywords = keywords.filter(k => lowerText.includes(k));

  const suspiciousPatterns = [
    /\b0x[a-f0-9]{40}\b/gi, // Eth address
    /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/gi, // BTC
    /\.onion\b/gi, // Onion domain
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP
  ];

  let patternMatches = 0;
  suspiciousPatterns.forEach(p => {
    const matches = text.match(p);
    if (matches) patternMatches += matches.length;
  });

  const emailCount = (text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []).length;
  const urlCount = (text.match(/https?:\/\/\S+/gi) || []).length;

  const suspicionScore = (foundKeywords.length * 2 + patternMatches * 1.5 + emailCount * 0.5 + urlCount * 0.8) / 10;
  const threatScore = Math.min(100, suspicionScore * 15);

  let classification: 'suspicious' | 'normal' | 'critical' = 'normal';
  if (threatScore >= 70) classification = 'critical';
  else if (threatScore >= 45) classification = 'suspicious';

  const reasons = [];
  if (foundKeywords.length > 0) reasons.push(`Detected ${foundKeywords.length} threat-related keywords`);
  if (patternMatches > 0) reasons.push(`Found ${patternMatches} cryptographic/IOC patterns`);
  if (emailCount > 2) reasons.push(`Multiple email addresses detected (${emailCount})`);
  if (urlCount > 1) reasons.push(`Multiple URLs detected (${urlCount})`);

  return {
    classification,
    confidence: Math.min(0.99, 0.5 + suspicionScore * 0.1),
    reasons: reasons.length > 0 ? reasons : ['No immediate threats detected'],
    nlpKeywords: foundKeywords,
    predictedThreatScore: Math.round(threatScore),
  };
}

export function predictThreatScore(entity: {
  type: EntityType;
  value: string;
  context?: string;
}): number {
  const baseScores: Record<EntityType, number> = {
    email: 40,
    username: 35,
    wallet: 75,
    url: 65,
    alias: 30,
    phone: 25,
    ip: 60,
  };

  let score = baseScores[entity.type] || 50;

  // Boost for TOR/onion
  if (entity.value.includes('.onion')) score += 30;

  // Boost for suspicious patterns
  if (entity.value.match(/[0-9a-f]{40,}/i)) score += 20; // Hash-like
  if (entity.value.match(/^0x[a-f0-9]{40}$/i)) score += 25; // Eth wallet
  if (entity.value.match(/ransomware|malware|c2|botnet|exploit/i)) score += 35;

  // Context analysis
  if (entity.context) {
    const contextLower = entity.context.toLowerCase();
    if (contextLower.includes('ransomware')) score += 20;
    if (contextLower.includes('stolen')) score += 15;
    if (contextLower.includes('breach')) score += 18;
    if (contextLower.includes('malware')) score += 25;
    if (contextLower.includes('exploit')) score += 20;
  }

  return Math.min(100, Math.round(score + Math.random() * 10 - 5));
}

export function analyzeNLPContent(text: string): {
  sentiment: 'malicious' | 'neutral' | 'benign';
  topicsTags: string[];
  keyIndicators: string[];
  estimatedSeverity: 'low' | 'medium' | 'high' | 'critical';
} {
  const maliciousTerms = [
    'exploit', 'vulnerability', 'ransomware', 'malware', 'botnet', 'c2', 'payload',
    'breach', 'stolen', 'compromised', 'attack', 'intrusion', 'malicious',
  ];
  const neutralTerms = ['analysis', 'report', 'finding', 'detection', 'identified'];
  const benignTerms = ['security', 'protection', 'defense', 'patch', 'update'];

  const maliciousCount = maliciousTerms.filter(t => text.toLowerCase().includes(t)).length;
  const neutralCount = neutralTerms.filter(t => text.toLowerCase().includes(t)).length;
  const benignCount = benignTerms.filter(t => text.toLowerCase().includes(t)).length;

  let sentiment: 'malicious' | 'neutral' | 'benign' = 'neutral';
  if (maliciousCount > neutralCount) sentiment = 'malicious';
  else if (benignCount > neutralCount) sentiment = 'benign';

  const topicsTags: string[] = [];
  if (text.match(/ransomware/i)) topicsTags.push('Ransomware');
  if (text.match(/malware|virus/i)) topicsTags.push('Malware');
  if (text.match(/phishing|social engineering/i)) topicsTags.push('Phishing');
  if (text.match(/carding|credit|payment/i)) topicsTags.push('Financial');
  if (text.match(/cryptocurrency|bitcoin|eth|monero/i)) topicsTags.push('Crypto');
  if (text.match(/exploit|vulnerability|cve/i)) topicsTags.push('Exploits');

  const keyIndicators = maliciousTerms.filter(t => text.toLowerCase().includes(t));

  const severity = maliciousCount >= 3 ? 'critical' : maliciousCount >= 1 ? 'high' : sentiment === 'benign' ? 'low' : 'medium';

  return { sentiment, topicsTags, keyIndicators, estimatedSeverity: severity };
}

export function extractNamedEntities(text: string): {
  persons: string[];
  organizations: string[];
  locations: string[];
  tools: string[];
} {
  // Simplified NER - in production use a proper NLP library
  const patterns = {
    persons: /(?:known as|aka|alias|operator|admin|user)[\s:]+([A-Za-z0-9_\-]{3,20})/gi,
    organizations: /(?:group|collective|crew|team|cartel)[\s:]+([A-Za-z0-9_\-\s]{3,30})/gi,
    tools: /(?:using|uses|tool|malware|framework)[\s:]+([A-Za-z0-9_\-\s]{3,20})/gi,
  };

  const persons: string[] = [];
  const organizations: string[] = [];
  const tools: string[] = [];
  let match;

  const personPattern = patterns.persons;
  while ((match = personPattern.exec(text)) !== null) {
    persons.push(match[1]);
  }

  const orgPattern = patterns.organizations;
  while ((match = orgPattern.exec(text)) !== null) {
    organizations.push(match[1]);
  }

  const toolPattern = patterns.tools;
  while ((match = toolPattern.exec(text)) !== null) {
    tools.push(match[1]);
  }

  return { persons: [...new Set(persons)], organizations: [...new Set(organizations)], locations: [], tools: [...new Set(tools)] };
}

export function generateIntelligenceSummary(analysis: AIAnalysisResult, entities: any[]): string {
  const criticalEntities = entities.filter((e: any) => e.threat_score >= 80).length;
  const highEntities = entities.filter((e: any) => e.threat_score >= 60).length;

  let summary = '';
  if (analysis.classification === 'critical') {
    summary = `CRITICAL: Analysis detected ${criticalEntities} critical threat indicators. `;
    summary += `Key findings: ${analysis.reasons.join('; ')}. `;
    summary += `Recommended action: Immediate incident response and threat hunting.`;
  } else if (analysis.classification === 'suspicious') {
    summary = `SUSPICIOUS: Dataset contains ${highEntities} elevated-risk entities. `;
    summary += `Analysis indicates: ${analysis.reasons.join('; ')}. `;
    summary += `Recommended action: Enhanced monitoring and investigation.`;
  } else {
    summary = `NORMAL: Dataset analysis shows ${entities.length} total entities. `;
    summary += `No critical indicators detected. `;
    summary += `Recommended action: Continue routine monitoring.`;
  }

  return summary;
}
