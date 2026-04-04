import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Rate Limiter (20 requests per minute) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = { maxRequests: 20, windowMs: 60_000 };
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
  if (req.method === 'OPTIONS') {
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body to get the action
    const body = await req.json();
    const action = body.action;

    // Generate invite code
    if (action === 'generate-code') {
      // Use service role for code management (table is not deletable via RLS)
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Clean up any previous unused codes for this inviter
      await serviceClient
        .from('family_invite_codes')
        .delete()
        .eq('inviter_id', user.id)
        .is('used_at', null);

      // Resolve inviter name for display
      const { data: inviterProfile } = await serviceClient
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const inviterName = inviterProfile?.display_name || user.email?.split('@')[0] || 'Family Member';

      // Generate new 6-digit code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { data, error } = await serviceClient
        .from('family_invite_codes')
        .insert({
          inviter_id: user.id,
          inviter_name: inviterName,
          code,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invite code:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create invite code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ code: data.code, expires_at: data.expires_at }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify invite code
    if (action === 'verify-code') {
      const { code } = body;
      
      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ error: 'Invalid code format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use service role to bypass RLS for code lookup
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: inviteCode, error } = await serviceClient
        .from('family_invite_codes')
        .select('*')
        .eq('code', code)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !inviteCode) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is trying to connect to themselves
      if (inviteCode.inviter_id === user.id) {
        return new Response(
          JSON.stringify({ error: 'You cannot connect to yourself' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if connection already exists
      const { data: existingConnection } = await serviceClient
        .from('family_connections')
        .select('id, status')
        .or(`and(inviter_id.eq.${inviteCode.inviter_id},member_id.eq.${user.id}),and(inviter_id.eq.${user.id},member_id.eq.${inviteCode.inviter_id})`)
        .eq('status', 'active')
        .single();

      if (existingConnection) {
        return new Response(
          JSON.stringify({ error: 'You are already connected with this family member' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const inviterName = inviteCode.inviter_name || 'Family Member';

      return new Response(
        JSON.stringify({ 
          valid: true, 
          inviter_id: inviteCode.inviter_id,
          inviter_name: inviterName,
          code_id: inviteCode.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect family members
    if (action === 'connect') {
      const { code_id, inviter_id, inviter_name } = body;

      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Validate invite code server-side (do not trust client-sent inviter info)
      const { data: inviteCode, error: inviteError } = await serviceClient
        .from('family_invite_codes')
        .select('*')
        .eq('id', code_id)
        .eq('inviter_id', inviter_id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !inviteCode) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const resolvedInviterName = inviteCode.inviter_name || inviter_name || 'Family Member';

      // Get current user's name
      const { data: memberProfile } = await serviceClient
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const memberName = memberProfile?.display_name || 'Family Member';

      // Create the connection
      const { data: connection, error: connectionError } = await serviceClient
        .from('family_connections')
        .insert({
          inviter_id: inviter_id,
          member_id: user.id,
          inviter_name: resolvedInviterName,
          member_name: memberName,
        })
        .select()
        .single();

      if (connectionError) {
        console.error('Error creating connection:', connectionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark the invite code as used
      await serviceClient
        .from('family_invite_codes')
        .update({ 
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq('id', code_id);

      return new Response(
        JSON.stringify({ success: true, connection }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get family connections
    if (action === 'get-connections') {
      const { data: connections, error } = await supabaseClient
        .from('family_connections')
        .select('*')
        .eq('status', 'active')
        .or(`inviter_id.eq.${user.id},member_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching connections:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch connections' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Transform connections to show the other person's info
      const transformedConnections = connections?.map(conn => ({
        ...conn,
        family_member_id: conn.inviter_id === user.id ? conn.member_id : conn.inviter_id,
        family_member_name: conn.inviter_id === user.id ? conn.member_name : conn.inviter_name,
        is_inviter: conn.inviter_id === user.id,
      }));

      return new Response(
        JSON.stringify({ connections: transformedConnections }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update connection permissions
    if (action === 'update-permissions') {
      const { connection_id, share_vitals, allow_medicine_management, emergency_alerts } = body;

      const { data, error } = await supabaseClient
        .from('family_connections')
        .update({
          share_vitals,
          allow_medicine_management,
          emergency_alerts,
        })
        .eq('id', connection_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating permissions:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update permissions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, connection: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unlink family member
    if (action === 'unlink') {
      const { connection_id } = body;

      const { error } = await supabaseClient
        .from('family_connections')
        .update({
          status: 'unlinked',
          unlinked_at: new Date().toISOString(),
        })
        .eq('id', connection_id);

      if (error) {
        console.error('Error unlinking:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to unlink family member' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get family member health summary
    if (action === 'get-member-health') {
      const { member_id } = body;

      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Verify the user has an active connection with this member
      const { data: connection } = await serviceClient
        .from('family_connections')
        .select('*')
        .eq('status', 'active')
        .or(`and(inviter_id.eq.${member_id},member_id.eq.${user.id}),and(inviter_id.eq.${user.id},member_id.eq.${member_id})`)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ error: 'No active connection with this member' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if the member allows sharing vitals
      const isMemberTheConnectedUser = connection.member_id === member_id;
      const canViewVitals = isMemberTheConnectedUser ? connection.share_vitals : true;

      if (!canViewVitals) {
        return new Response(
          JSON.stringify({ error: 'This family member has disabled vital sharing' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get latest health metrics
      const { data: healthMetrics } = await serviceClient
        .from('health_metrics')
        .select('*')
        .eq('user_id', member_id)
        .order('recorded_at', { ascending: false })
        .limit(5);

      // Get today's medications
      const today = new Date().toISOString().split('T')[0];
      const { data: medications } = await serviceClient
        .from('medication_records')
        .select('*')
        .eq('user_id', member_id)
        .gte('taken_at', today)
        .order('taken_at', { ascending: false });

      // Get member profile
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('display_name, blood_group')
        .eq('user_id', member_id)
        .single();

      return new Response(
        JSON.stringify({
          profile,
          health_metrics: healthMetrics || [],
          medications: medications || [],
          permissions: {
            share_vitals: connection.share_vitals,
            allow_medicine_management: connection.allow_medicine_management,
            emergency_alerts: connection.emergency_alerts,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});