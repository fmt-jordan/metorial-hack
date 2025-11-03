import { X, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AgentAnalytics {
  callsReviewed: number;
  isBestPerformer: boolean;
  metrics: {
    closeRate: number;
    avgCallDuration: number;
    totalQuotes: number;
    avgQuoteSize: number;
    conversionEfficiency: number;
    objectionHandlingScore: number;
  };
  performanceTier: 'elite' | 'strong' | 'average' | 'needs_improvement';
  keyInsights: string[];
}

interface SelectedAgent {
  id: string;
  assistant_name: string;
  analytics?: AgentAnalytics;
}

interface ComparativeAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgents: SelectedAgent[];
}

export default function ComparativeAnalyticsModal({
  isOpen,
  onClose,
  selectedAgents,
}: ComparativeAnalyticsModalProps) {
  if (!isOpen) return null;

  const agentsWithAnalytics = selectedAgents.filter(a => a.analytics);

  const closeRateData = agentsWithAnalytics.map(a => ({
    name: a.assistant_name,
    value: a.analytics!.metrics.closeRate,
  }));

  const quoteData = agentsWithAnalytics.map(a => ({
    name: a.assistant_name,
    value: a.analytics!.metrics.avgQuoteSize,
  }));

  const efficiencyData = agentsWithAnalytics.map(a => ({
    name: a.assistant_name,
    value: a.analytics!.metrics.conversionEfficiency,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-[90vw] max-w-6xl max-h-[85vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Comparative Analytics</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Visual comparison of key performance metrics
              {agentsWithAnalytics.length > 0 && ` (${agentsWithAnalytics.length} ${agentsWithAnalytics.length === 1 ? 'agent' : 'agents'} selected)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {agentsWithAnalytics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Analytics Data</h3>
              <p className="text-sm text-slate-400 max-w-md">
                {selectedAgents.length === 0
                  ? 'Select agents from the list to compare their performance metrics.'
                  : 'Selected agents do not have analytics data. Click "Add Performance Analytics" to generate data.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Close Rates</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={closeRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Close Rate']}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-950 rounded-lg border border-slate-800 p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Average Quote Size</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={quoteData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                      itemStyle={{ color: '#3b82f6' }}
                      formatter={(value: number) => [`$${value.toFixed(0)}`, 'Avg Quote']}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-950 rounded-lg border border-slate-800 p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Conversion Efficiency</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                      itemStyle={{ color: '#f59e0b' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Efficiency']}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {agentsWithAnalytics.length > 0 && (
          <div className="border-t border-slate-800 px-6 py-4 bg-slate-900/50">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Highest Close Rate:</span>
                <span className="ml-2 text-white font-medium">
                  {Math.max(...agentsWithAnalytics.map(a => a.analytics!.metrics.closeRate)).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Highest Avg Quote:</span>
                <span className="ml-2 text-white font-medium">
                  ${Math.max(...agentsWithAnalytics.map(a => a.analytics!.metrics.avgQuoteSize)).toFixed(0)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Highest Efficiency:</span>
                <span className="ml-2 text-white font-medium">
                  {Math.max(...agentsWithAnalytics.map(a => a.analytics!.metrics.conversionEfficiency)).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
