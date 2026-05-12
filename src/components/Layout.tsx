import { useState, ReactNode } from 'react';
import {
  Shield, LayoutDashboard, Search, AlertTriangle,
  FileText, Activity, Settings, LogOut, Menu, X,
  ChevronRight, Cpu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Page } from '../App';

interface NavItem {
  id: Page;
  label: string;
  icon: typeof Shield;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'entity-analysis', label: 'Entity Analysis', icon: Search },
  { id: 'threat-intelligence', label: 'Threat Intel', icon: AlertTriangle },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800/60
        flex flex-col transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800/60">
          <div className="relative">
            <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/40 rounded-lg flex items-center justify-center">
              <Cpu size={18} className="text-cyan-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-cyan-400 tracking-widest font-mono">AI TOR</p>
            <p className="text-[10px] text-gray-500 tracking-wider font-mono">ENTITY ANALYZER</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 group relative
                  ${active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r" />
                )}
                <Icon size={16} className={active ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="flex-1 text-left">{label}</span>
                {active && <ChevronRight size={12} className="text-cyan-500/60" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-gray-800/60 pt-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/40 mb-2">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-xs text-cyan-400 font-bold font-mono">
                {user?.email?.[0]?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 truncate font-mono">{user?.email}</p>
              <p className="text-[10px] text-cyan-500/70 font-mono">ANALYST</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-gray-900/60 border-b border-gray-800/60 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden text-gray-400 hover:text-cyan-400 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-200 font-mono tracking-wide">
              {navItems.find(n => n.id === currentPage)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded">
              ONLINE
            </span>
            <span className="text-[10px] font-mono text-gray-500">TOR NODE: ACTIVE</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
