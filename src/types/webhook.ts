export interface LineItem {
  id: string;
  webhook_event_id: string;
  item: string;
  item_price: number;
  qty: number;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  name: string;
  location: string;
  client_address: string;
  email: string;
  phone: string;
  client_notes: string;
  viewed: boolean;
  created_at: string;
  updated_at: string;
  raw_payload?: any;
  headers?: Record<string, string>;
  line_items?: LineItem[];
}

export interface QuoteEmailData {
  event: WebhookEvent;
  lineItems: LineItem[];
  subtotal: number;
  total: number;
}
