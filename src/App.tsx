import { useEffect, useState, useRef } from 'react';
import WebhookConsole from './components/WebhookConsole';
import AudioVisualizer from './components/AudioVisualizer';
import VapiClient from './components/VapiClient';
import QuoteEmailModal from './components/QuoteEmailModal';
import TestWebhookModal from './components/TestWebhookModal';
import QuoteHistoryModal from './components/QuoteHistoryModal';
import CallHistoryModal from './components/CallHistoryModal';
import PerformanceSummary from './components/PerformanceSummary';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import ManagePage from './components/ManagePage';
import WebhookDetailModal from './components/WebhookDetailModal';
import { supabase } from './lib/supabase';
import { WebhookEvent, LineItem, QuoteEmailData } from './types/webhook';
import { FlaskConical, FolderOpen, History } from 'lucide-react';
import { AgentProvider } from './contexts/AgentContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'manage'>('manage');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState(false);
  const [isWebhookDetailModalOpen, setIsWebhookDetailModalOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<QuoteEmailData | null>(null);
  const [latestEventId, setLatestEventId] = useState<string | null>(null);
  const [initialCallId, setInitialCallId] = useState<string | undefined>(undefined);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [selectedWebhookData, setSelectedWebhookData] = useState<any>(null);
  const addEventCallbackRef = useRef<((type: string, message: string, data?: any) => void) | null>(null);

  const handleVapiEvent = (type: string, message: string, data?: any) => {
    console.log('handleVapiEvent called:', type, message, data);
    if (addEventCallbackRef.current) {
      addEventCallbackRef.current(type, message, data);
    } else {
      console.warn('addEventCallback not initialized yet');
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('webhook-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_events',
        },
        async (payload) => {
          const newEvent = payload.new as WebhookEvent;

          setLatestEventId(newEvent.id);

          const { data: lineItems, error } = await supabase
            .from('quote_line_items')
            .select('*')
            .eq('webhook_event_id', newEvent.id);

          if (error) {
            console.error('Error fetching line items:', error);
            return;
          }

          const items = (lineItems as LineItem[]) || [];
          const subtotal = items.reduce((sum, item) => sum + (item.item_price * item.qty), 0);
          const total = subtotal;

          const quoteData: QuoteEmailData = {
            event: newEvent,
            lineItems: items,
            subtotal,
            total,
          };

          setCurrentQuote(quoteData);
          setIsModalOpen(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCloseModal = async () => {
    setIsModalOpen(false);

    if (latestEventId) {
      await supabase
        .from('webhook_events')
        .update({ viewed: true })
        .eq('id', latestEventId);
    }
  };

  const handleViewQuoteFromHistory = (quoteData: QuoteEmailData) => {
    setCurrentQuote(quoteData);
    setIsModalOpen(true);
  };

  const handleViewCallFromQuote = (callId: string) => {
    setIsHistoryModalOpen(false);
    setInitialCallId(callId);
    setIsCallHistoryModalOpen(true);
  };

  const handleWebhookClick = async (eventId: string) => {
    setSelectedWebhookId(eventId);
    setIsWebhookDetailModalOpen(true);

    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching webhook details:', error);
      return;
    }

    setSelectedWebhookData(data);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <AgentProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header
          onLogout={() => setIsLoggedIn(false)}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
        <div className="p-6">
          <div className="max-w-[1800px] mx-auto h-[calc(100vh-7rem)]">
            {currentPage === 'manage' ? (
              <ManagePage />
            ) : (
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-full min-h-[400px] flex flex-col gap-4">
            <PerformanceSummary />
            <div className="flex-[7] min-h-0">
              <WebhookConsole
                latestEventId={latestEventId}
                onAddEvent={(callback) => {
                  addEventCallbackRef.current = callback;
                }}
                onWebhookClick={handleWebhookClick}
              />
            </div>
          </div>
          <div className="h-full flex flex-col gap-4 min-h-[400px]">
            <div className="flex-1 min-h-0">
              <AudioVisualizer
                type="microphone"
                title="Microphone Input"
                accentColor="blue"
              />
            </div>
            <div className="flex-1 min-h-0">
              <VapiClient onEvent={handleVapiEvent} />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex-1 px-3 py-2 border border-white/30 text-white rounded-lg text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                See Quotes
              </button>
              <button
                onClick={() => setIsCallHistoryModalOpen(true)}
                className="flex-1 px-3 py-2 border border-white/30 text-white rounded-lg text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <History className="w-3.5 h-3.5" />
                Call History
              </button>
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="flex-1 px-3 py-2 border border-white/30 text-white rounded-lg text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Test Webhooks
              </button>
            </div>
          </div>
            </div>
            )}
          </div>
        </div>
      </div>

      <QuoteEmailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        quoteData={currentQuote}
      />

      <TestWebhookModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      <QuoteHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onViewQuote={handleViewQuoteFromHistory}
        onViewCall={handleViewCallFromQuote}
      />

      <CallHistoryModal
        isOpen={isCallHistoryModalOpen}
        onClose={() => {
          setIsCallHistoryModalOpen(false);
          setInitialCallId(undefined);
        }}
        initialCallId={initialCallId}
      />

      {isWebhookDetailModalOpen && selectedWebhookId && (
        <WebhookDetailModal
          webhookId={selectedWebhookId}
          webhookData={selectedWebhookData}
          onClose={() => {
            setIsWebhookDetailModalOpen(false);
            setSelectedWebhookId(null);
            setSelectedWebhookData(null);
          }}
        />
      )}
    </AgentProvider>
  );
}

export default App;
