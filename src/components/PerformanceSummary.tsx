import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, Target, Award, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';

interface PerformanceMetrics {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  avgQuoteValue: number;
  totalQuotes: number;
  todayQuotes: number;
  bestQuote: number;
  quotesWon: number;
  quotesLost: number;
  quotesPending: number;
  winRate: number;
}

export default function PerformanceSummary() {
  const { selectedAssistant } = useAgent();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    avgQuoteValue: 0,
    totalQuotes: 0,
    todayQuotes: 0,
    bestQuote: 0,
    quotesWon: 0,
    quotesLost: 0,
    quotesPending: 0,
    winRate: 0,
  });

  const fetchMetrics = async () => {
    let eventsQuery = supabase
      .from('webhook_events')
      .select('id, created_at, assistant_id, quote_status');

    if (selectedAssistant) {
      eventsQuery = eventsQuery.eq('assistant_id', selectedAssistant.assistant_id);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return;
    }

    const { data: lineItems, error: itemsError } = await supabase
      .from('quote_line_items')
      .select('webhook_event_id, item_price, qty, created_at');

    if (itemsError) {
      console.error('Error fetching line items:', itemsError);
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const quoteValues = new Map<string, number>();
    const quoteStatuses = new Map<string, string>();
    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let bestQuote = 0;

    events?.forEach((event) => {
      if (event.quote_status) {
        quoteStatuses.set(event.id, event.quote_status);
      }
    });

    lineItems.forEach((item) => {
      const itemTotal = Number(item.item_price) * item.qty;
      const status = quoteStatuses.get(item.webhook_event_id);

      if (status === 'won') {
        totalRevenue += itemTotal;
      }

      const current = quoteValues.get(item.webhook_event_id) || 0;
      quoteValues.set(item.webhook_event_id, current + itemTotal);

      const itemDate = new Date(item.created_at);
      if (itemDate >= todayStart && status === 'won') {
        todayRevenue += itemTotal;
      }
      if (itemDate >= monthStart && status === 'won') {
        monthRevenue += itemTotal;
      }
    });

    quoteValues.forEach((value) => {
      if (value > bestQuote) {
        bestQuote = value;
      }
    });

    const eventsWithQuotes = events?.filter((e) => quoteValues.has(e.id)) || [];
    const todayQuotes = eventsWithQuotes.filter((e) => new Date(e.created_at) >= todayStart).length;
    const totalQuotes = eventsWithQuotes.length;

    let sumOfAllQuoteValues = 0;
    quoteValues.forEach((value) => {
      sumOfAllQuoteValues += value;
    });
    const avgQuoteValue = totalQuotes > 0 ? sumOfAllQuoteValues / totalQuotes : 0;

    const quotesWon = eventsWithQuotes.filter((e) => e.quote_status === 'won').length;
    const quotesLost = eventsWithQuotes.filter((e) => e.quote_status === 'lost').length;
    const quotesPending = eventsWithQuotes.filter((e) => e.quote_status === 'pending' || !e.quote_status).length;
    const closedQuotes = quotesWon + quotesLost;
    const winRate = closedQuotes > 0 ? (quotesWon / closedQuotes) * 100 : 0;

    setMetrics({
      totalRevenue,
      todayRevenue,
      monthRevenue,
      avgQuoteValue,
      totalQuotes,
      todayQuotes,
      bestQuote,
      quotesWon,
      quotesLost,
      quotesPending,
      winRate,
    });
  };

  useEffect(() => {
    fetchMetrics();

    const channel = supabase
      .channel('performance-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_events',
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAssistant]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        <span className="text-slate-300 text-sm font-medium">Performance Summary</span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400">Total Revenue</span>
            </div>
            <div className="text-xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{metrics.quotesWon} won</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-slate-400">Win Rate</span>
            </div>
            <div className="text-xl font-bold text-white">{metrics.winRate.toFixed(1)}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{metrics.quotesWon}W / {metrics.quotesLost}L</div>
          </div>

          <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-slate-400">This Month</span>
            </div>
            <div className="text-xl font-bold text-white">{formatCurrency(metrics.monthRevenue)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">MTD revenue</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">Best Quote</span>
            </div>
            <div className="text-xl font-bold text-white">{formatCurrency(metrics.bestQuote)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Avg: {formatCurrency(metrics.avgQuoteValue)}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/50 border border-emerald-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-slate-400">Won</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">{metrics.quotesWon}</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-red-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-slate-400">Lost</span>
              </div>
              <span className="text-lg font-bold text-red-400">{metrics.quotesLost}</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Pending</span>
              </div>
              <span className="text-lg font-bold text-slate-300">{metrics.quotesPending}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
