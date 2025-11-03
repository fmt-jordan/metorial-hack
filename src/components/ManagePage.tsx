import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Phone, Clock, DollarSign, BarChart3, ChevronDown, ChevronUp, RefreshCw, Award, Target } from 'lucide-react';
import { analyzeCallTranscript, calculateAgentMetrics, determinePerformanceTier, aggregateKeyInsights, AgentAnalytics } from '../services/analyticsService';
import ComparativeAnalyticsModal from './ComparativeAnalyticsModal';

interface AgentPerformance {
  id: string;
  assistant_name: string;
  assistant_id: string;
  profile_image_url: string | null;
  total_calls: number;
  completed_calls: number;
  avg_duration: number;
  total_cost: number;
  last_call_at: string | null;
  analytics?: AgentAnalytics;
}

export default function ManagePage() {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [sortBy, setSortBy] = useState<'total_calls' | 'completed_calls' | 'avg_duration' | 'total_cost'>('total_calls');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [analyzedCallIds, setAnalyzedCallIds] = useState<Set<string>>(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAgentPerformance();
  }, []);

  const fetchAgentPerformance = async () => {
    try {
      setIsLoading(true);

      const { data: assistants, error: assistantsError } = await supabase
        .from('assistants')
        .select('*')
        .eq('is_active', true);

      console.log('Fetched assistants:', assistants);

      if (assistantsError || !assistants) {
        console.error('Error fetching assistants:', assistantsError);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Supabase URL:', supabaseUrl);

      const agentPerformancePromises = assistants.map(async (assistant) => {
        try {
          const apiUrl = `${supabaseUrl}/functions/v1/vapi-calls?assistantId=${assistant.assistant_id}`;
          console.log('Fetching calls from:', apiUrl);

          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('Response status for', assistant.name, ':', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch calls for assistant ${assistant.assistant_id}:`, errorText);
            return {
              id: assistant.id,
              assistant_name: assistant.name,
              assistant_id: assistant.assistant_id,
              profile_image_url: assistant.profile_image_url,
              total_calls: 0,
              completed_calls: 0,
              avg_duration: 0,
              total_cost: 0,
              last_call_at: null,
            };
          }

          const data = await response.json();
          console.log('Calls data for', assistant.name, ':', data);

          const calls = data.results && Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);

          const totalCalls = calls.length;
          const completedCalls = calls.filter((c: any) => c.status === 'ended').length;

          // Calculate duration from startedAt and endedAt timestamps
          const totalDuration = calls.reduce((sum: number, c: any) => {
            if (c.startedAt && c.endedAt) {
              const start = new Date(c.startedAt).getTime();
              const end = new Date(c.endedAt).getTime();
              const durationSeconds = (end - start) / 1000;
              return sum + durationSeconds;
            }
            return sum;
          }, 0);

          const callsWithDuration = calls.filter((c: any) => c.startedAt && c.endedAt).length;
          const avgDuration = callsWithDuration > 0 ? totalDuration / callsWithDuration : 0;

          const totalCost = calls.reduce((sum: number, c: any) => sum + (c.cost || 0), 0);
          const lastCallAt = calls.length > 0 ? calls[0].createdAt : null;

          console.log('Calculated metrics for', assistant.name, ':', {
            totalCalls,
            completedCalls,
            callsWithDuration,
            totalDuration,
            avgDuration,
            totalCost
          });

          return {
            id: assistant.id,
            assistant_name: assistant.name,
            assistant_id: assistant.assistant_id,
            profile_image_url: assistant.profile_image_url,
            total_calls: totalCalls,
            completed_calls: completedCalls,
            avg_duration: avgDuration,
            total_cost: totalCost,
            last_call_at: lastCallAt,
          };
        } catch (error) {
          console.error(`Error fetching calls for assistant ${assistant.assistant_id}:`, error);
          return {
            id: assistant.id,
            assistant_name: assistant.name,
            assistant_id: assistant.assistant_id,
            profile_image_url: assistant.profile_image_url,
            total_calls: 0,
            completed_calls: 0,
            avg_duration: 0,
            total_cost: 0,
            last_call_at: null,
          };
        }
      });

      const agentPerformanceData = await Promise.all(agentPerformancePromises);
      console.log('Final agent performance data:', agentPerformanceData);
      setAgents(agentPerformanceData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress('Fetching recent calls...');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const updatedAgents = await Promise.all(
        agents.map(async (agent) => {
          try {
            setAnalysisProgress(`Analyzing ${agent.assistant_name}...`);

            const apiUrl = `${supabaseUrl}/functions/v1/vapi-calls?assistantId=${agent.assistant_id}`;
            const response = await fetch(apiUrl, {
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              return agent;
            }

            const data = await response.json();
            const calls = data.results && Array.isArray(data.results) ? data.results : [];

            const recentCalls = calls
              .filter((c: any) => c.transcript && !analyzedCallIds.has(c.id))
              .slice(0, 5);

            if (recentCalls.length === 0) {
              return agent;
            }

            const analyses = await Promise.all(
              recentCalls.map(async (call: any) => {
                const analysis = await analyzeCallTranscript(call.transcript, openaiApiKey);

                const duration = call.startedAt && call.endedAt
                  ? (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
                  : 0;

                return { ...analysis, callDuration: duration };
              })
            );

            setAnalyzedCallIds(prev => {
              const newSet = new Set(prev);
              recentCalls.forEach((c: any) => newSet.add(c.id));
              return newSet;
            });

            const metrics = calculateAgentMetrics(analyses);
            const avgQuoteSize = agents
              .filter(a => a.analytics)
              .reduce((sum, a) => sum + (a.analytics?.metrics.avgQuoteSize || 0), 0) / Math.max(agents.filter(a => a.analytics).length, 1);

            const performanceTier = determinePerformanceTier(metrics, avgQuoteSize || 500);
            const keyInsights = aggregateKeyInsights(analyses);

            return {
              ...agent,
              analytics: {
                callsReviewed: recentCalls.length,
                isBestPerformer: false,
                metrics,
                performanceTier,
                keyInsights,
              },
            };
          } catch (error) {
            console.error(`Error analyzing agent ${agent.assistant_name}:`, error);
            return agent;
          }
        })
      );

      const bestPerformerIndex = updatedAgents.reduce(
        (bestIdx, agent, idx) =>
          agent.analytics && (!updatedAgents[bestIdx].analytics ||
          agent.analytics.metrics.closeRate > (updatedAgents[bestIdx].analytics?.metrics.closeRate || 0))
            ? idx
            : bestIdx,
        0
      );

      updatedAgents[bestPerformerIndex] = {
        ...updatedAgents[bestPerformerIndex],
        analytics: updatedAgents[bestPerformerIndex].analytics
          ? { ...updatedAgents[bestPerformerIndex].analytics!, isBestPerformer: true }
          : undefined,
      };

      setAgents(updatedAgents);
      setAnalysisProgress('Analysis complete!');
      setTimeout(() => setAnalysisProgress(''), 2000);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      setAnalysisProgress('Analysis failed');
      setTimeout(() => setAnalysisProgress(''), 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const sortedAgents = [...agents].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const direction = sortDirection === 'asc' ? 1 : -1;
    return (aValue > bValue ? 1 : -1) * direction;
  });

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'strong': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'average': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'needs_improvement': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'elite': return 'Elite';
      case 'strong': return 'Strong';
      case 'average': return 'Average';
      case 'needs_improvement': return 'Needs Improvement';
      default: return 'Unknown';
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const openComparisonModal = () => {
    if (selectedAgentIds.size > 0) {
      setIsModalOpen(true);
    }
  };

  const selectedAgents = agents.filter(a => selectedAgentIds.has(a.id));

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const totalStats = {
    total_calls: agents.reduce((sum, a) => sum + a.total_calls, 0),
    completed_calls: agents.reduce((sum, a) => sum + a.completed_calls, 0),
    avg_duration: agents.length > 0 ? agents.reduce((sum, a) => sum + a.avg_duration, 0) / agents.length : 0,
    total_cost: agents.reduce((sum, a) => sum + a.total_cost, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading agent performance...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col">
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Agent Performance</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">Compare metrics across all active agents</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAnalytics}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? analysisProgress : 'Refresh Analytics'}
            </button>
            <button
              onClick={openComparisonModal}
              disabled={selectedAgentIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              Compare Selected ({selectedAgentIds.size})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-6 bg-slate-900/30">
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Phone className="w-3.5 h-3.5" />
            <span>Total Calls</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalStats.total_calls}</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Completed</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{totalStats.completed_calls}</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Avg Duration</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{formatDuration(totalStats.avg_duration)}</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Total Cost</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{formatCost(totalStats.total_cost)}</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 sticky top-0 z-10">
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectedAgentIds.size === agents.length && agents.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAgentIds(new Set(agents.map(a => a.id)));
                    } else {
                      setSelectedAgentIds(new Set());
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Agent
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('total_calls')}
              >
                <div className="flex items-center gap-1">
                  Total Calls
                  <SortIcon field="total_calls" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('completed_calls')}
              >
                <div className="flex items-center gap-1">
                  Completed
                  <SortIcon field="completed_calls" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('avg_duration')}
              >
                <div className="flex items-center gap-1">
                  Avg Duration
                  <SortIcon field="avg_duration" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('total_cost')}
              >
                <div className="flex items-center gap-1">
                  Total Cost
                  <SortIcon field="total_cost" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Last Call
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Performance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedAgents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  No agents found
                </td>
              </tr>
            ) : (
              sortedAgents.map((agent) => (
                <tr
                  key={agent.id}
                  className={`hover:bg-slate-900/30 transition-colors cursor-pointer ${selectedAgentIds.has(agent.id) ? 'bg-purple-900/20' : ''}`}
                  onClick={() => toggleAgentSelection(agent.id)}
                >
                  <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedAgentIds.has(agent.id)}
                      onChange={() => toggleAgentSelection(agent.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                        {agent.profile_image_url ? (
                          <img
                            src={agent.profile_image_url}
                            alt={agent.assistant_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-400 text-sm font-medium">
                            {agent.assistant_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {agent.analytics?.isBestPerformer && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                            <Award className="w-3 h-3 text-slate-950" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{agent.assistant_name}</span>
                          {agent.analytics?.isBestPerformer && (
                            <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                              Best Performer
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{agent.assistant_id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-white">{agent.total_calls}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-white">{agent.completed_calls}</span>
                      {agent.total_calls > 0 && (
                        <span className="text-xs text-slate-500">
                          ({Math.round((agent.completed_calls / agent.total_calls) * 100)}%)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-white">{formatDuration(agent.avg_duration)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-white">{formatCost(agent.total_cost)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-400">{formatDate(agent.last_call_at)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {agent.analytics ? (
                      <div className="space-y-2">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getTierColor(agent.analytics.performanceTier)}`}>
                          <Target className="w-3 h-3" />
                          {getTierLabel(agent.analytics.performanceTier)}
                        </div>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Close Rate:</span>
                            <span className="text-white font-medium">{agent.analytics.metrics.closeRate.toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Avg Quote:</span>
                            <span className="text-white font-medium">${agent.analytics.metrics.avgQuoteSize.toFixed(0)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Efficiency:</span>
                            <span className="text-white font-medium">{agent.analytics.metrics.conversionEfficiency.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No analytics yet</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ComparativeAnalyticsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedAgents={selectedAgents}
      />
    </div>
  );
}
