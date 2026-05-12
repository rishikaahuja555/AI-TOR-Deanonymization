import { useState, FormEvent } from 'react';
import { Cpu, Eye, EyeOff, Shield, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error);
      else setSuccess('Account created. You can now sign in.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl mb-4 relative">
            <Cpu size={28} className="text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight">AI TOR ANALYZER</h1>
          <p className="text-gray-500 text-sm mt-1 font-mono tracking-wider">CLASSIFIED INTELLIGENCE SYSTEM</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-16 h-px bg-gradient-to-r from-transparent to-cyan-500/40" />
            <Shield size={12} className="text-cyan-500/60" />
            <span className="w-16 h-px bg-gradient-to-l from-transparent to-cyan-500/40" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-8 shadow-2xl">
          <div className="flex rounded-lg bg-gray-800/60 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all font-mono ${
                mode === 'login'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all font-mono ${
                mode === 'register'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 font-mono mb-1.5 tracking-wider">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="analyst@secure.ops"
                  className="w-full bg-gray-800/60 border border-gray-700/80 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 font-mono mb-1.5 tracking-wider">PASSWORD</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-gray-800/60 border border-gray-700/80 rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-xs text-red-400 font-mono">
                ERROR: {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2.5 text-xs text-green-400 font-mono">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 hover:border-cyan-500/60 text-cyan-400 font-mono text-sm font-bold py-3 rounded-lg transition-all duration-200 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800/60">
            <p className="text-center text-xs text-gray-600 font-mono">
              SECURED CONNECTION · TLS 1.3 · END-TO-END ENCRYPTED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
