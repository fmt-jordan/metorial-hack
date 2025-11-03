import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface LineItem {
  Item: string;
  'Item Price': number;
  Qty: number;
}

interface WebhookPayload {
  'Name / Company': string;
  'FMT Location': string;
  'Client Address': string;
  Email: string;
  Phone: string;
  'Client Notes': string;
  Items: LineItem[];
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload: WebhookPayload = req.body;
    const requestHeaders = req.headers || {};

    if (!payload['Name / Company'] || !payload.Email || !payload.Phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: webhookEvent, error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        name: payload['Name / Company'],
        location: payload['FMT Location'] || '',
        client_address: payload['Client Address'] || '',
        email: payload.Email,
        phone: payload.Phone,
        client_notes: payload['Client Notes'] || '',
        viewed: false,
        raw_payload: payload,
        headers: requestHeaders,
      })
      .select()
      .single();

    if (webhookError || !webhookEvent) {
      console.error('Error inserting webhook event:', webhookError);
      return res.status(500).json({ error: 'Failed to save webhook event' });
    }

    if (payload.Items && payload.Items.length > 0) {
      const lineItems = payload.Items.map((item) => ({
        webhook_event_id: webhookEvent.id,
        item: item.Item,
        item_price: item['Item Price'],
        qty: item.Qty,
      }));

      const { error: lineItemsError } = await supabase
        .from('quote_line_items')
        .insert(lineItems);

      if (lineItemsError) {
        console.error('Error inserting line items:', lineItemsError);
      }
    }

    return res.status(200).json({ success: true, id: webhookEvent.id });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
