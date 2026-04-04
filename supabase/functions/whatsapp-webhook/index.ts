import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json();
    console.log("Gupshup webhook payload:", JSON.stringify(payload));

    // Gupshup sends different event types
    const eventType = payload.type;

    if (eventType !== "message") {
      return new Response(JSON.stringify({ status: "ignored", reason: "not a message event" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = payload.payload?.payload;
    const senderPhone = payload.payload?.sender?.phone;

    if (!senderPhone) {
      return new Response(JSON.stringify({ error: "No sender phone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only handle media messages (image, document, video)
    const messageType = message?.type;
    if (!["image", "document", "file"].includes(messageType)) {
      return new Response(JSON.stringify({ status: "ignored", reason: "not a media message" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone number (remove +, spaces, etc.)
    const normalizedPhone = senderPhone.replace(/[^0-9]/g, "");

    // Look up user by phone number in profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name, patient_id")
      .or(`phone.eq.${normalizedPhone},phone.eq.+${normalizedPhone}`);

    if (profileError || !profiles || profiles.length === 0) {
      console.error("No user found for phone:", normalizedPhone, profileError);
      return new Response(
        JSON.stringify({ error: "Unknown sender phone number" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile = profiles[0];
    const userId = profile.user_id;

    // Determine role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const userRole = roles?.role || "user";
    const isDoctor = userRole === "doctor";
    const rolePrefix = isDoctor ? "doctor" : "patient";

    // Download the media file from Gupshup URL
    const mediaUrl = message?.url;
    if (!mediaUrl) {
      return new Response(JSON.stringify({ error: "No media URL in message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      console.error("Failed to download media:", mediaResponse.status);
      return new Response(JSON.stringify({ error: "Failed to download media" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mediaBuffer = await mediaResponse.arrayBuffer();
    const contentType = mediaResponse.headers.get("content-type") || "application/octet-stream";

    // Generate file name
    const timestamp = Date.now();
    const originalName = message?.caption || message?.fileName || `whatsapp-${timestamp}`;
    const extension = getExtension(contentType, originalName);
    const fileName = `${timestamp}-${sanitizeFileName(originalName)}${extension}`;
    const filePath = `${rolePrefix}/${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("medical-reports")
      .upload(filePath, mediaBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload to storage" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert metadata into medical_files
    const { data: fileRecord, error: insertError } = await supabase
      .from("medical_files")
      .insert({
        user_id: userId,
        uploaded_by: userId,
        uploaded_by_role: rolePrefix,
        source: "whatsapp",
        file_name: originalName,
        file_url: uploadData.path,
        file_path: filePath,
        file_size: mediaBuffer.byteLength,
        file_type: messageType,
        mime_type: contentType,
        sender_phone: normalizedPhone,
        description: message?.caption || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save file metadata" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("File saved successfully:", fileRecord.id);

    return new Response(
      JSON.stringify({ status: "success", fileId: fileRecord.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 100);
}

function getExtension(contentType: string, fileName: string): string {
  // If fileName already has extension, don't add one
  if (/\.[a-zA-Z0-9]+$/.test(fileName)) return "";
  
  const mimeMap: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  };
  return mimeMap[contentType] || "";
}
