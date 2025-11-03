import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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

export async function POST(request: Request) {
  try {
    const rawPayload = await request.text();
    const payload: WebhookPayload = JSON.parse(rawPayload);

    const requestHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });

    if (!payload['Name / Company'] || !payload.Email || !payload.Phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
        raw_payload: JSON.parse(rawPayload),
        headers: requestHeaders,
      })
      .select()
      .single();

    if (webhookError || !webhookEvent) {
      console.error('Error inserting webhook event:', webhookError);
      return new Response(
        JSON.stringify({ error: 'Failed to save webhook event' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify({ success: true, id: webhookEvent.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
