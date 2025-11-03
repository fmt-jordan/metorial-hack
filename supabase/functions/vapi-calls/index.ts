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

    const url = new URL(req.url);
    const callId = url.searchParams.get("callId");

    if (callId) {
      const response = await fetch(`https://api.vapi.ai/v2/call/${callId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${vapiApiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vapi API error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch call from Vapi", details: errorText }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const callData = await response.json();

      return new Response(JSON.stringify(callData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const limit = url.searchParams.get("limit") || "100";
      const assistantId = url.searchParams.get("assistantId");

      let apiUrl = `https://api.vapi.ai/v2/call?limit=${limit}`;
      if (assistantId) {
        apiUrl += `&assistantId=${assistantId}`;
      }

      console.log("Fetching calls from:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${vapiApiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vapi API error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch calls from Vapi", details: errorText }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const callsData = await response.json();
      console.log("Fetched calls count:", callsData?.length || 0);

      return new Response(JSON.stringify(callsData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Vapi calls error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
