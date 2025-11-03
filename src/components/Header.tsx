import { LogOut, User, Bot, Plus, LayoutDashboard, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { useAgent } from '../contexts/AgentContext';
import AddAgentModal from './AddAgentModal';

interface HeaderProps {
  onLogout: () => void;
  currentPage?: 'dashboard' | 'manage';
  onNavigate?: (page: 'dashboard' | 'manage') => void;
}

export default function Header({ onLogout, currentPage = 'dashboard', onNavigate }: HeaderProps) {
  const { assistants, selectedAssistant, setSelectedAssistant, isLoading } = useAgent();
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);

  const handleSelectChange = (value: string) => {
    if (value === 'add-new') {
      setIsAddAgentModalOpen(true);
    } else {
      const assistant = assistants.find(a => a.id === value);
      setSelectedAssistant(assistant || null);
    }
  };

  return (
    <>
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/banner_logo.png"
                alt="Logo"
                className="h-8 w-auto"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {onNavigate && (
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('manage')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    currentPage === 'manage'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    currentPage === 'dashboard'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Agent</span>
                </button>
              </nav>
            )}

            <div className="relative">
              <select
                value={selectedAssistant?.id || ''}
                onChange={(e) => handleSelectChange(e.target.value)}
                disabled={isLoading}
                className="appearance-none flex items-center gap-2 pl-9 pr-8 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assistants.length === 0 && (
                  <option value="">No agents available</option>
                )}
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </option>
                ))}
                <option value="add-new" className="border-t border-slate-600 mt-1 pt-1">
                  ➕ Add New Agent
                </option>
              </select>
              <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 text-xs">michael@salesly.ai</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-xs"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>

    <AddAgentModal
      isOpen={isAddAgentModalOpen}
      onClose={() => setIsAddAgentModalOpen(false)}
    />
    </>
  );
}
