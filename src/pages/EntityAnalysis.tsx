import { useState, useRef } from 'react';
import { Upload, Cpu, FileText, Search, Trash2, Download, Eye } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { extractEntities, buildRelationships } from '../lib/entityExtractor';
import { logActivity } from '../lib/hooks';
import EntityTypeBadge from '../components/EntityTypeBadge';
import ThreatBadge from '../components/ThreatBadge';
import RelationshipGraph from '../components/RelationshipGraph';
import { SAMPLE_TOR_TEXT } from '../lib/sampleData';
import type { Entity, GraphNode, GraphEdge } from '../lib/types';

type TabId = 'upload' | 'entities' | 'graph';

export default function EntityAnalysis() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('upload');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => setText(e.target?.result as string ?? '');
    reader.readAsText(file);
  }

  function loadSample() {
    setText(SAMPLE_TOR_TEXT);
    setFileName('darkweb_sample_dataset.txt');
  }

  async function runAnalysis() {
    if (!text.trim() || !user) return;
    setExtracting(true);
    setStatus('Uploading dataset...');

    const { data: ds, error: dsErr } = await supabase.from('datasets').insert({
      user_id: user.id,
      name: fileName || 'untitled.txt',
      content: text,
      file_size: text.length,
      status: 'processing',
    }).select().maybeSingle();

    if (dsErr || !ds) {
      setStatus('Error saving dataset.');
      setExtracting(false);
      return;
    }

    setStatus('Extracting entities with AI...');
    const extracted = extractEntities(text);

    const inserts = extracted.map(e => ({
      dataset_id: ds.id,
      user_id: user.id,
      type: e.type,
      value: e.value,
      confidence: e.confidence,
      threat_score: e.threat_score,
      context: e.context,
    }));

    const { data: savedEntities } = await supabase.from('entities').insert(inserts).select();

    if (savedEntities && savedEntities.length > 0) {
      setStatus('Building relationship graph...');
      const relInputs = savedEntities.map((e: Entity) => ({ id: e.id, type: e.type as never, value: e.value }));
      const rels = buildRelationships(relInputs);
      const relInserts = rels.map(r => ({ ...r, user_id: user.id }));
      await supabase.from('relationships').insert(relInserts);

      // Also save high-threat entities to tor_entities for the threat monitor
      const torInserts = savedEntities
        .filter((e: Entity) => e.threat_score >= 40)
        .map((e: Entity) => ({
          user_id: user.id,
          type: e.type === 'url' ? 'onion_url' : e.type === 'wallet' ? 'crypto_wallet' : e.type,
          value: e.value,
          threat_score: e.threat_score,
          confidence: e.confidence,
          context: e.context || '',
          source: 'entity_analysis',
          metadata: { dataset_id: ds.id },
        }));
      if (torInserts.length > 0) {
        await supabase.from('tor_entities').insert(torInserts);
      }

      await supabase.from('datasets').update({ status: 'complete' }).eq('id', ds.id);

      const nodes: GraphNode[] = savedEntities.map((e: Entity) => ({
        id: e.id, type: e.type as never, value: e.value, threat_score: e.threat_score,
      }));
      const edges: GraphEdge[] = rels.map(r => ({
        source: r.source_entity_id, target: r.target_entity_id,
        strength: r.strength, type: r.relationship_type,
      }));

      setEntities(savedEntities);
      setGraphNodes(nodes);
      setGraphEdges(edges);

      await logActivity(user.id, 'Entity analysis complete', `${savedEntities.length} entities extracted from ${fileName || 'dataset'}`);
    }

    setStatus('');
    setExtracting(false);
    setTab('entities');
  }

  const filtered = entities.filter(e => {
    const matchType = filterType === 'all' || e.type === filterType;
    const matchSearch = !search || e.value.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const types = ['all', ...Array.from(new Set(entities.map(e => e.type)))];

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800/60 rounded-xl p-1 w-fit">
        {([['upload', 'Upload & Analyze', Upload], ['entities', 'Entities', Search], ['graph', 'Relationship Graph', Cpu]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              tab === id ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={12} />
            {label}
            {id === 'entities' && entities.length > 0 && (
              <span className="bg-cyan-500/20 text-cyan-400 rounded px-1">{entities.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-200 font-mono mb-4 flex items-center gap-2">
              <Upload size={14} className="text-cyan-400" />
              UPLOAD DATASET
            </h3>
            <div
              className="border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl p-8 text-center cursor-pointer transition-all group"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <FileText size={32} className="mx-auto text-gray-600 group-hover:text-cyan-500/60 mb-3 transition-colors" />
              <p className="text-sm text-gray-400 font-mono">DROP .TXT / .CSV FILE HERE</p>
              <p className="text-xs text-gray-600 font-mono mt-1">or click to browse</p>
              {fileName && <p className="text-xs text-cyan-400 font-mono mt-2">{fileName}</p>}
              <input ref={fileRef} type="file" accept=".txt,.csv,.log" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={loadSample} className="flex-1 text-xs font-mono text-gray-400 hover:text-cyan-400 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg py-2 transition-all">
                LOAD SAMPLE DATA
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-200 font-mono mb-4 flex items-center gap-2">
              <Eye size={14} className="text-cyan-400" />
              TEXT PREVIEW
            </h3>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste TOR/darkweb text here or upload a file..."
              className="w-full h-44 bg-gray-800/60 border border-gray-700/60 rounded-lg p-3 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 resize-none"
            />
            <button
              onClick={runAnalysis}
              disabled={extracting || !text.trim()}
              className="w-full mt-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 hover:border-cyan-500/55 text-cyan-400 font-mono font-bold text-sm py-2.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Cpu size={14} className={extracting ? 'animate-spin' : ''} />
              {extracting ? (status || 'ANALYZING...') : 'RUN AI ANALYSIS'}
            </button>
          </div>
        </div>
      )}

      {/* Entities tab */}
      {tab === 'entities' && (
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search entities..."
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded border transition-all ${
                    filterType === t ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'text-gray-500 border-gray-700 hover:text-gray-300'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Search size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 font-mono text-sm">
                {entities.length === 0 ? 'NO ANALYSIS RUN YET' : 'NO ENTITIES MATCH FILTER'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-800/60">
                    <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">TYPE</th>
                    <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">VALUE</th>
                    <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">THREAT</th>
                    <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">CONFIDENCE</th>
                    <th className="text-left text-gray-500 py-2 pr-4 font-normal tracking-wider">CONTEXT</th>
                    <th className="text-left text-gray-500 py-2 font-normal tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} className="border-b border-gray-800/30 hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 pr-4"><EntityTypeBadge type={e.type as never} /></td>
                      <td className="py-2.5 pr-4 text-gray-200 max-w-48 truncate">{e.value}</td>
                      <td className="py-2.5 pr-4"><ThreatBadge score={e.threat_score} /></td>
                      <td className="py-2.5 pr-4 text-gray-400">{(e.confidence * 100).toFixed(0)}%</td>
                      <td className="py-2.5 pr-4 text-gray-500 max-w-48 truncate">{e.context || '—'}</td>
                      <td className="py-2.5">
                        <button
                          onClick={async () => {
                            await supabase.from('entities').delete().eq('id', e.id);
                            setEntities(prev => prev.filter(x => x.id !== e.id));
                          }}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Graph tab */}
      {tab === 'graph' && (
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-200 font-mono flex items-center gap-2">
              <Cpu size={14} className="text-cyan-400" />
              ENTITY RELATIONSHIP GRAPH
            </h3>
            <div className="flex gap-2 text-[10px] font-mono">
              {[['email','#3b82f6'],['username','#06b6d4'],['wallet','#eab308'],['url','#a855f7'],['ip','#f97316']].map(([t, c]) => (
                <span key={t} className="flex items-center gap-1 text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[420px] bg-gray-950/50 rounded-xl border border-gray-800/40 overflow-hidden">
            <RelationshipGraph nodes={graphNodes} edges={graphEdges} />
          </div>
          {graphNodes.length === 0 && entities.length > 0 && (
            <p className="text-center text-xs text-gray-500 font-mono mt-2">Graph data not available — re-run analysis to generate relationships.</p>
          )}
        </div>
      )}

      {/* Download CSV */}
      {entities.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              const csv = ['Type,Value,ThreatScore,Confidence', ...entities.map(e => `${e.type},${e.value},${e.threat_score},${e.confidence}`)].join('\n');
              const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
              const a = document.createElement('a'); a.href = url; a.download = 'entities.csv'; a.click();
            }}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-xs font-mono transition-all"
          >
            <Download size={12} />
            EXPORT CSV
          </button>
        </div>
      )}
    </div>
  );
}
