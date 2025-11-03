import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");

    if (!vapiApiKey) {
      return new Response(
        JSON.stringify({ error: "VAPI_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vapi API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch assistants from Vapi", details: errorText }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const assistants = await response.json();

    return new Response(JSON.stringify(assistants), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Vapi assistants error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});