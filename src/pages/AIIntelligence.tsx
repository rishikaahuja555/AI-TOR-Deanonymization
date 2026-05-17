import { useState, useRef } from 'react';
import { Brain, Zap, AlertTriangle, Globe, Lock, Users, FileText, Copy, Download } from 'lucide-react';
import {
  classifyEntry,
  predictThreatScore,
  analyzeNLPContent,
  extractNamedEntities,
  generateIntelligenceSummary,
} from '../lib/aiAnalysis';
import {
  parseOnionURL,
  clusterWallets,
  profileThreatActor,
  extractIOCs,
  calculateIOCRisk,
} from '../lib/cybersecurityTools';
import ThreatBadge from '../components/ThreatBadge';

type AnalysisTab = 'classification' | 'nlp' | 'entities' | 'onion' | 'wallets' | 'actors' | 'iocs';

export default function AIIntelligence() {
  const [tab, setTab] = useState<AnalysisTab>('classification');
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function runAnalysis() {
    if (!inputText.trim()) return;
    setAnalyzing(true);

    const classification = classifyEntry(inputText);
    const nlpAnalysis = analyzeNLPContent(inputText);
    const entities = extractNamedEntities(inputText);
    const iocs = extractIOCs(inputText);

    // Onion URL parsing
    const onionUrls = Array.from(inputText.matchAll(/([a-z0-9]+\.onion[\/\w\-\.\?\=\&\%\#]*)/gi)).map(m => parseOnionURL(m[0]));

    // Wallet clustering
    const wallets = Array.from(inputText.matchAll(/\b(?:1|3|bc1)[A-HJ-NP-Za-km-z1-9]{25,39}\b|\b0x[a-fA-F0-9]{40}\b/gi)).map(m => m[0]);
    const clusters = clusterWallets(wallets);

    // Threat actor profiling
    const actorMatches = Array.from(inputText.matchAll(/(?:group|actor|operator)[\s:]+([A-Za-z0-9_\-\s]{3,30})/gi));
    const profiles = actorMatches.map(m => profileThreatActor(m[1], [], []));

    setResults({
      classification,
      nlpAnalysis,
      entities,
      onionUrls,
      clusters,
      profiles,
      iocs: iocs.map(i => ({ ...i, risk: calculateIOCRisk(i) })),
      summary: generateIntelligenceSummary(classification, iocs),
    });

    setAnalyzing(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white font-mono">AI INTELLIGENCE ENGINE</h2>
        <p className="text-xs text-gray-500 font-mono mt-0.5">ADVANCED THREAT ANALYSIS WITH NLP & ML</p>
      </div>

      {/* Input */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5">
        <label className="block text-xs text-gray-400 font-mono mb-2 tracking-wider">ANALYZE TEXT INPUT</label>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste darknet text, threat reports, or intelligence data..."
          className="w-full h-32 bg-gray-800/60 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 resize-none"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={runAnalysis}
            disabled={analyzing || !inputText.trim()}
            className="flex-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-50"
          >
            <Brain size={12} className="inline mr-1" />
            {analyzing ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
          </button>
          <button
            onClick={() => setInputText('')}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 px-4 py-2 rounded-lg text-xs font-mono transition-all"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* AI Summary */}
          <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Brain size={16} className="text-cyan-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-cyan-400 font-mono font-bold">INTELLIGENCE SUMMARY</p>
                <p className="text-sm text-gray-300 mt-2 font-mono">{results.summary}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800/60 rounded-xl p-1 overflow-x-auto">
            {(
              [
                ['classification', 'Classification', AlertTriangle],
                ['nlp', 'NLP Analysis', Brain],
                ['entities', 'Named Entities', Users],
                ['onion', 'Onion URLs', Globe],
                ['wallets', 'Wallets', Lock],
                ['actors', 'Threat Actors', Users],
                ['iocs', 'IOCs', FileText],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
                  tab === id ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={10} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5 space-y-4">
            {tab === 'classification' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${results.classification.classification === 'critical' ? 'bg-red-500/10 border-red-500/30' : results.classification.classification === 'suspicious' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                    <p className="text-[10px] text-gray-500 font-mono tracking-wider">CLASSIFICATION</p>
                    <p className={`text-2xl font-bold font-mono mt-1 ${results.classification.classification === 'critical' ? 'text-red-400' : results.classification.classification === 'suspicious' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {results.classification.classification.toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/40">
                    <p className="text-[10px] text-gray-500 font-mono tracking-wider">CONFIDENCE</p>
                    <p className="text-2xl font-bold font-mono mt-1 text-cyan-400">{(results.classification.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/40">
                    <p className="text-[10px] text-gray-500 font-mono tracking-wider">THREAT SCORE</p>
                    <p className="text-2xl font-bold font-mono mt-1 text-orange-400">{results.classification.predictedThreatScore}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-2">ANALYSIS REASONS:</p>
                  <div className="space-y-2">
                    {results.classification.reasons.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-mono text-gray-300 bg-gray-800/40 p-2 rounded border border-gray-700/40">
                        <span className="text-cyan-400 flex-shrink-0">→</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {results.classification.nlpKeywords.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-2">DETECTED KEYWORDS:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.classification.nlpKeywords.map((k: string, i: number) => (
                        <span key={i} className="text-[10px] font-mono bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-2 py-1 rounded">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'nlp' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-800/40 border border-gray-700/40">
                    <p className="text-[10px] text-gray-500 font-mono tracking-wider">SENTIMENT</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${results.nlpAnalysis.sentiment === 'malicious' ? 'text-red-400' : results.nlpAnalysis.sentiment === 'neutral' ? 'text-gray-400' : 'text-green-400'}`}>
                      {results.nlpAnalysis.sentiment.toUpperCase()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/40 border border-gray-700/40">
                    <p className="text-[10px] text-gray-500 font-mono tracking-wider">SEVERITY</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${results.nlpAnalysis.estimatedSeverity === 'critical' ? 'text-red-400' : results.nlpAnalysis.estimatedSeverity === 'high' ? 'text-orange-400' : results.nlpAnalysis.estimatedSeverity === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {results.nlpAnalysis.estimatedSeverity.toUpperCase()}
                    </p>
                  </div>
                </div>
                {results.nlpAnalysis.topicsTags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-2">THREAT TOPICS:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.nlpAnalysis.topicsTags.map((t: string, i: number) => (
                        <span key={i} className="text-[10px] font-mono bg-purple-500/20 border border-purple-500/30 text-purple-400 px-2 py-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {results.nlpAnalysis.keyIndicators.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-2">KEY INDICATORS:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.nlpAnalysis.keyIndicators.map((ki: string, i: number) => (
                        <span key={i} className="text-[10px] font-mono bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-1 rounded">
                          {ki}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'entities' && (
              <div className="space-y-4">
                {Object.entries(results.entities)
                  .filter(([_, v]: any) => Array.isArray(v) && v.length > 0)
                  .map(([type, values]: any) => (
                    <div key={type}>
                      <p className="text-xs text-gray-400 font-mono mb-2 tracking-wider">{type.toUpperCase()}</p>
                      <div className="space-y-1">
                        {values.map((v: string, i: number) => (
                          <div key={i} className="text-xs font-mono text-gray-300 bg-gray-800/40 p-2 rounded border border-gray-700/40 flex items-center justify-between">
                            <span>{v}</span>
                            <button className="text-gray-600 hover:text-cyan-400 transition-colors" title="Copy">
                              <Copy size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {tab === 'onion' && (
              <div className="space-y-3">
                {results.onionUrls.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No onion URLs detected</p>
                ) : (
                  results.onionUrls.map((url: any, i: number) => (
                    <div key={i} className="bg-gray-800/40 p-3 rounded border border-red-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono text-gray-200 truncate">{url.domain}</p>
                        <span className="text-[10px] font-mono text-red-400">ONION {url.isV3 ? 'V3' : 'V2'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="text-gray-400">Port: <span className="text-gray-300">{url.port || 'default'}</span></div>
                        <div className="text-gray-400">Path: <span className="text-gray-300">{url.path || '/'}</span></div>
                      </div>
                      {url.threatIndicators.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {url.threatIndicators.map((ti: string, j: number) => (
                            <span key={j} className="text-[9px] font-mono bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                              {ti}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'wallets' && (
              <div className="space-y-3">
                {results.clusters.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No cryptocurrency wallets detected</p>
                ) : (
                  results.clusters.map((cluster: any, i: number) => (
                    <div key={i} className="bg-gray-800/40 p-3 rounded border border-yellow-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono text-gray-200">{cluster.type.toUpperCase()} CLUSTER</p>
                        <ThreatBadge score={Math.round(cluster.suspicionScore * 100)} />
                      </div>
                      <div className="space-y-1">
                        {cluster.wallets.map((w: string, j: number) => (
                          <div key={j} className="text-[10px] font-mono text-gray-400 truncate bg-gray-900/60 p-1.5 rounded border border-gray-700/40 flex items-center gap-2">
                            <span className="flex-1 truncate">{w}</span>
                            <button className="text-gray-600 hover:text-cyan-400 flex-shrink-0">
                              <Copy size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'actors' && (
              <div className="space-y-3">
                {results.profiles.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No threat actors detected</p>
                ) : (
                  results.profiles.map((profile: any, i: number) => (
                    <div key={i} className="bg-gray-800/40 p-3 rounded border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono text-gray-200 font-bold">{profile.name}</p>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          profile.threatLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                          profile.threatLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          profile.threatLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {profile.threatLevel.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mb-2">{profile.operationalPattern}</p>
                      {profile.aliases.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.aliases.map((a: string, j: number) => (
                            <span key={j} className="text-[9px] font-mono bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                              aka {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'iocs' && (
              <div className="space-y-2">
                {results.iocs.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No IOCs detected</p>
                ) : (
                  results.iocs.map((ioc: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-800/40 rounded border border-gray-700/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-gray-300 truncate">{ioc.value}</p>
                        <p className="text-[9px] font-mono text-gray-600">{ioc.type} • {ioc.context}</p>
                      </div>
                      <ThreatBadge score={ioc.risk} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Export Results */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-xs font-mono transition-all">
              <Download size={12} />
              EXPORT REPORT
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-xs font-mono transition-all">
              <Copy size={12} />
              COPY TO CLIPBOARD
            </button>
          </div>
        </>
      )}
    </div>
  );
}
