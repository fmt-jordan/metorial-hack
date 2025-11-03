import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAgent } from '../contexts/AgentContext';

interface TestWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const testWebhooks = [
  {
    name: 'Basic Quote Test',
    payload: {
      name: 'John Smith',
      location: 'Miami',
      client_address: '123 Ocean Drive, Miami Beach, FL 33139',
      email: 'john.smith@email.com',
      phone: '(305) 555-1234',
      client_notes: 'Customer reported visible mold in bathroom and musty smell in basement. Needs urgent inspection.',
      items: [
        { item: 'First Room', item_price: 299, qty: 1 },
        { item: 'Add Small Room', item_price: 99, qty: 2 },
        { item: 'Add Large Room', item_price: 149, qty: 1 },
      ]
    }
  },
  {
    name: 'Large Commercial Quote',
    payload: {
      name: 'Sunset Real Estate Corp',
      location: 'New York',
      client_address: '456 Park Avenue, New York, NY 10022',
      email: 'facilities@sunsetrealestate.com',
      phone: '(212) 555-9876',
      client_notes: 'Commercial building with water damage on 3rd floor. Need comprehensive mold assessment for insurance claim.',
      items: [
        { item: 'First Room', item_price: 299, qty: 1 },
        { item: 'Add Small Room', item_price: 99, qty: 5 },
        { item: 'Add Large Room', item_price: 149, qty: 3 },
        { item: 'Commercial Space Premium', item_price: 499, qty: 1 },
      ]
    }
  },
  {
    name: 'Single Room Quote',
    payload: {
      name: 'Maria Garcia',
      location: 'Los Angeles',
      client_address: '789 Sunset Boulevard, Los Angeles, CA 90028',
      email: 'maria.garcia@gmail.com',
      phone: '(310) 555-4567',
      client_notes: 'Single bedroom with suspected mold growth near window. Recent water leak.',
      items: [
        { item: 'First Room', item_price: 299, qty: 1 },
      ]
    }
  },
  {
    name: 'Multi-Unit Property',
    payload: {
      name: 'Greenwood Apartments LLC',
      location: 'Chicago',
      client_address: '321 Lake Shore Drive, Chicago, IL 60611',
      email: 'property@greenwoodapts.com',
      phone: '(312) 555-7890',
      client_notes: 'Multiple units affected after roof leak during heavy storm. Need full building assessment and remediation quote.',
      items: [
        { item: 'First Room', item_price: 299, qty: 1 },
        { item: 'Add Small Room', item_price: 99, qty: 8 },
        { item: 'Add Large Room', item_price: 149, qty: 4 },
        { item: 'Attic/Crawl Space', item_price: 199, qty: 2 },
      ]
    }
  }
];

export default function TestWebhookModal({ isOpen, onClose }: TestWebhookModalProps) {
  const { selectedAssistant } = useAgent();
  const [loading, setLoading] = useState<string | null>(null);
  const [customPayload, setCustomPayload] = useState('');
  const [customPayloadError, setCustomPayloadError] = useState('');

  const handleTestWebhook = async (testName: string, payload: any) => {
    setLoading(testName);
    try {
      const { data: webhookEvent, error: webhookError } = await supabase
        .from('webhook_events')
        .insert({
          name: payload.name,
          location: payload.location || '',
          client_address: payload.client_address || '',
          email: payload.email,
          phone: payload.phone,
          client_notes: payload.client_notes || '',
          viewed: false,
          assistant_id: selectedAssistant?.assistant_id || null,
        })
        .select()
        .single();

      if (webhookError || !webhookEvent) {
        console.error('Error inserting webhook event:', webhookError);
        alert('Failed to create webhook event');
        setLoading(null);
        return;
      }

      if (payload.items && payload.items.length > 0) {
        const lineItems = payload.items.map((item: any) => ({
          webhook_event_id: webhookEvent.id,
          item: item.item,
          item_price: item.item_price,
          qty: item.qty,
        }));

        const { error: lineItemsError } = await supabase
          .from('quote_line_items')
          .insert(lineItems);

        if (lineItemsError) {
          console.error('Error inserting line items:', lineItemsError);
        }
      }

      setTimeout(() => {
        setLoading(null);
      }, 500);
    } catch (error) {
      console.error('Test webhook error:', error);
      alert('Error creating test webhook');
      setLoading(null);
    }
  };

  const handleCustomPayloadTest = async () => {
    setCustomPayloadError('');

    if (!customPayload.trim()) {
      setCustomPayloadError('Please enter a JSON payload');
      return;
    }

    try {
      const payload = JSON.parse(customPayload);

      if (!payload.name || !payload.email) {
        setCustomPayloadError('Payload must include at least "name" and "email" fields');
        return;
      }

      await handleTestWebhook('custom', payload);
      setCustomPayload('');
    } catch (error) {
      setCustomPayloadError('Invalid JSON format. Please check your payload.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">
        <div className="bg-[#004AAD] px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-white text-xl font-bold">Test Webhook Events</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-slate-300 text-sm mb-6">
            Click any button below to simulate a webhook event from the Voice Assistant. This will create a new quote in the database and trigger the email modal.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-slate-100 font-semibold text-base mb-3">Predefined Test Payloads</h3>
              <div className="space-y-4">
                {testWebhooks.map((test) => {
                  const isLoading = loading === test.name;
                  const total = test.payload.items.reduce(
                    (sum, item) => sum + item.item_price * item.qty,
                    0
                  );

                  return (
                    <div
                      key={test.name}
                      className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-slate-100 font-semibold text-lg mb-2">
                            {test.name}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-400">
                              <span className="text-slate-500">Customer:</span>{' '}
                              <span className="text-slate-300">{test.payload.name}</span>
                            </p>
                            <p className="text-slate-400">
                              <span className="text-slate-500">Location:</span>{' '}
                              <span className="text-slate-300">{test.payload.location}</span>
                            </p>
                            <p className="text-slate-400">
                              <span className="text-slate-500">Items:</span>{' '}
                              <span className="text-slate-300">{test.payload.items.length} services</span>
                            </p>
                            <p className="text-slate-400">
                              <span className="text-slate-500">Total:</span>{' '}
                              <span className="text-[#00C2A0] font-semibold">
                                ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTestWebhook(test.name, test.payload)}
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                            isLoading
                              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-[#004AAD] text-white hover:bg-[#003380]'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Test
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-slate-100 font-semibold text-base mb-3">Custom JSON Payload</h3>
              <p className="text-slate-400 text-sm mb-3">
                Enter a custom JSON payload. Required fields: <span className="text-[#00C2A0] font-mono">name</span> and <span className="text-[#00C2A0] font-mono">email</span>
              </p>
              <textarea
                value={customPayload}
                onChange={(e) => {
                  setCustomPayload(e.target.value);
                  setCustomPayloadError('');
                }}
                placeholder={`{\n  "name": "Test Customer",\n  "email": "test@example.com",\n  "phone": "(555) 555-5555",\n  "location": "New York",\n  "client_address": "123 Main St",\n  "client_notes": "Test notes",\n  "items": [\n    { "item": "First Room", "item_price": 299, "qty": 1 }\n  ]\n}`}
                className="w-full h-48 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent resize-none"
              />
              {customPayloadError && (
                <p className="text-red-400 text-sm mt-2">{customPayloadError}</p>
              )}
              <button
                onClick={handleCustomPayloadTest}
                disabled={loading === 'custom'}
                className={`mt-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  loading === 'custom'
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-[#00C2A0] text-slate-900 hover:bg-[#00A085]'
                }`}
              >
                {loading === 'custom' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Custom Payload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between rounded-b-lg border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Test webhooks will trigger real database inserts and Realtime events
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
