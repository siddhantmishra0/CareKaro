import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pattern detection thresholds
const DETECTION_THRESHOLDS = {
  failed_logins: { count: 5, windowMinutes: 15, severity: "high" },
  excessive_downloads: { count: 20, windowMinutes: 60, severity: "high" },
  rapid_exports: { count: 10, windowMinutes: 60, severity: "critical" },
  mass_sharing: { count: 15, windowMinutes: 60, severity: "high" },
  rapid_profile_changes: { count: 5, windowMinutes: 10, severity: "medium" },
  excessive_api_calls: { count: 100, windowMinutes: 10, severity: "high" },
};

// Map audit action types to pattern types
const ACTION_TO_PATTERN: Record<string, string> = {
  login_failed: "failed_logins",
  report_downloaded: "excessive_downloads",
  report_exported: "rapid_exports",
  bulk_data_export: "rapid_exports",
  report_shared: "mass_sharing",
  profile_updated: "rapid_profile_changes",
};

const PATTERN_LABELS: Record<string, string> = {
  failed_logins: "Failed Login Attempts",
  excessive_downloads: "Excessive Report Downloads",
  rapid_exports: "Rapid Data Exports",
  mass_sharing: "Mass Report Sharing",
  rapid_profile_changes: "Rapid Profile Changes",
  excessive_api_calls: "Excessive API Calls",
};

interface AuditEvent {
  id: string;
  user_id: string;
  action_type: string;
  action_category: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Send email alert to all admin users
async function sendAdminAlerts(
  supabase: any,
  patternType: string,
  severity: string,
  userId: string,
  eventCount: number,
  activityId: string,
  dashboardUrl: string
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping admin email alerts");
    return;
  }

  const resend = new Resend(resendApiKey);

  // Get all admin user IDs
  const { data: adminRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (rolesError || !adminRoles?.length) {
    console.log("No admin users found or error fetching:", rolesError);
    return;
  }

  // Get admin emails via the get-user-email function or profiles
  const adminUserIds = (adminRoles as Array<{ user_id: string }>).map((r) => r.user_id);
  
  // Get profiles for display names and use service role to get emails
  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", adminUserIds);

  // Get the flagged user's profile
  const { data: flaggedUser } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .single();

  const flaggedUserName = (flaggedUser as { display_name?: string } | null)?.display_name || "Unknown User";
  const patternLabel = PATTERN_LABELS[patternType] || patternType.replace(/_/g, " ");
  const severityColor = severity === "critical" ? "#dc2626" : severity === "high" ? "#ea580c" : "#eab308";
  const severityBg = severity === "critical" ? "#fef2f2" : severity === "high" ? "#fff7ed" : "#fefce8";

  // For each admin, get their email and send alert
  const adminProfileList = (adminProfiles || []) as Array<{ user_id: string; display_name?: string }>;
  
  for (const admin of adminProfileList) {
    try {
      // Call the get-user-email edge function to get admin email
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/get-user-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ userId: admin.user_id }),
      });

      if (!emailResponse.ok) {
        console.log(`Failed to get email for admin ${admin.user_id}`);
        continue;
      }

      const { email: adminEmail } = await emailResponse.json();
      if (!adminEmail) continue;

      const adminName = admin.display_name || "Admin";

      // Send the email
      const emailResult = await resend.emails.send({
        from: "CareKaro Security <security@carekaro.lovable.app>",
        to: [adminEmail],
        subject: `🚨 ${severity.toUpperCase()} Security Alert: ${patternLabel}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                  background-color: #f8fafc;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  padding: 40px 30px;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  font-size: 28px;
                  font-weight: bold;
                  color: #2563EB;
                }
                h1 {
                  color: #1e293b;
                  font-size: 22px;
                  margin-bottom: 20px;
                }
                p {
                  color: #64748b;
                  font-size: 16px;
                  line-height: 1.6;
                  margin-bottom: 16px;
                }
                .alert-box {
                  background-color: ${severityBg};
                  border-left: 4px solid ${severityColor};
                  padding: 16px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
                .severity-badge {
                  display: inline-block;
                  background-color: ${severityColor};
                  color: white;
                  padding: 4px 12px;
                  border-radius: 4px;
                  font-weight: 600;
                  font-size: 14px;
                  text-transform: uppercase;
                }
                .details-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                .details-table td {
                  padding: 10px;
                  border-bottom: 1px solid #e2e8f0;
                }
                .details-table td:first-child {
                  color: #64748b;
                  font-weight: 500;
                  width: 140px;
                }
                .details-table td:last-child {
                  color: #1e293b;
                }
                .button {
                  display: inline-block;
                  background-color: #2563EB;
                  color: #ffffff;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 6px;
                  font-weight: 600;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e2e8f0;
                  color: #94a3b8;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">🛡️ CareKaro Security</div>
                </div>
                
                <h1>Suspicious Activity Detected</h1>
                
                <div class="alert-box">
                  <span class="severity-badge">${severity}</span>
                  <p style="margin: 12px 0 0 0; color: #1e293b; font-weight: 600;">
                    ${patternLabel}
                  </p>
                </div>
                
                <p>Hello ${adminName},</p>
                
                <p>
                  A suspicious activity pattern has been detected on CareKaro that requires your attention.
                </p>
                
                <table class="details-table">
                  <tr>
                    <td>Pattern Type</td>
                    <td><strong>${patternLabel}</strong></td>
                  </tr>
                  <tr>
                    <td>Severity</td>
                    <td><span class="severity-badge">${severity}</span></td>
                  </tr>
                  <tr>
                    <td>User</td>
                    <td>${flaggedUserName}</td>
                  </tr>
                  <tr>
                    <td>Event Count</td>
                    <td>${eventCount} events</td>
                  </tr>
                  <tr>
                    <td>Detected At</td>
                    <td>${new Date().toLocaleString()}</td>
                  </tr>
                </table>
                
                <p>
                  Please review this activity in the Admin Dashboard to take appropriate action.
                </p>
                
                <center>
                  <a href="${dashboardUrl}/admin" class="button">
                    Review in Admin Dashboard
                  </a>
                </center>
                
                <p style="font-size: 14px; color: #94a3b8;">
                  You can dismiss this as a false positive, mark as reviewed, or escalate for further investigation.
                </p>
                
                <div class="footer">
                  <p>
                    This is an automated security alert from CareKaro.<br>
                    Activity ID: ${activityId}
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      console.log(`Admin alert sent to ${adminEmail}:`, emailResult);

      // Log the email send
      await supabase.from("email_logs").insert({
        user_id: admin.user_id,
        email_type: "admin_security_alert",
        recipient_email: adminEmail,
        subject: `🚨 ${severity.toUpperCase()} Security Alert: ${patternLabel}`,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error(`Failed to send alert to admin ${admin.user_id}:`, emailError);
    }
  }
}

// --- Rate Limiter (60 requests per minute - internal trigger) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = { maxRequests: 60, windowMs: 60_000 };
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { auditEvent } = await req.json() as { auditEvent: AuditEvent };

    if (!auditEvent || !auditEvent.user_id) {
      return new Response(
        JSON.stringify({ error: "Invalid audit event data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, action_type, action_category, details, created_at } = auditEvent;

    // Determine which pattern to check based on the action type
    const patternType = ACTION_TO_PATTERN[action_type];
    if (!patternType) {
      // Not a monitored action type
      return new Response(
        JSON.stringify({ detected: false, reason: "Action type not monitored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const threshold = DETECTION_THRESHOLDS[patternType as keyof typeof DETECTION_THRESHOLDS];
    if (!threshold) {
      return new Response(
        JSON.stringify({ detected: false, reason: "No threshold configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate the time window
    const windowStart = new Date(
      new Date(created_at).getTime() - threshold.windowMinutes * 60 * 1000
    ).toISOString();

    // Count recent events of this type for this user
    const { count, error: countError } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("action_type", action_type)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Error counting events:", countError);
      throw countError;
    }

    const eventCount = count || 0;

    // Check if threshold is exceeded
    if (eventCount < threshold.count) {
      return new Response(
        JSON.stringify({ 
          detected: false, 
          reason: "Below threshold",
          currentCount: eventCount,
          threshold: threshold.count 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending/escalated suspicious activity for this user and pattern
    // (avoid duplicates within the same hour)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: existingActivity, error: existingError } = await supabase
      .from("suspicious_activities")
      .select("id")
      .eq("user_id", user_id)
      .eq("pattern_type", patternType)
      .in("status", ["pending", "escalated"])
      .gte("detected_at", hourAgo)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is expected
      console.error("Error checking existing activity:", existingError);
    }

    if (existingActivity) {
      return new Response(
        JSON.stringify({ 
          detected: true, 
          alreadyFlagged: true,
          existingId: existingActivity.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create suspicious activity record
    const { data: newActivity, error: insertError } = await supabase
      .from("suspicious_activities")
      .insert({
        user_id,
        pattern_type: patternType,
        severity: threshold.severity,
        details: {
          action_type,
          action_category,
          event_count: eventCount,
          threshold_count: threshold.count,
          window_minutes: threshold.windowMinutes,
          triggering_event_id: auditEvent.id,
          triggering_event_details: details,
          detected_at_timestamp: created_at,
        },
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating suspicious activity:", insertError);
      throw insertError;
    }

    // Log the detection as an audit event
    await supabase.from("audit_logs").insert({
      user_id,
      action_type: "suspicious_access_pattern",
      action_category: "admin_actions",
      resource_type: "suspicious_activity",
      resource_id: newActivity.id,
      details: {
        pattern_type: patternType,
        severity: threshold.severity,
        event_count: eventCount,
      },
    });

    // Send email alerts to admins for critical and high severity activities
    if (threshold.severity === "critical" || threshold.severity === "high") {
      console.log(`Sending admin alerts for ${threshold.severity} suspicious activity: ${patternType}`);
      const dashboardUrl = "https://carekaro.lovable.app";
      
      await sendAdminAlerts(
        supabase,
        patternType,
        threshold.severity,
        user_id,
        eventCount,
        newActivity.id,
        dashboardUrl
      );
    }

    return new Response(
      JSON.stringify({ 
        detected: true, 
        activityId: newActivity.id,
        severity: threshold.severity,
        patternType,
        adminAlertsTriggered: threshold.severity === "critical" || threshold.severity === "high"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in detect-suspicious:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
