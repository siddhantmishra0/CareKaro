import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PromoteDoctorRequest {
  user_id: string;
  full_name: string;
  specialization: string;
  license_number: string;
  hospital_affiliation?: string;
  phone?: string;
  bio?: string;
}

interface SearchUsersRequest {
  query: string;
}

// --- Rate Limiter (5 requests per minute - admin action) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = { maxRequests: 5, windowMs: 60_000 };
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

serve(async (req) => {
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
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });
    
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can manage doctor accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle search users action
    if (action === "search") {
      const body: SearchUsersRequest = await req.json();
      
      if (!body.query || body.query.length < 2) {
        return new Response(
          JSON.stringify({ error: "Search query must be at least 2 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Search in auth.users using admin API
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 50
      });

      if (listError) {
        console.error("Error listing users:", listError);
        return new Response(
          JSON.stringify({ error: "Failed to search users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter users by email or metadata
      const query = body.query.toLowerCase();
      const matchingUsers = authUsers.users.filter(u => 
        u.email?.toLowerCase().includes(query) ||
        u.user_metadata?.display_name?.toLowerCase().includes(query)
      );

      // Get existing doctor profiles to exclude
      const { data: existingDoctors } = await supabaseAdmin
        .from('doctor_profiles')
        .select('user_id');

      const existingDoctorIds = new Set(existingDoctors?.map(d => d.user_id) || []);

      // Format response and exclude existing doctors
      const users = matchingUsers
        .filter(u => !existingDoctorIds.has(u.id))
        .slice(0, 10)
        .map(u => ({
          id: u.id,
          email: u.email,
          display_name: u.user_metadata?.display_name || u.email?.split('@')[0],
          created_at: u.created_at
        }));

      return new Response(
        JSON.stringify({ users }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle promote action (default)
    const body: PromoteDoctorRequest = await req.json();

    // Validate required fields
    if (!body.user_id || !body.full_name || !body.specialization || !body.license_number) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user exists
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(body.user_id);

    if (userError || !targetUser.user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a doctor profile
    const { data: existingProfile } = await supabaseAdmin
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', body.user_id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "User already has a doctor profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create doctor profile (already approved since admin is promoting)
    const { data: doctorProfile, error: profileError } = await supabaseAdmin
      .from('doctor_profiles')
      .insert({
        user_id: body.user_id,
        full_name: body.full_name,
        specialization: body.specialization,
        license_number: body.license_number,
        hospital_affiliation: body.hospital_affiliation || null,
        phone: body.phone || null,
        bio: body.bio || null,
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error creating doctor profile:", profileError);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set user role to doctor
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: body.user_id, role: 'doctor' }, { onConflict: 'user_id' });

    if (roleError) {
      console.error("Error setting doctor role:", roleError);
    }

    // Update user metadata to include doctor role
    await supabaseAdmin.auth.admin.updateUserById(body.user_id, {
      user_metadata: {
        ...targetUser.user.user_metadata,
        role: 'doctor'
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        doctor: doctorProfile,
        message: `${targetUser.user.email} has been promoted to doctor`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
