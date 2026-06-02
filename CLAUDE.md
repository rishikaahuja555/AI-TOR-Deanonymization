# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI TOR Entity Analyzer** is a cybersecurity intelligence platform built with React + TypeScript + Vite. It provides real-time threat analysis, entity extraction from darknet data, relationship graphing, and AI-powered threat intelligence. The backend is Supabase with PostgreSQL, providing authentication, database storage, and real-time subscriptions.

### Core Purpose
- Extract and classify entities (emails, wallets, onion URLs, IPs, usernames, domains) from security datasets
- Analyze threat relationships and build entity graphs
- Generate intelligence reports with AI-powered threat scoring
- Monitor live threat alerts from Supabase in real-time
- Maintain activity audit logs for compliance

---

## Architecture

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, Lucide icons
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + REST API)
- **Styling**: Tailwind CSS with custom cybersecurity dark theme (gray-950 base, cyan-400 accent)

### Data Model (Supabase Tables)

**Core Entity Tables** (with Row Level Security enabled):
- `datasets` — Uploaded files/datasets for analysis (user_id FK)
- `entities` — Extracted entities with threat scores (user_id, dataset_id FK)
- `relationships` — Links between entities (source/target entity_id FK, user_id FK)
- `reports` — Generated intelligence reports (user_id, dataset_id FK)
- `activity_logs` — Audit trail of user actions (user_id FK)

**Intelligence Tables** (real-time enabled):
- `threat_alerts` — Live threat alerts with severity/type (user_id FK)
- `ai_analyses` — Saved AI analysis results with NLP/IOC data (user_id FK)
- `tor_entities` — TOR-specific entities sourced from darknet scans (user_id FK)

**All tables enforce RLS**: Users can only access their own data via auth.uid() = user_id.

### File Structure

```
src/
├── App.tsx                          # Main app + router logic, includes test connection
├── main.tsx                         # React entry point
├── index.css                        # Global styles (Tailwind + custom theme)
├── supabaseClient.ts                # Singleton Supabase client (env vars)
├── contexts/
│   └── AuthContext.tsx              # Email/password auth provider
├── pages/
│   ├── Login.tsx                    # Sign in/register page
│   ├── Dashboard.tsx                # Real-time stats, live alerts, entity monitor
│   ├── EntityAnalysis.tsx           # Upload/extract entities, build relationship graph
│   ├── ThreatIntelligence.tsx       # Browse tor_entities, threat distribution
│   ├── AIIntelligence.tsx           # Run NLP/IOC/onion/wallet analysis, save results
│   ├── Reports.tsx                  # Generate/browse intelligence reports
│   ├── ActivityLogs.tsx             # Real-time audit log viewer
│   └── Settings.tsx                 # User preferences, clear all data
├── components/
│   ├── Layout.tsx                   # Sidebar nav + header + main content area
│   ├── EntityTypeBadge.tsx          # Color-coded entity type chips
│   ├── ThreatBadge.tsx              # Threat score severity indicator (0-100)
│   ├── StatCard.tsx                 # KPI cards for dashboard
│   ├── LiveActivityFeed.tsx         # Real-time alert component with pulse animation
│   ├── ThreatLineChart.tsx          # 7-day threat trend line chart
│   ├── ThreatHeatmap.tsx            # Hour-of-day x day-of-week heatmap
│   └── RelationshipGraph.tsx        # Force-directed entity relationship graph
└── lib/
    ├── supabaseClient.ts            # Re-export of supabaseClient (for compat)
    ├── hooks.ts                     # Reusable data fetching + realtime hooks
    ├── types.ts                     # TypeScript interfaces (Entity, Report, etc)
    ├── aiAnalysis.ts                # NLP classification, threat scoring, summaries
    ├── cybersecurityTools.ts        # Onion parser, wallet clustering, threat profiles
    ├── entityExtractor.ts           # Regex-based entity extraction + relationship builder
    ├── sampleData.ts                # Demo data for offline testing
    └── hooks.ts                     # (legacy, unused - marked for removal)
```

### Data Flow

1. **Authentication** → `AuthContext` manages session via Supabase Auth
2. **File Upload** → `EntityAnalysis` uploads to `datasets`, extracts entities
3. **Entity Storage** → Saved to both `entities` and `tor_entities` (if threat_score ≥ 40)
4. **Real-time UI** → `useActivityLogs`, `useThreatAlerts`, `useTorEntities` hooks subscribe to changes
5. **AI Analysis** → `AIIntelligence` runs local ML, saves results to `ai_analyses`
6. **Dashboard** → Aggregates stats, displays live alerts, shows entity monitor

### Real-time Subscriptions

The `src/lib/hooks.ts` file provides React hooks that auto-subscribe to Supabase realtime changes:

```typescript
// Fetch + subscribe, auto-refetch on INSERT/UPDATE/DELETE
const { entities, loading, refetch } = useTorEntities(userId);
const { alerts, loading, refetch } = useThreatAlerts(userId);
const { logs, loading, refetch } = useActivityLogs(userId);
const { reports, loading, refetch } = useReports(userId);
const { stats, loading, refetch } = useDashboardStats(userId);

// Manual helpers
await logActivity(userId, 'Entity analysis complete', details);
await seedThreatAlerts(userId);  // Seeds 6 sample alerts if empty
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type check (no emit, catches TS errors before build)
npm run typecheck

# Run linter (ESLint + TypeScript-ESLint)
npm run lint

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

### Before Committing
Always run `npm run typecheck` to catch TypeScript errors — the build will fail otherwise.

---

## Key Supabase Integration Points

### Environment Variables (`.env`)
```
VITE_SUPABASE_URL=https://xrmsucantuufduroittr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Public anon key for client
```

### Single Source of Truth
- **`src/supabaseClient.ts`** — Singleton Supabase client using env vars
- All pages/contexts import from this one file (not from `@supabase/supabase-js` directly)
- Enables future migration to different provider without refactoring imports

### Row Level Security (RLS)
- Every table has `user_id` column as foreign key to `auth.users(id)`
- RLS policies enforce `auth.uid() = user_id` for all CRUD operations
- Users cannot query other users' data even with direct SQL

### Session Management
- `AuthContext` uses `supabase.auth.onAuthStateChange()` to persist session across reloads
- Middleware pattern optional (not currently implemented, but can add `middleware.ts` for next-auth-like behavior)

---

## Common Tasks

### Adding a New Data Table
1. Create migration via Supabase dashboard or SQL editor
2. Add RLS policies: `SELECT/INSERT/UPDATE/DELETE` with `auth.uid() = user_id` check
3. Add TypeScript interface in `src/lib/types.ts`
4. Create hook in `src/lib/hooks.ts` if real-time is needed
5. Import hook in page and call with `userId`

### Creating a New Page
1. Create `src/pages/NewPage.tsx` with default export
2. Add route type to `export type Page` in `src/App.tsx`
3. Import page in `App.tsx` and add conditional render
4. Add nav item to `Layout.tsx` navItems array
5. Use `useThreatAlerts()` or other hooks for live data

### Debugging Real-time Issues
- Open browser DevTools → Network tab, filter to WebSocket connections
- Supabase realtime will show as `wss://...` connection
- Check RLS policies: if subscription fires but no data returned, RLS is blocking
- Verify `user_id` matches `auth.uid()` in row

### Running AI Analysis Locally
- No external API calls — all NLP/threat scoring is client-side
- `classifyEntry()` returns `{ classification, confidence, predictedThreatScore, reasons, nlpKeywords }`
- Saved to `ai_analyses` table for audit trail + history tab

---

## Design System

### Color Palette
- **Background**: `gray-950` (near black)
- **Accents**: `cyan-400` (primary), `cyan-500/10` (hover/backgrounds)
- **Severity**: Red (critical), Orange (high), Yellow (medium), Green (low)
- **Border/text**: `gray-800`, `gray-400`, `text-gray-300`

### Component Patterns
- All modals/panels use `bg-gray-900 border border-gray-800/60 rounded-xl p-5`
- Icon buttons: `hover:text-cyan-400 transition-colors`
- Data tables: `.font-mono text-xs` for monospace terminal feel
- Badges: `text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border`

### Typography
- Headings: `font-mono` with `font-bold`
- Labels: `text-xs text-gray-500 font-mono tracking-wider`
- Body: `text-sm text-gray-300 font-mono`
- Captions: `text-[10px] font-mono text-gray-600`

---

## Performance Considerations

- **Entity graphs**: Rendering 100+ nodes with D3/canvas can be slow. Use `key={entity.id}` and memo() if re-renders are frequent.
- **Real-time subscriptions**: Each hook creates one WebSocket subscription. Limit to ~5 concurrent hooks per page.
- **Large datasets**: Paginate entity tables at 100+ rows. Current implementation loads all into state.
- **File uploads**: No size limit enforced client-side. Supabase has 1GB max by default.

---

## Testing

No test suite is configured. To add:
- Install `vitest` and `@testing-library/react`
- Create `src/__tests__/` directory
- Run `vitest` in watch mode during development

---

## Deployment

The project builds to a static `dist/` folder optimized for any static host (Vercel, Netlify, GitHub Pages, etc).

```bash
npm run build
# Outputs to: dist/index.html, dist/assets/index-*.{js,css}
```

Key production considerations:
- Supabase credentials are public (anon key) — no secrets exposed
- CORS is enabled on Supabase by default for any origin
- Session tokens stored in cookies managed by Supabase client library

---

## Debugging Tips

1. **"Cannot find module" errors** → Run `npm install`, check `import` paths use relative paths
2. **TypeScript errors before build** → Run `npm run typecheck` to see full diagnostics
3. **Blank dashboard** → Check browser console for auth errors, verify `.env` vars are loaded
4. **Realtime not updating** → Check RLS policies, verify `user_id` column exists and is indexed
5. **Entity extraction finds nothing** → Review regex patterns in `src/lib/entityExtractor.ts`
6. **AI analysis returns generic text** → Check `classifyEntry()` logic in `src/lib/aiAnalysis.ts`

---

## Future Improvements

- [ ] Add pagination to entity tables (currently loads all rows)
- [ ] Add CSV export for threat reports
- [ ] Implement webhook handlers for external threat feeds
- [ ] Add data import from MISP/ATT&CK frameworks
- [ ] Create API rate limiting + usage analytics
- [ ] Add email alerts for critical threats
- [ ] Implement team collaboration (multi-user workspaces)
