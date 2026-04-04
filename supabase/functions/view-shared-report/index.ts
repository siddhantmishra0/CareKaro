import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Rate Limiter (30 requests per minute) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = { maxRequests: 30, windowMs: 60_000 };
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Share token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate share token and get share details
    const { data: share, error: shareError } = await supabaseClient
      .from('report_shares')
      .select('*, medical_reports(*)')
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (shareError || !share) {
      console.error('Share not found:', shareError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired share link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if share has expired
    if (new Date(share.expires_at) < new Date()) {
      await supabaseClient
        .from('report_shares')
        .update({ is_active: false })
        .eq('id', share.id);

      return new Response(
        JSON.stringify({ error: 'This share link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check max access count
    if (share.max_access_count && share.access_count >= share.max_access_count) {
      await supabaseClient
        .from('report_shares')
        .update({ is_active: false })
        .eq('id', share.id);

      return new Response(
        JSON.stringify({ error: 'This share link has reached its maximum access limit' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update access count and last accessed time
    await supabaseClient
      .from('report_shares')
      .update({
        access_count: share.access_count + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', share.id);

    // Get health metrics for the report
    const { data: healthMetrics } = await supabaseClient
      .from('health_metrics')
      .select('*')
      .eq('report_id', share.report_id)
      .order('recorded_at', { ascending: false });

    // Get specialist recommendations
    const { data: recommendations } = await supabaseClient
      .from('specialist_recommendations')
      .select('*')
      .eq('report_id', share.report_id)
      .order('urgency', { ascending: false });

    // Get signed URL for the report file if it exists
    let signedUrl = null;
    if (share.medical_reports.file_url) {
      const { data: urlData } = await supabaseClient.storage
        .from('medical-reports')
        .createSignedUrl(share.medical_reports.file_url, 900);
      
      if (urlData) {
        signedUrl = urlData.signedUrl;
      }
    }

    return new Response(
      JSON.stringify({
        report: {
          ...share.medical_reports,
          file_url: signedUrl,
        },
        healthMetrics: healthMetrics || [],
        recommendations: recommendations || [],
        shareInfo: {
          expires_at: share.expires_at,
          recipient_email: share.recipient_email,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in view-shared-report function:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to access the shared report. Please verify the link and try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
