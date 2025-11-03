import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface WebhookDetailModalProps {
  webhookId: string;
  webhookData: {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    client_address: string;
    client_notes: string;
    raw_payload: any;
    headers: Record<string, string>;
    created_at: string;
  } | null;
  onClose: () => void;
}

export default function WebhookDetailModal({ webhookId, webhookData, onClose }: WebhookDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'payload' | 'headers' | 'processed'>('payload');
  const [copied, setCopied] = useState(false);

  if (!webhookData) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading webhook details...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    const copyData = {
      id: webhookData.id,
      created_at: webhookData.created_at,
      headers: webhookData.headers,
      payload: webhookData.raw_payload,
      processed: {
        name: webhookData.name,
        email: webhookData.email,
        phone: webhookData.phone,
        location: webhookData.location,
        client_address: webhookData.client_address,
        client_notes: webhookData.client_notes,
      }
    };
    navigator.clipboard.writeText(JSON.stringify(copyData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Webhook Details</h2>
            <p className="text-sm text-slate-400 mt-1">
              ID: {webhookId.substring(0, 8)}... • {formatDate(webhookData.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy All</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('payload')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'payload'
                ? 'text-teal-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            Raw Payload
            {activeTab === 'payload' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'headers'
                ? 'text-teal-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            HTTP Headers
            {activeTab === 'headers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'processed'
                ? 'text-teal-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            Processed Data
            {activeTab === 'processed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400"></div>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'payload' && (
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-auto">
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(webhookData.raw_payload, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Header
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {webhookData.headers && Object.entries(webhookData.headers).map(([key, value]) => (
                    <tr key={key} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3 text-sm font-mono text-teal-400">
                        {key}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300 break-all">
                        {value}
                      </td>
                    </tr>
                  ))}
                  {(!webhookData.headers || Object.keys(webhookData.headers).length === 0) && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500 text-sm">
                        No headers captured
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'processed' && (
            <div className="space-y-4">
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="text-sm text-slate-500 w-32">Name:</span>
                    <span className="text-sm text-slate-300">{webhookData.name}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-slate-500 w-32">Email:</span>
                    <span className="text-sm text-slate-300">{webhookData.email}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-slate-500 w-32">Phone:</span>
                    <span className="text-sm text-slate-300">{webhookData.phone}</span>
                  </div>
                  {webhookData.location && (
                    <div className="flex">
                      <span className="text-sm text-slate-500 w-32">Location:</span>
                      <span className="text-sm text-slate-300">{webhookData.location}</span>
                    </div>
                  )}
                  {webhookData.client_address && (
                    <div className="flex">
                      <span className="text-sm text-slate-500 w-32">Address:</span>
                      <span className="text-sm text-slate-300">{webhookData.client_address}</span>
                    </div>
                  )}
                  {webhookData.client_notes && (
                    <div className="flex">
                      <span className="text-sm text-slate-500 w-32">Notes:</span>
                      <span className="text-sm text-slate-300">{webhookData.client_notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
