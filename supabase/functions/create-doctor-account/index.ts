import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

interface CreateDoctorRequest {
  email: string;
  password: string;
  full_name: string;
  specialization: string;
  license_number: string;
  phone?: string;
  hospital_affiliation?: string;
  bio?: string;
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
        JSON.stringify({ error: "Only admins can create doctor accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateDoctorRequest = await req.json();

    // Validate required fields
    if (!body.email || !body.password || !body.full_name || !body.specialization || !body.license_number) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user account
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email for admin-created accounts
      user_metadata: {
        display_name: body.full_name,
        role: 'doctor'
      }
    });

    if (createUserError) {
      console.error("Error creating user:", createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authData.user!.id;

    // Create doctor profile (already approved since admin is creating)
    const { data: doctorProfile, error: profileError } = await supabaseAdmin
      .from('doctor_profiles')
      .insert({
        user_id: newUserId,
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
      // Rollback: delete the created user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set user role to doctor
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: newUserId, role: 'doctor' }, { onConflict: 'user_id' });

    if (roleError) {
      console.error("Error setting doctor role:", roleError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        doctor: doctorProfile,
        message: `Doctor account created for ${body.email}`
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
