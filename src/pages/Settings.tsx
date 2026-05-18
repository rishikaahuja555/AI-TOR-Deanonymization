import { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Database, User, Save, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

type Section = 'profile' | 'security' | 'notifications' | 'data';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<Section>('profile');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const [prefs, setPrefs] = useState({
    autoAnalyze: true,
    emailAlerts: false,
    highThreatAlerts: true,
    saveHistory: true,
    threatThreshold: 70,
    maxEntities: 500,
  });

  function togglePref(key: keyof typeof prefs) {
    setPrefs(p => ({ ...p, [key]: !p[key as keyof typeof prefs] }));
  }

  async function savePrefs() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function updatePassword() {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error ? `Error: ${error.message}` : 'Password updated successfully.');
    setNewPassword('');
  }

  async function clearAllData() {
    if (!user) return;
    await Promise.all([
      supabase.from('entities').delete().eq('user_id', user.id),
      supabase.from('relationships').delete().eq('user_id', user.id),
      supabase.from('datasets').delete().eq('user_id', user.id),
      supabase.from('reports').delete().eq('user_id', user.id),
      supabase.from('activity_logs').delete().eq('user_id', user.id),
      supabase.from('threat_alerts').delete().eq('user_id', user.id),
      supabase.from('tor_entities').delete().eq('user_id', user.id),
      supabase.from('ai_analyses').delete().eq('user_id', user.id),
    ]);
    setShowConfirmDelete(false);
  }

  const sections: { id: Section; label: string; icon: typeof SettingsIcon }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white font-mono">SYSTEM SETTINGS</h2>
        <p className="text-xs text-gray-500 font-mono mt-0.5">CONFIGURE ANALYZER PREFERENCES</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-3 h-fit">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all mb-1 ${
                section === id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-gray-900 border border-gray-800/60 rounded-xl p-6 space-y-6">
          {section === 'profile' && (
            <>
              <h3 className="text-sm font-bold text-gray-200 font-mono flex items-center gap-2">
                <User size={14} className="text-cyan-400" />
                PROFILE INFORMATION
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 font-mono mb-1.5 tracking-wider">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    defaultValue={user?.email ?? ''}
                    readOnly
                    className="w-full bg-gray-800/40 border border-gray-700/60 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-mono mb-1.5 tracking-wider">ANALYST ROLE</label>
                  <input
                    type="text"
                    defaultValue="Security Analyst"
                    className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-300 focus:outline-none focus:border-cyan-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-mono mb-1.5 tracking-wider">USER ID</label>
                  <p className="text-xs font-mono text-gray-500 bg-gray-800/30 border border-gray-700/40 rounded-lg px-3 py-2.5 truncate">{user?.id}</p>
                </div>
                <button onClick={savePrefs} className="flex items-center gap-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all">
                  <Save size={12} />
                  {saved ? 'SAVED!' : 'SAVE CHANGES'}
                </button>
              </div>
            </>
          )}

          {section === 'security' && (
            <>
              <h3 className="text-sm font-bold text-gray-200 font-mono flex items-center gap-2">
                <Shield size={14} className="text-cyan-400" />
                SECURITY SETTINGS
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 font-mono mb-1.5 tracking-wider">NEW PASSWORD</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 pr-10 py-2.5 text-sm font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {passwordMsg && (
                    <p className={`text-xs font-mono mt-1.5 ${passwordMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{passwordMsg}</p>
                  )}
                </div>
                <button onClick={updatePassword} className="flex items-center gap-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all">
                  <Shield size={12} />
                  UPDATE PASSWORD
                </button>
                <div className="border-t border-gray-800/60 pt-4">
                  <h4 className="text-xs text-gray-400 font-mono mb-3 tracking-wider">SESSION</h4>
                  <button onClick={signOut} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 px-4 py-2 rounded-lg text-xs font-mono transition-all">
                    SIGN OUT ALL SESSIONS
                  </button>
                </div>
              </div>
            </>
          )}

          {section === 'notifications' && (
            <>
              <h3 className="text-sm font-bold text-gray-200 font-mono flex items-center gap-2">
                <Bell size={14} className="text-cyan-400" />
                NOTIFICATION PREFERENCES
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'autoAnalyze' as const, label: 'Auto-analyze on upload', desc: 'Automatically run entity extraction when a dataset is uploaded' },
                  { key: 'emailAlerts' as const, label: 'Email alerts', desc: 'Receive email notifications for critical threats' },
                  { key: 'highThreatAlerts' as const, label: 'High threat alerts', desc: 'Show in-app alerts for entities with threat score ≥ 80' },
                  { key: 'saveHistory' as const, label: 'Save analysis history', desc: 'Persist all analysis results in the database' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4 bg-gray-800/30 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-xs font-mono text-gray-200">{label}</p>
                      <p className="text-[10px] font-mono text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => togglePref(key)}
                      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${prefs[key] ? 'bg-cyan-500/40 border border-cyan-500/50' : 'bg-gray-700 border border-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${prefs[key] ? 'right-0.5 bg-cyan-400' : 'left-0.5 bg-gray-500'}`} />
                    </button>
                  </div>
                ))}
                <div className="bg-gray-800/30 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono text-gray-200">Threat Score Threshold</p>
                    <span className="text-xs font-mono text-cyan-400">{prefs.threatThreshold}</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={prefs.threatThreshold}
                    onChange={e => setPrefs(p => ({ ...p, threatThreshold: Number(e.target.value) }))}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <button onClick={savePrefs} className="flex items-center gap-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all">
                  <Save size={12} />
                  {saved ? 'SAVED!' : 'SAVE PREFERENCES'}
                </button>
              </div>
            </>
          )}

          {section === 'data' && (
            <>
              <h3 className="text-sm font-bold text-gray-200 font-mono flex items-center gap-2">
                <Database size={14} className="text-cyan-400" />
                DATA MANAGEMENT
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-800/30 rounded-lg px-4 py-3">
                  <p className="text-xs font-mono text-gray-200 mb-1">Max Entities Per Analysis</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={100} max={2000} step={100} value={prefs.maxEntities}
                      onChange={e => setPrefs(p => ({ ...p, maxEntities: Number(e.target.value) }))}
                      className="flex-1 accent-cyan-500"
                    />
                    <span className="text-xs font-mono text-cyan-400 w-12 text-right">{prefs.maxEntities}</span>
                  </div>
                </div>

                <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-mono font-bold text-red-400">DANGER ZONE</p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">These actions are permanent and cannot be undone.</p>
                    </div>
                  </div>
                  {!showConfirmDelete ? (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all"
                    >
                      <Trash2 size={12} />
                      CLEAR ALL DATA
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-red-300">Are you sure? This will delete all datasets, entities, and reports.</p>
                      <div className="flex gap-2">
                        <button onClick={clearAllData} className="bg-red-500/30 hover:bg-red-500/50 border border-red-500/40 text-red-300 px-4 py-1.5 rounded text-xs font-mono font-bold transition-all">
                          YES, DELETE ALL
                        </button>
                        <button onClick={() => setShowConfirmDelete(false)} className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 px-4 py-1.5 rounded text-xs font-mono transition-all">
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
