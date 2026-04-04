import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Rate Limiter (3 requests per minute - destructive action) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = { maxRequests: 3, windowMs: 60_000 };
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key)?.filter(t => now - t < RATE_LIMIT.windowMs) || [];
  if (timestamps.length >= RATE_LIMIT.maxRequests) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) { if (v.every(t => now - t >= RATE_LIMIT.windowMs)) rateLimitMap.delete(k); }
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's JWT to get their user ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify the token and get user info
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Admin client with service role to delete user data and auth record
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete user data from all health tracking tables
    const healthTables = [
      'water_records',
      'sleep_records',
      'blood_pressure_records',
      'medication_records',
      'fitness_records',
      'mental_health_checkins',
      'period_records',
      'ovulation_predictions',
      'kick_records',
      'contraction_records',
      'vision_records',
      'testosterone_records',
      'libido_records',
      'substance_records',
      'symptom_assessments',
      'health_assessments',
      'weight_records',
    ];

    // Delete from health tracking tables in parallel
    await Promise.all(
      healthTables.map(table => 
        adminClient.from(table).delete().eq('user_id', userId)
      )
    );

    // Delete user data from core tables
    const coreTables = [
      'notifications',
      'specialist_recommendations',
      'health_metrics',
      'report_shares',
      'audit_logs',
      'email_logs',
      'suspicious_activities',
    ];

    await Promise.all(
      coreTables.map(table => 
        adminClient.from(table).delete().eq('user_id', userId)
      )
    );

    // Get medical reports to delete associated storage files
    const { data: reports } = await adminClient
      .from('medical_reports')
      .select('id, file_url')
      .eq('user_id', userId);

    // Delete storage files for medical reports
    if (reports && reports.length > 0) {
      const filePaths = reports
        .filter(r => r.file_url)
        .map(r => {
          // Extract file path from URL (format: .../medical-reports/userId/filename)
          const url = r.file_url;
          const match = url?.match(/medical-reports\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        await adminClient.storage.from('medical-reports').remove(filePaths);
      }
    }

    // Delete medical reports
    await adminClient.from('medical_reports').delete().eq('user_id', userId);

    // Delete family connections where user is inviter or member
    await Promise.all([
      adminClient.from('family_connections').delete().eq('inviter_id', userId),
      adminClient.from('family_connections').delete().eq('member_id', userId),
      adminClient.from('family_invite_codes').delete().eq('inviter_id', userId),
      adminClient.from('family_invite_codes').update({ used_by: null, used_at: null }).eq('used_by', userId),
    ]);
    
    // Delete doctor reports where user is patient
    await adminClient.from('doctor_reports').delete().eq('patient_id', userId);
    
    // Delete doctor profile if exists
    await adminClient.from('doctor_profiles').delete().eq('user_id', userId);
    
    // Delete user roles
    await adminClient.from('user_roles').delete().eq('user_id', userId);

    // Get profile to check for avatar
    const { data: profile } = await adminClient
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    // Delete avatar from storage if exists
    if (profile?.avatar_url) {
      const avatarMatch = profile.avatar_url.match(/avatars\/(.+)$/);
      if (avatarMatch) {
        await adminClient.storage.from('avatars').remove([avatarMatch[1]]);
      }
    }
    
    // Delete profile
    await adminClient.from('profiles').delete().eq('user_id', userId);

    // Finally, delete the user from auth.users using admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-account:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
