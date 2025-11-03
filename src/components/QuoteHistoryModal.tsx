import { useEffect, useState } from 'react';
import { X, Mail, Clock, MapPin, Loader2, Eye, Filter, CheckCircle2, XCircle, Clock as ClockIcon, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WebhookEvent, LineItem, QuoteEmailData } from '../types/webhook';
import { useAgent } from '../contexts/AgentContext';

interface QuoteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewQuote: (quoteData: QuoteEmailData) => void;
  onViewCall?: (callId: string) => void;
}

export default function QuoteHistoryModal({ isOpen, onClose, onViewQuote, onViewCall }: QuoteHistoryModalProps) {
  const { selectedAssistant } = useAgent();
  const [quotes, setQuotes] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterByAgent, setFilterByAgent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchQuotes();
    }
  }, [isOpen, filterByAgent]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filterByAgent && selectedAssistant) {
        query = query.eq('assistant_id', selectedAssistant.assistant_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching quotes:', error);
      } else {
        setQuotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    const { error } = await supabase
      .from('webhook_events')
      .update({ quote_status: newStatus })
      .eq('id', quoteId);

    if (error) {
      console.error('Error updating quote status:', error);
      return;
    }

    setQuotes(quotes.map(q =>
      q.id === quoteId ? { ...q, quote_status: newStatus } : q
    ));
  };

  const handleViewQuote = async (event: WebhookEvent) => {
    const { data: lineItems, error } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('webhook_event_id', event.id);

    if (error) {
      console.error('Error fetching line items:', error);
      return;
    }

    const items = (lineItems as LineItem[]) || [];
    const subtotal = items.reduce((sum, item) => sum + (item.item_price * item.qty), 0);
    const total = subtotal;

    const quoteData: QuoteEmailData = {
      event,
      lineItems: items,
      subtotal,
      total,
    };

    onViewQuote(quoteData);
    onClose();
  };

  const getStatusBadge = (status: string | null) => {
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
    return (
      <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs font-semibold rounded-full flex items-center gap-1">
        <ClockIcon className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-700">
        <div className="bg-[#004AAD] px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-xl font-bold">Quote History</h2>
            {selectedAssistant && (
              <button
                onClick={() => setFilterByAgent(!filterByAgent)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterByAgent
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {filterByAgent ? `${selectedAssistant.name} Only` : 'All Agents'}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#00C2A0] animate-spin" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 text-lg font-semibold mb-2">No Quotes Yet</h3>
              <p className="text-slate-500 text-sm">
                Quote webhooks will appear here once they're received
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-slate-100 font-semibold text-lg mb-1 truncate">
                            {quote.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{quote.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{formatDate(quote.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!quote.viewed && (
                            <span className="px-2 py-1 bg-[#00C2A0] text-white text-xs font-semibold rounded-full flex-shrink-0">
                              NEW
                            </span>
                          )}
                          {getStatusBadge(quote.quote_status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="text-slate-400 truncate">
                          <span className="text-slate-500">Email:</span>{' '}
                          <span className="text-slate-300">{quote.email}</span>
                        </div>
                        <div className="text-slate-400 truncate">
                          <span className="text-slate-500">Phone:</span>{' '}
                          <span className="text-slate-300">{quote.phone}</span>
                        </div>
                      </div>

                      {quote.client_notes && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-slate-400 text-sm line-clamp-2">
                            {quote.client_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewQuote(quote)}
                          className="px-4 py-2 bg-[#004AAD] text-white rounded-lg font-medium hover:bg-[#003380] transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Quote
                        </button>
                        {quote.call_id && onViewCall && (
                          <button
                            onClick={() => onViewCall(quote.call_id!)}
                            className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center gap-2"
                            title="View Call Recording"
                          >
                            <Phone className="w-4 h-4" />
                            View Call
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleStatusChange(quote.id, 'won')}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            quote.quote_status === 'won'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                          title="Mark as Won"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(quote.id, 'lost')}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            quote.quote_status === 'lost'
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                          title="Mark as Lost"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(quote.id, 'pending')}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            quote.quote_status === 'pending' || !quote.quote_status
                              ? 'bg-slate-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                          title="Mark as Pending"
                        >
                          <ClockIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between rounded-b-lg border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Showing {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
