export const SAMPLE_TOR_TEXT = `=== DARKWEB INTELLIGENCE REPORT - CLASSIFIED ===
Timestamp: 2024-03-15T02:47:33Z
Source: TOR Network Monitoring

Subject: Underground marketplace operator intelligence

Primary contact identified via forum post on dreadditevelidot.onion:
Email: phantom_vendor@protonmail.com
Username: @ph4nt0m_v3nd0r
Known alias: The Architect

Infrastructure details:
- Main site: xmkfonixbl7e3rkh.onion/marketplace
- Backup: 7zqa5gqr4nkqlm2b.onion
- Admin panel: 192.168.44.23 (exit node relay)
- Secondary IP: 10.44.128.91

Financial trail:
BTC Wallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf1a
ETH Address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
Monero: 48edfHu7V9Z84YzzMa6fUueoELZ9ZdVqpzFzK6LXVRBqkU14mn7fXXpN9

---
Subject: Carding forum hierarchy reconstruction

Handle: l33t_c4rd3r | Email: shadows_deep@tutanota.com
Phone: +1 (555) 234-7890
aka "ShadowDeal"

Forum moderator: silent_ghost_99@mail2tor.com
Alias: GhostMod | @ghost_mod_official

BTC: 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy

Infrastructure hosting:
- bulletproof.onion (primary)
- 185.220.101.47 (VPS exit)

---
Subject: Ransomware collective profile

Group alias: "NullByte Collective"
Operator: darkbyte_ops@securemail.is
Bitcoin ransom wallet: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh

Associated domains:
- nullbyte-payments.onion
- nbcollective.onion/payment

Contact: nbops_support@protonmail.com
@nullbyte_official (Telegram handle)

Servers identified:
- 95.211.230.32
- 176.58.100.12

---
Subject: Credentials marketplace thread

Vendor: @cred_king_x
Email: credking@darkforum.onion
Payments accepted:
  BTC: 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2
  ETH: 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B

Known aliases: CredKing, The Data Baron
Phone contact: +44 7911 123456

Site: credmarket44abcxyz.onion/shop

---
END OF REPORT
`;

export const SAMPLE_ENTITIES = [
  { type: 'email', value: 'phantom_vendor@protonmail.com', threat_score: 72, confidence: 0.95 },
  { type: 'email', value: 'shadows_deep@tutanota.com', threat_score: 68, confidence: 0.93 },
  { type: 'email', value: 'darkbyte_ops@securemail.is', threat_score: 88, confidence: 0.97 },
  { type: 'username', value: 'ph4nt0m_v3nd0r', threat_score: 55, confidence: 0.82 },
  { type: 'username', value: 'l33t_c4rd3r', threat_score: 70, confidence: 0.85 },
  { type: 'username', value: 'nullbyte_official', threat_score: 90, confidence: 0.91 },
  { type: 'wallet', value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf1a', threat_score: 78, confidence: 0.88 },
  { type: 'wallet', value: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', threat_score: 65, confidence: 0.86 },
  { type: 'url', value: 'xmkfonixbl7e3rkh.onion/marketplace', threat_score: 92, confidence: 0.99 },
  { type: 'url', value: 'nullbyte-payments.onion', threat_score: 95, confidence: 0.99 },
  { type: 'alias', value: 'The Architect', threat_score: 45, confidence: 0.75 },
  { type: 'alias', value: 'NullByte Collective', threat_score: 88, confidence: 0.9 },
  { type: 'ip', value: '185.220.101.47', threat_score: 80, confidence: 0.92 },
  { type: 'ip', value: '95.211.230.32', threat_score: 75, confidence: 0.9 },
];
