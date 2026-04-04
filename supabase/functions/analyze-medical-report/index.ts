import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Rate Limiter (10 requests per minute - expensive AI operation) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };
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
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Verify JWT and get authenticated user
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUserData }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !authUserData) {
      console.error('JWT verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = authUserData.id;
    console.log('Authenticated user:', authenticatedUserId);

    const { reportId } = await req.json();
    
    if (!reportId) {
      throw new Error('Report ID is required');
    }

    // Validate reportId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid report ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the medical report
    console.log('Fetching report:', reportId);
    const { data: report, error: reportError } = await supabase
      .from('medical_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('Report fetch error:', reportError);
      throw new Error('Report not found');
    }

    // Verify the authenticated user owns this report
    if (report.user_id !== authenticatedUserId) {
      console.error('Authorization failed: User does not own this report');
      return new Response(
        JSON.stringify({ error: 'Forbidden: Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Report fetched:', report.title);

    // Download the file from storage
    // file_url is stored as: user_id/report_id/filename
    const filePath = report.file_url;
    console.log('Downloading file from path:', filePath);
    
    const { data: fileData, error: fileError } = await supabase.storage
      .from('medical-reports')
      .download(filePath);

    if (fileError || !fileData) {
      console.error('File download error:', fileError);
      throw new Error('Failed to download report file');
    }

    console.log('File downloaded, size:', fileData.size);

    // Convert to base64 using chunked approach to avoid stack overflow
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Process in chunks to avoid "Maximum call stack size exceeded" error
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const base64File = btoa(binaryString);
    
    // Determine file type
    const fileExtension = report.file_name.split('.').pop()?.toLowerCase();
    const mimeType = fileExtension === 'pdf' ? 'application/pdf' : `image/${fileExtension}`;

    console.log('Analyzing with Gemini...');

    // call the direct Gemini chat endpoint provided by Google's Generative Models API
    const response = await fetch('https://generativemodels.googleapis.com/v1/models/gemini-2.5-pro:chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Google Gemini chat API doesn't require the "model" field in the same way,
        // but we include it for clarity – the endpoint already encodes the model name.
        messages: [
          {
            role: 'system',
            content: `You are a medical report analysis AI. Analyze the provided medical report and extract key information. Focus on:
1. Creating a comprehensive summary in plain language
2. Identifying key findings
3. Detecting any critical or abnormal findings that require immediate attention
4. Recommending appropriate medical specialists if needed
5. Extracting health metrics when present (with values, units, and reference ranges)`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this ${report.report_type} medical report titled "${report.title}".`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64File}`
                }
              }
            ]
          }
        ],
        max_output_tokens: 4000,
        // NOTE: the Google API doesn't yet support the OpenAI-style tool_call features,
        // so we rely on the model to return a JSON object that we parse manually below.
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('API credits exhausted. Please add credits to your workspace.');
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received', JSON.stringify(data).slice(0, 500));

    // the Google Gemini chat API returns a nested structure; the model is
    // instructed to emit a single JSON object as the assistant's next message.
    // we try a few common paths to pull out that text and then parse it.
    let rawText: string | undefined;
    if (data.responses?.[0]?.output?.[0]?.content) {
      // new GenAI response format
      const content = data.responses[0].output[0].content;
      // search for text items
      for (const item of content) {
        if (item.type === 'text' && typeof item.text === 'string') {
          rawText = item.text;
          break;
        }
      }
    }
    // fallback to openai‑style shape (if any) for compatibility
    if (!rawText && data.choices?.[0]?.message?.content) {
      rawText = data.choices[0].message.content;
    }

    if (!rawText) {
      console.error('Unable to locate assistant text in Gemini response', JSON.stringify(data));
      throw new Error('No analysis text in response');
    }

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch (err) {
      console.error('Failed to parse analysis JSON from model output', rawText, err);
      throw new Error('Invalid JSON received from Gemini model');
    }

    console.log('Analysis extracted:', {
      hasSummary: !!analysis.ai_summary,
      findingsCount: analysis.key_findings?.length,
      critical: analysis.has_critical_findings,
      specialistsCount: analysis.specialist_recommendations?.length,
      metricsCount: analysis.health_metrics?.length
    });

    // Update medical report with AI analysis
    const { error: updateError } = await supabase
      .from('medical_reports')
      .update({
        ai_summary: analysis.ai_summary,
        key_findings: analysis.key_findings,
        has_critical_findings: analysis.has_critical_findings,
        status: 'completed'
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Report update error:', updateError);
      throw new Error('Failed to update report');
    }

    console.log('Report updated successfully');

    // Send email notifications
    try {
      // Get user email
      const { data: { user: authUser }, error: userError } = await supabase.auth.admin.getUserById(report.user_id);
      
      if (!userError && authUser?.email) {
        console.log('Fetching user profile for email...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', report.user_id)
          .single();

        const userName = profile?.display_name || authUser.email.split('@')[0];

        // Send appropriate email based on findings
        if (analysis.has_critical_findings) {
          console.log('Sending critical findings email...');
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'critical_finding',
              to: authUser.email,
              data: {
                userName,
                reportTitle: report.title,
                reportId: reportId,
                keyFindings: analysis.key_findings?.slice(0, 5) || [],
              }
            }
          });
        } else {
          console.log('Sending report complete email...');
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'report_complete',
              to: authUser.email,
              data: {
                userName,
                reportTitle: report.title,
                reportId: reportId,
                summaryPreview: analysis.ai_summary,
                findingsCount: analysis.key_findings?.length || 0,
                hasRecommendations: (analysis.specialist_recommendations?.length || 0) > 0,
              }
            }
          });
        }
        console.log('Email notification sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the function if email fails
    }

    // Create specialist recommendations
    if (analysis.specialist_recommendations && analysis.specialist_recommendations.length > 0) {
      const recommendations = analysis.specialist_recommendations.map((rec: any) => ({
        user_id: report.user_id,
        report_id: reportId,
        specialty: rec.specialty,
        urgency: rec.urgency,
        reasoning: rec.reasoning,
        recommended_actions: rec.recommended_actions || []
      }));

      const { error: recError } = await supabase
        .from('specialist_recommendations')
        .insert(recommendations);

      if (recError) {
        console.error('Recommendations insert error:', recError);
      } else {
        console.log('Recommendations created:', recommendations.length);
      }
    }

    // Create health metrics
    if (analysis.health_metrics && analysis.health_metrics.length > 0) {
      const metrics = analysis.health_metrics.map((metric: any) => ({
        user_id: report.user_id,
        report_id: reportId,
        metric_name: metric.metric_name,
        metric_value: metric.metric_value,
        metric_unit: metric.metric_unit,
        reference_range_min: metric.reference_range_min || null,
        reference_range_max: metric.reference_range_max || null,
        is_abnormal: metric.is_abnormal || false,
        recorded_at: report.report_date || new Date().toISOString()
      }));

      const { error: metricsError } = await supabase
        .from('health_metrics')
        .insert(metrics);

      if (metricsError) {
        console.error('Metrics insert error:', metricsError);
      } else {
        console.log('Metrics created:', metrics.length);
      }
    }

    // Duplicate email block removed - email is already sent above (lines 283-335)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Report analyzed successfully',
        analysis: {
          summary: analysis.ai_summary,
          critical: analysis.has_critical_findings,
          findingsCount: analysis.key_findings?.length,
          specialistsCount: analysis.specialist_recommendations?.length,
          metricsCount: analysis.health_metrics?.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-medical-report:', error);
    // Return generic error message to avoid information leakage
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred processing your request. Please try again.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
