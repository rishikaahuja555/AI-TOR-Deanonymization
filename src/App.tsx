import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EntityAnalysis from './pages/EntityAnalysis';
import ThreatIntelligence from './pages/ThreatIntelligence';
import AIIntelligence from './pages/AIIntelligence';
import Reports from './pages/Reports';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';

export type Page = 'dashboard' | 'entity-analysis' | 'threat-intelligence' | 'ai-intelligence' | 'reports' | 'activity-logs' | 'settings';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  useEffect(() => {
    document.title = 'AI TOR Entity Analyzer';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-cyan-400 font-mono text-sm tracking-widest">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
      {currentPage === 'entity-analysis' && <EntityAnalysis />}
      {currentPage === 'threat-intelligence' && <ThreatIntelligence />}
      {currentPage === 'ai-intelligence' && <AIIntelligence />}
      {currentPage === 'reports' && <Reports />}
      {currentPage === 'activity-logs' && <ActivityLogs />}
      {currentPage === 'settings' && <Settings />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
