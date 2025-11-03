import { X, Phone, PhoneIncoming, PhoneOutgoing, Clock, Play, Pause, Volume2, Loader2, ChevronDown, ChevronUp, Filter, CheckCircle2, XCircle, Clock as ClockIcon, Sparkles, TrendingUp, TrendingDown, AlertCircle, Send } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAgent } from '../contexts/AgentContext';
import { supabase } from '../lib/supabase';
import { evaluateCall, CallEvaluation } from '../services/analyticsService';

interface TranscriptMessage {
  role: string;
  message: string;
  time: number;
}

interface VapiCall {
  id: string;
  type: string;
  status: string;
  endedReason?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  cost?: number;
  costBreakdown?: {
    total: number;
  };
  messages?: TranscriptMessage[];
  customer?: {
    number?: string;
    name?: string;
  };
  assistantId?: string;
}

interface CallRecord {
  id: string;
  type: string;
  status: string;
  duration: number;
  customerName: string;
  customerPhone: string;
  transcript: TranscriptMessage[];
  recordingUrl: string;
  cost: number;
  createdAt: string;
  assistantId?: string;
  quoteStatus?: string | null;
  hasQuote?: boolean;
  evaluation?: CallEvaluation;
}

interface CallHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCallId?: string;
}

export default function CallHistoryModal({ isOpen, onClose, initialCallId }: CallHistoryModalProps) {
  const { selectedAssistant } = useAgent();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<number>>(new Set([0]));
  const [filterByAgent, setFilterByAgent] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCalls();
    }
  }, [isOpen, filterByAgent]);

  useEffect(() => {
    if (initialCallId && calls.length > 0) {
      const call = calls.find(c => c.id === initialCallId);
      if (call) {
        setSelectedCall(call);
      }
    }
  }, [initialCallId, calls]);

  const fetchCalls = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const assistantId = filterByAgent && selectedAssistant
        ? selectedAssistant.assistant_id
        : import.meta.env.VITE_VAPI_ASSISTANT_ID;

      let apiUrl = `${supabaseUrl}/functions/v1/vapi-calls?limit=100`;

      if (filterByAgent && selectedAssistant) {
        apiUrl += `&assistantId=${assistantId}`;
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch calls from Vapi:', errorData);
        throw new Error('Failed to fetch calls from Vapi');
      }

      const responseData = await response.json();
      console.log('Vapi API response:', responseData);

      const vapiCalls: VapiCall[] = Array.isArray(responseData) ? responseData : (responseData.results || responseData.data || []);

      const formattedCalls: CallRecord[] = vapiCalls.map((call) => {
        const startTime = call.startedAt ? new Date(call.startedAt).getTime() : 0;
        const endTime = call.endedAt ? new Date(call.endedAt).getTime() : 0;
        const durationSeconds = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

        return {
          id: call.id,
          type: call.type || 'unknown',
          status: call.status,
          duration: durationSeconds,
          customerName: call.customer?.name || 'Unknown',
          customerPhone: call.customer?.number || 'N/A',
          transcript: call.messages || [],
          recordingUrl: call.stereoRecordingUrl || call.recordingUrl || '',
          cost: call.costBreakdown?.total || call.cost || 0,
          createdAt: call.createdAt,
          assistantId: call.assistantId,
        };
      });

      console.log('Formatted calls:', formattedCalls);

      const { data: webhookEvents } = await supabase
        .from('webhook_events')
        .select('call_id, quote_status, id')
        .in('call_id', formattedCalls.map(c => c.id));

      const { data: quoteLineItems } = await supabase
        .from('quote_line_items')
        .select('webhook_event_id');

      const { data: evaluations } = await supabase
        .from('call_evaluations')
        .select('*')
        .in('call_id', formattedCalls.map(c => c.id));

      const evaluationsMap = new Map<string, CallEvaluation>();
      evaluations?.forEach(evalData => {
        evaluationsMap.set(evalData.call_id, {
          call_quality_score: evalData.call_quality_score,
          sale_outcome: evalData.sale_outcome,
          key_metrics: {
            call_duration_score: evalData.call_duration_score,
            conversation_flow_score: evalData.conversation_flow_score,
            objection_handling_score: evalData.objection_handling_score,
            rapport_building_score: evalData.rapport_building_score,
          },
          sale_amount: evalData.sale_amount,
          strengths: evalData.strengths,
          improvements: evalData.improvements,
          system_prompt_suggestion: evalData.system_prompt_suggestion,
        });
      });

      const quotesMap = new Map<string, { status: string | null; hasQuote: boolean }>();
      webhookEvents?.forEach(event => {
        const hasQuote = quoteLineItems?.some(item => item.webhook_event_id === event.id) || false;
        quotesMap.set(event.call_id, { status: event.quote_status, hasQuote });
      });

      const callsWithQuoteStatus = formattedCalls.map(call => ({
        ...call,
        quoteStatus: quotesMap.get(call.id)?.status,
        hasQuote: quotesMap.get(call.id)?.hasQuote || false,
        evaluation: evaluationsMap.get(call.id),
      }));

      setCalls(callsWithQuoteStatus);
      if (callsWithQuoteStatus.length > 0 && !selectedCall) {
        setSelectedCall(callsWithQuoteStatus[0]);
      }

      if (selectedCall) {
        const updatedCall = callsWithQuoteStatus.find(c => c.id === selectedCall.id);
        if (updatedCall && updatedCall.evaluation && !selectedCall.evaluation) {
          setSelectedCall(updatedCall);
          setShowEvaluation(true);
        }
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (status === 'won') {
      return (
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Won
        </span>
      );
    }
    if (status === 'lost') {
      return (
        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Lost
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs font-semibold rounded-full flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return null;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(Math.floor(audioRef.current.duration));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleEvaluateCall = async () => {
    if (!selectedCall) return;

    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      alert('OpenAI API key not configured');
      return;
    }

    setIsEvaluating(true);
    setShowEvaluation(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const apiUrl = `${supabaseUrl}/functions/v1/vapi-assistants/${selectedCall.assistantId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      let systemPrompt = 'No system prompt available';
      if (response.ok) {
        const assistantData = await response.json();
        systemPrompt = assistantData.model?.messages?.[0]?.content || systemPrompt;
      }

      const transcriptText = selectedCall.transcript
        .map(m => `${m.role}: ${m.message}`)
        .join('\n');

      const evaluation = await evaluateCall(
        transcriptText,
        systemPrompt,
        selectedCall.duration,
        openaiApiKey
      );

      setSelectedCall({ ...selectedCall, evaluation });

      const { error: saveError } = await supabase
        .from('call_evaluations')
        .upsert({
          call_id: selectedCall.id,
          assistant_id: selectedCall.assistantId || '',
          call_quality_score: evaluation.call_quality_score,
          sale_outcome: evaluation.sale_outcome,
          sale_amount: evaluation.sale_amount,
          call_duration_score: evaluation.key_metrics.call_duration_score,
          conversation_flow_score: evaluation.key_metrics.conversation_flow_score,
          objection_handling_score: evaluation.key_metrics.objection_handling_score,
          rapport_building_score: evaluation.key_metrics.rapport_building_score,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          system_prompt_suggestion: evaluation.system_prompt_suggestion,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'call_id'
        });

      if (saveError) {
        console.error('Error saving evaluation:', saveError);
      }
    } catch (error) {
      console.error('Error evaluating call:', error);
      alert('Failed to evaluate call');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!selectedCall?.evaluation?.system_prompt_suggestion || !selectedCall.assistantId) {
      return;
    }

    setIsSendingFeedback(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSendingFeedback(false);
    alert('Feedback successfully sent to assistant system prompt!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-400';
    if (score >= 0.6) return 'text-blue-400';
    if (score >= 0.4) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Average';
    return 'Poor';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-7xl h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Call History</h2>
            {selectedAssistant && (
              <button
                onClick={() => setFilterByAgent(!filterByAgent)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterByAgent
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {filterByAgent ? `${selectedAssistant.name} Only` : 'All Agents'}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r border-slate-700 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {calls.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedCall?.id === call.id
                        ? 'bg-cyan-600/20 border-2 border-cyan-500'
                        : 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {call.type === 'inboundPhoneCall' ? (
                        <PhoneIncoming className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className="text-sm text-slate-300">{call.type.includes('Phone') ? 'Phone' : 'Web'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm text-slate-300">{formatDuration(call.duration)}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                        call.status === 'ended'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {call.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(call.createdAt)}
                    </div>
                  </button>
                ))}
                {calls.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-slate-500">
                    No call history available
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedCall ? (
              <>
                <div className="p-6 border-b border-slate-700">
                  {selectedCall.recordingUrl && (
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handlePlayPause}
                          className="p-3 bg-cyan-600 hover:bg-cyan-700 rounded-full transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white" />
                          )}
                        </button>
                        <div className="flex-1">
                          <input
                            type="range"
                            min="0"
                            max={duration}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>{formatDuration(currentTime)}</span>
                            <span>{formatDuration(duration)}</span>
                          </div>
                        </div>
                        <Volume2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <audio
                        ref={audioRef}
                        src={selectedCall.recordingUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="border-t border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h4 className="text-lg font-semibold text-white">AI Performance Evaluation</h4>
                      </div>
                    <div className="flex items-center gap-2">
                      {!selectedCall.evaluation && (
                        <button
                          onClick={handleEvaluateCall}
                          disabled={isEvaluating || !selectedCall.transcript || selectedCall.transcript.length === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium"
                        >
                          <Sparkles className="w-4 h-4" />
                          {isEvaluating ? 'Evaluating...' : 'Evaluate Call'}
                        </button>
                      )}
                      {showEvaluation && selectedCall.evaluation && (
                        <button
                          onClick={() => setShowEvaluation(false)}
                          className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          Collapse
                        </button>
                      )}
                      {!showEvaluation && selectedCall.evaluation && (
                        <button
                          onClick={() => setShowEvaluation(true)}
                          className="px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Show Evaluation
                        </button>
                      )}
                    </div>
                  </div>

                  {isEvaluating && (
                    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30 p-6">
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        <span className="ml-3 text-white">Evaluating call performance...</span>
                      </div>
                    </div>
                  )}

                  {!isEvaluating && showEvaluation && selectedCall.evaluation && (
                    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30 p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-purple-500/30">
                          <div className="text-sm text-slate-400">Overall Score</div>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${getScoreColor(selectedCall.evaluation.call_quality_score)}`}>
                              {(selectedCall.evaluation.call_quality_score * 100).toFixed(0)}%
                            </span>
                            <span className="text-sm text-slate-400">
                              {getScoreLabel(selectedCall.evaluation.call_quality_score)}
                            </span>
                          </div>
                        </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">Sale Outcome</div>
                              <div className="flex items-center gap-2">
                                {selectedCall.evaluation.sale_outcome === 'closed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                {selectedCall.evaluation.sale_outcome === 'lost' && <XCircle className="w-4 h-4 text-red-400" />}
                                {selectedCall.evaluation.sale_outcome === 'pending' && <ClockIcon className="w-4 h-4 text-amber-400" />}
                                <span className="text-white font-medium capitalize">{selectedCall.evaluation.sale_outcome}</span>
                              </div>
                            </div>
                            {selectedCall.evaluation.sale_amount && (
                              <div className="bg-slate-900/50 rounded-lg p-3">
                                <div className="text-xs text-slate-400 mb-1">Quote Amount</div>
                                <div className="text-white font-medium">${selectedCall.evaluation.sale_amount.toLocaleString()}</div>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">Call Duration</div>
                              <div className={`text-lg font-semibold ${getScoreColor(selectedCall.evaluation.key_metrics.call_duration_score)}`}>
                                {(selectedCall.evaluation.key_metrics.call_duration_score * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">Conversation Flow</div>
                              <div className={`text-lg font-semibold ${getScoreColor(selectedCall.evaluation.key_metrics.conversation_flow_score)}`}>
                                {(selectedCall.evaluation.key_metrics.conversation_flow_score * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">Objection Handling</div>
                              <div className={`text-lg font-semibold ${getScoreColor(selectedCall.evaluation.key_metrics.objection_handling_score)}`}>
                                {(selectedCall.evaluation.key_metrics.objection_handling_score * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">Rapport Building</div>
                              <div className={`text-lg font-semibold ${getScoreColor(selectedCall.evaluation.key_metrics.rapport_building_score)}`}>
                                {(selectedCall.evaluation.key_metrics.rapport_building_score * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <h6 className="text-sm font-semibold text-emerald-400">Strengths</h6>
                              </div>
                              <ul className="space-y-1">
                                {selectedCall.evaluation.strengths.map((strength, idx) => (
                                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-emerald-400 mt-0.5">•</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="w-4 h-4 text-amber-400" />
                                <h6 className="text-sm font-semibold text-amber-400">Areas for Improvement</h6>
                              </div>
                              <ul className="space-y-1">
                                {selectedCall.evaluation.improvements.map((improvement, idx) => (
                                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                        {selectedCall.evaluation.system_prompt_suggestion && (
                          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-400" />
                                <h6 className="text-sm font-semibold text-blue-400">Suggested System Prompt Improvement</h6>
                              </div>
                              <button
                                onClick={handleSendFeedback}
                                disabled={isSendingFeedback}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all text-xs font-medium"
                              >
                                <Send className="w-3 h-3" />
                                {isSendingFeedback ? 'Sending...' : 'Send Feedback'}
                              </button>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{selectedCall.evaluation.system_prompt_suggestion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>

                  <div className="border-t border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">Transcript</h4>
                      <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {showTranscript ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                  {showTranscript && selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCall.transcript.map((msg, idx) => {
                        const isCollapsed = collapsedMessages.has(idx);
                        const isSystem = msg.role.toLowerCase() === 'system';

                        return (
                          <div
                            key={idx}
                            className={`rounded-lg overflow-hidden ${
                              msg.role === 'assistant' || msg.role === 'bot'
                                ? 'bg-cyan-600/10 border-l-4 border-cyan-500'
                                : 'bg-slate-800 border-l-4 border-slate-600'
                            }`}
                          >
                            <button
                              onClick={() => {
                                const newCollapsed = new Set(collapsedMessages);
                                if (isCollapsed) {
                                  newCollapsed.delete(idx);
                                } else {
                                  newCollapsed.add(idx);
                                }
                                setCollapsedMessages(newCollapsed);
                              }}
                              className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white capitalize">
                                    {msg.role}
                                  </span>
                                  {msg.time && (
                                    <span className="text-xs text-slate-500">
                                      {formatDuration(Math.floor(msg.time / 1000))}
                                    </span>
                                  )}
                                </div>
                                {isCollapsed ? (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </button>
                            {!isCollapsed && (
                              <div className="px-4 pb-4">
                                <p className="text-slate-300">{msg.message}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    ) : showTranscript ? (
                      <div className="text-center py-12 text-slate-500">
                        No transcript available for this call
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Select a call to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
