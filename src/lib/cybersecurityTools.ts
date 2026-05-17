export interface ParsedOnion {
  domain: string;
  isV2: boolean;
  isV3: boolean;
  hasPort: boolean;
  port?: number;
  path?: string;
  threatIndicators: string[];
}

export interface WalletCluster {
  wallets: string[];
  type: 'bitcoin' | 'ethereum' | 'monero';
  totalValue?: string;
  clusterId: string;
  relatedAddresses: string[];
  suspicionScore: number;
}

export interface ThreatActorProfile {
  name: string;
  aliases: string[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  operationalPattern: string;
  knownInfrastructure: string[];
  estimatedActivity: string;
  lastSeen: string;
  attributedIncidents: string[];
}

export interface IOC {
  value: string;
  type: 'ip' | 'domain' | 'url' | 'email' | 'hash' | 'wallet' | 'username';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  context: string;
  firstSeen: string;
  lastSeen: string;
}

export function parseOnionURL(url: string): ParsedOnion {
  const threatKeywords = ['ransomware', 'exploit', 'marketplace', 'c2', 'botnet', 'malware'];
  const indicators = threatKeywords.filter(k => url.toLowerCase().includes(k));

  // Extract domain
  const domainMatch = url.match(/([a-z0-9]+\.onion)/i);
  const domain = domainMatch?.[1] || url;

  // Check version
  const isV2 = domain.length === 22; // 16 char + .onion
  const isV3 = domain.length === 56; // 56 char + .onion

  // Parse port
  const portMatch = url.match(/:(\d+)/);
  const port = portMatch ? parseInt(portMatch[1]) : undefined;
  const hasPort = !!portMatch;

  // Parse path
  const pathMatch = url.match(/\.onion(\/[^\s?]*)?/);
  const path = pathMatch?.[1];

  return {
    domain,
    isV2,
    isV3,
    hasPort,
    port,
    path,
    threatIndicators: indicators,
  };
}

export function clusterWallets(wallets: string[]): WalletCluster[] {
  const btcWallets = wallets.filter(w => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(w));
  const ethWallets = wallets.filter(w => /^0x[a-fA-F0-9]{40}$/.test(w));
  const xmrWallets = wallets.filter(w => w.length > 90 && w.length < 106);

  const clusters: WalletCluster[] = [];

  if (btcWallets.length > 0) {
    clusters.push({
      wallets: btcWallets,
      type: 'bitcoin',
      clusterId: `btc-${Date.now()}`,
      relatedAddresses: btcWallets.slice(0, 3),
      suspicionScore: btcWallets.length > 5 ? 0.85 : 0.65,
    });
  }

  if (ethWallets.length > 0) {
    clusters.push({
      wallets: ethWallets,
      type: 'ethereum',
      clusterId: `eth-${Date.now()}`,
      relatedAddresses: ethWallets.slice(0, 3),
      suspicionScore: ethWallets.length > 3 ? 0.75 : 0.55,
    });
  }

  if (xmrWallets.length > 0) {
    clusters.push({
      wallets: xmrWallets,
      type: 'monero',
      clusterId: `xmr-${Date.now()}`,
      relatedAddresses: xmrWallets.slice(0, 2),
      suspicionScore: 0.9, // Monero high suspicion due to privacy
    });
  }

  return clusters;
}

export function profileThreatActor(name: string, aliases: string[], infrastructure: string[]): ThreatActorProfile {
  const threatLevels: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
  const threatLevel = threatLevels[Math.min(aliases.length + infrastructure.length, 3)];

  const operationalPatterns = [
    'Targets financial institutions',
    'Operates ransomware as a service',
    'Focuses on data exfiltration',
    'Conducts supply chain attacks',
    'Deploys advanced persistent threats',
  ];

  return {
    name,
    aliases,
    threatLevel,
    operationalPattern: operationalPatterns[Math.floor(Math.random() * operationalPatterns.length)],
    knownInfrastructure: infrastructure,
    estimatedActivity: 'High operational tempo with 2-3 attacks per week',
    lastSeen: new Date().toISOString(),
    attributedIncidents: [],
  };
}

export function extractIOCs(text: string): IOC[] {
  const iocs: IOC[] = [];

  // IP addresses
  const ipPattern = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  const ipMatches = text.match(ipPattern) || [];
  ipMatches.forEach(ip => {
    iocs.push({
      value: ip,
      type: 'ip',
      severity: ip.startsWith('192.168') || ip.startsWith('10.') ? 'low' : 'high',
      source: 'text_extraction',
      context: 'Network infrastructure indicator',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });
  });

  // Domains/URLs
  const domainPattern = /(?:https?:\/\/)?(?:[a-zA-Z0-9\-]+\.)+(?:onion|com|net|org|io)[\/\w\-\.\?\=\&\%\#]*/g;
  const domainMatches = text.match(domainPattern) || [];
  domainMatches.forEach(domain => {
    iocs.push({
      value: domain,
      type: domain.includes('.onion') ? 'domain' : 'url',
      severity: domain.includes('.onion') ? 'critical' : 'medium',
      source: 'text_extraction',
      context: 'Web-based infrastructure',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });
  });

  // Email addresses
  const emailPattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = text.match(emailPattern) || [];
  emailMatches.forEach(email => {
    iocs.push({
      value: email,
      type: 'email',
      severity: 'medium',
      source: 'text_extraction',
      context: 'Communication vector',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });
  });

  // Wallets
  const walletPattern = /\b(?:1|3|bc1)[A-HJ-NP-Za-km-z1-9]{25,39}\b|\b0x[a-fA-F0-9]{40}\b/g;
  const walletMatches = text.match(walletPattern) || [];
  walletMatches.forEach(wallet => {
    iocs.push({
      value: wallet,
      type: 'wallet',
      severity: 'high',
      source: 'text_extraction',
      context: 'Cryptocurrency financial indicator',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });
  });

  return iocs;
}

export function calculateIOCRisk(ioc: IOC): number {
  const severityScores = { low: 25, medium: 50, high: 75, critical: 100 };
  let score = severityScores[ioc.severity];

  if (ioc.type === 'wallet') score += 15;
  if (ioc.type === 'domain' && ioc.value.includes('.onion')) score += 25;
  if (ioc.context.includes('ransomware')) score += 20;

  return Math.min(100, score);
}
