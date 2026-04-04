import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const gupshupApiKey = Deno.env.get("GUPSHUP_API_KEY");
    const gupshupAppName = Deno.env.get("GUPSHUP_APP_NAME");
    const gupshupSourcePhone = Deno.env.get("GUPSHUP_SOURCE_PHONE");

    if (!gupshupApiKey || !gupshupAppName || !gupshupSourcePhone) {
      return new Response(
        JSON.stringify({ error: "Gupshup configuration missing. Set GUPSHUP_API_KEY, GUPSHUP_APP_NAME, GUPSHUP_SOURCE_PHONE secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is a doctor
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isDoc } = await supabase.rpc("is_doctor", { _user_id: user.id });
    if (!isDoc) {
      return new Response(JSON.stringify({ error: "Only doctors can send reports via WhatsApp" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { patientId, fileId, templateName } = body;

    if (!patientId || !fileId) {
      return new Response(JSON.stringify({ error: "patientId and fileId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get patient phone number
    const { data: patientProfile, error: patientError } = await supabase
      .from("profiles")
      .select("phone, display_name")
      .eq("user_id", patientId)
      .single();

    if (patientError || !patientProfile?.phone) {
      return new Response(
        JSON.stringify({ error: "Patient phone number not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get file info
    const { data: fileRecord, error: fileError } = await supabase
      .from("medical_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !fileRecord) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signed URL for the file (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("medical-reports")
      .createSignedUrl(fileRecord.file_path, 3600);

    if (signedUrlError || !signedUrlData) {
      return new Response(JSON.stringify({ error: "Failed to generate file URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send WhatsApp template message via Gupshup
    const destinationPhone = patientProfile.phone.replace(/[^0-9]/g, "");
    const template = templateName || "medical_report_notification";

    const gupshupPayload = {
      channel: "whatsapp",
      source: gupshupSourcePhone,
      destination: destinationPhone,
      "src.name": gupshupAppName,
      template: JSON.stringify({
        id: template,
        params: [
          patientProfile.display_name || "Patient",
          fileRecord.file_name,
        ],
      }),
      message: JSON.stringify({
        type: "document",
        url: signedUrlData.signedUrl,
        filename: fileRecord.file_name,
      }),
    };

    const gupshupResponse = await fetch("https://api.gupshup.io/wa/api/v1/template/msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: gupshupApiKey,
      },
      body: new URLSearchParams(gupshupPayload as Record<string, string>),
    });

    const gupshupResult = await gupshupResponse.text();
    console.log("Gupshup response:", gupshupResult);

    if (!gupshupResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send WhatsApp message", details: gupshupResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "sent", gupshupResponse: gupshupResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
