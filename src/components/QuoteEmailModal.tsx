import { useEffect, useRef, useState } from 'react';
import { X, Copy, CheckCircle, Check } from 'lucide-react';
import { QuoteEmailData } from '../types/webhook';
import QuoteEmailTemplate from './QuoteEmailTemplate';
import { supabase } from '../lib/supabase';

interface QuoteEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: QuoteEmailData | null;
}

export default function QuoteEmailModal({ isOpen, onClose, quoteData }: QuoteEmailModalProps) {
  const [copied, setCopied] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && e.target === modalRef.current) {
      onClose();
    }
  };

  const handleCopyHTML = async () => {
    if (!contentRef.current) return;

    try {
      const htmlContent = contentRef.current.innerHTML;
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleAccept = async () => {
    if (!quoteData || isAccepting) return;

    setIsAccepting(true);
    try {
      const { error } = await supabase
        .from('webhook_events')
        .update({ quote_status: 'won' })
        .eq('id', quoteData.event.id);

      if (error) {
        console.error('Error accepting quote:', error);
      } else {
        setIsAccepted(true);
        setTimeout(() => {
          onClose();
          setIsAccepted(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  useEffect(() => {
    if (isOpen && quoteData) {
      setIsAccepted(quoteData.event.quote_status === 'won');
    }
  }, [isOpen, quoteData]);

  if (!isOpen || !quoteData) return null;

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in slide-in-from-top-4 duration-300"
        style={{
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        <div className="bg-[#004AAD] px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-white text-xl font-bold">Mold Inspection Quote</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHTML}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white flex items-center gap-2 text-sm font-medium"
              title="Copy HTML"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy HTML
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div ref={contentRef}>
            <QuoteEmailTemplate data={quoteData} />
          </div>
        </div>

        <div className="bg-slate-100 px-6 py-4 flex items-center justify-between rounded-b-lg border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Quote for <span className="font-semibold text-slate-900">{quoteData.event.name}</span>
          </p>
          <div className="flex items-center gap-3">
            {isAccepted ? (
              <div className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Accepted!
              </div>
            ) : (
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {isAccepting ? 'Accepting...' : 'Accept'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
