import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LineItem {
  item: string;
  item_price: number;
  qty: number;
}

interface TranscriptMessage {
  role: string;
  message: string;
  timestamp: number;
}

interface WebhookPayload {
  name: string;
  location: string;
  client_address: string;
  email: string;
  phone: string;
  client_notes: string;
  items: LineItem[];
  call_id?: string;
  call_type?: string;
  call_duration?: number;
  call_status?: string;
  transcript?: TranscriptMessage[];
  recording_url?: string;
  cost?: number;
  assistant_id?: string;
  assistantId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawPayload = await req.text();
    const payload: WebhookPayload = JSON.parse(rawPayload);

    const requestHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });

    if (!payload.name || !payload.email || !payload.phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, phone" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const assistantId = payload.assistant_id || payload.assistantId;

    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        name: payload.name,
        location: payload.location || "",
        client_address: payload.client_address || "",
        email: payload.email,
        phone: payload.phone,
        client_notes: payload.client_notes || "",
        viewed: false,
        call_id: payload.call_id,
        call_type: payload.call_type,
        call_duration: payload.call_duration,
        call_status: payload.call_status,
        transcript: payload.transcript,
        recording_url: payload.recording_url,
        cost: payload.cost,
        assistant_id: assistantId,
        raw_payload: JSON.parse(rawPayload),
        headers: requestHeaders,
      })
      .select()
      .single();

    if (webhookError || !webhookEvent) {
      console.error("Error inserting webhook event:", webhookError);
      return new Response(
        JSON.stringify({ error: "Failed to save webhook event" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (payload.items && payload.items.length > 0) {
      const lineItems = payload.items.map((item) => ({
        webhook_event_id: webhookEvent.id,
        item: item.item,
        item_price: item.item_price,
        qty: item.qty,
      }));

      const { error: lineItemsError } = await supabase
        .from("quote_line_items")
        .insert(lineItems);

      if (lineItemsError) {
        console.error("Error inserting line items:", lineItemsError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, id: webhookEvent.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
