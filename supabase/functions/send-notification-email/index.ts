import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'critical_finding' | 'report_complete' | 'follow_up_reminder' | 'doctor_report_received' | 'doctor_registration_status';
  to: string;
  data: {
    userName: string;
    reportTitle?: string;
    reportId?: string;
    keyFindings?: string[];
    summaryPreview?: string;
    findingsCount?: number;
    hasRecommendations?: boolean;
    reminderType?: 'check_report' | 'schedule_appointment' | 'upload_results';
    specialtyRecommendation?: string;
    // Doctor report fields
    doctorName?: string;
    reportType?: string;
    hasRiskIndicators?: boolean;
    hasFollowUpAdvice?: boolean;
    // Doctor registration fields
    registrationStatus?: 'approved' | 'rejected' | 'suspended';
  };
}

const getEmailTemplate = (type: string, data: any, dashboardUrl: string) => {
  const baseStyles = `
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
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
      margin-bottom: 10px;
    }
    h1 {
      color: #1e293b;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #64748b;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .alert-box {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #2563EB;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
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
    .findings-list {
      background-color: #f8fafc;
      padding: 16px;
      border-radius: 4px;
      margin: 16px 0;
    }
    .findings-list li {
      color: #1e293b;
      margin-bottom: 8px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
    }
  `;

  if (type === "critical_finding") {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚕️ CareKaro</div>
            </div>
            
            <h1>⚠️ Critical Health Finding Detected</h1>
            
            <div class="alert-box">
              <p style="margin: 0; color: #991b1b; font-weight: 600;">
                Immediate medical attention required
              </p>
            </div>
            
            <p>Hello ${data.userName},</p>
            
            <p>
              Your recent medical report <strong>"${data.reportTitle || 'Medical Report'}"</strong> contains 
              critical findings that require immediate attention from a healthcare professional.
            </p>
            
            ${data.keyFindings && data.keyFindings.length > 0 ? `
              <div class="findings-list">
                <p style="margin-top: 0; font-weight: 600; color: #1e293b;">Critical Findings:</p>
                <ul>
                  ${data.keyFindings.map((finding: string) => `<li>${finding}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <p>
              Please consult with a healthcare provider as soon as possible to discuss 
              these findings and determine the appropriate next steps.
            </p>
            
            <center>
              <a href="${dashboardUrl}/analysis/${data.reportId}" class="button">
                View Full Report
              </a>
            </center>
            
            <div class="footer">
              <p>
                This is an automated alert from CareKaro Health Management System.<br>
                Do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  if (type === "report_complete") {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚕️ CareKaro</div>
            </div>
            
            <h1>✅ Your Report Analysis is Ready</h1>
            
            <p>Hello ${data.userName},</p>
            
            <p>
              Great news! Your medical report <strong>"${data.reportTitle || 'Medical Report'}"</strong> has been 
              analyzed and is now ready for review.
            </p>
            
            <div class="info-box">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">
                Your comprehensive health insights are available
              </p>
            </div>
            
            ${data.summaryPreview ? `
              <p style="font-style: italic; color: #475569; background-color: #f8fafc; padding: 12px; border-radius: 4px;">
                "${data.summaryPreview}"
              </p>
            ` : ''}
            
            <p>
              Our AI-powered analysis has processed your report and generated easy-to-understand 
              insights, including:
            </p>
            
            <ul style="color: #64748b;">
              <li>${data.findingsCount || 'Multiple'} key health metrics analyzed</li>
              ${data.hasRecommendations ? '<li>Specialist recommendations available</li>' : ''}
              <li>Trend comparisons with previous reports</li>
              <li>Clear explanations in plain language</li>
            </ul>
            
            <center>
              <a href="${dashboardUrl}/analysis/${data.reportId}" class="button">
                View Your Analysis
              </a>
            </center>
            
            <p style="font-size: 14px; color: #94a3b8;">
              Remember to discuss these findings with your healthcare provider for 
              professional medical advice.
            </p>
            
            <div class="footer">
              <p>
                This is an automated notification from CareKaro Health Management System.<br>
                Do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  if (type === "follow_up_reminder") {
    const reminderMessages = {
      'check_report': 'It\'s time to review your latest health report and track your progress.',
      'schedule_appointment': 'Your report suggests scheduling a follow-up appointment.',
      'upload_results': 'Time to upload your latest test results to keep your health records current.'
    };

    const reminderMessage = reminderMessages[data.reminderType as keyof typeof reminderMessages] || 
                          'It\'s time to check in on your health progress.';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚕️ CareKaro</div>
            </div>
            
            <h1>🔔 Health Follow-Up Reminder</h1>
            
            <p>Hello ${data.userName},</p>
            
            <p>
              This is a friendly reminder about your health follow-up${data.reportTitle ? ` for your report 
              <strong>"${data.reportTitle}"</strong>` : ''}.
            </p>
            
            <div class="info-box">
              <p style="margin: 0; color: #1e40af;">
                ${reminderMessage}
              </p>
            </div>
            
            ${data.specialtyRecommendation ? `
              <p style="background-color: #fef3c7; padding: 12px; border-radius: 4px; color: #78350f;">
                <strong>Recommendation:</strong> Consider consulting with a ${data.specialtyRecommendation}.
              </p>
            ` : ''}
            
            <p>
              Regular follow-ups are important for:
            </p>
            
            <ul style="color: #64748b;">
              <li>Monitoring your health progress</li>
              <li>Ensuring treatment effectiveness</li>
              <li>Catching any new concerns early</li>
              <li>Maintaining accurate health records</li>
            </ul>
            
            <center>
              ${data.reportId ? `
                <a href="${dashboardUrl}/analysis/${data.reportId}" class="button">
                  Review Your Report
                </a>
              ` : `
                <a href="${dashboardUrl}/dashboard" class="button">
                  Go to Dashboard
                </a>
              `}
            </center>
            
            <p style="font-size: 14px; color: #94a3b8;">
              If you've already followed up, please disregard this reminder.
            </p>
            
            <div class="footer">
              <p>
                This is an automated reminder from CareKaro Health Management System.<br>
                Do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  if (type === "doctor_report_received") {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚕️ CareKaro</div>
            </div>
            
            <h1>📋 New Medical Report from Your Doctor</h1>
            
            <p>Hello ${data.userName},</p>
            
            <p>
              Dr. <strong>${data.doctorName}</strong> has sent you a new medical report.
            </p>
            
            <div class="info-box">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">
                ${data.reportTitle || 'Medical Report'}
              </p>
              <p style="margin: 8px 0 0 0; color: #475569; font-size: 14px;">
                Report Type: ${data.reportType || 'General'}
              </p>
            </div>
            
            ${data.hasRiskIndicators ? `
              <div class="alert-box">
                <p style="margin: 0; color: #991b1b;">
                  ⚠️ This report contains risk indicators that may require your attention.
                </p>
              </div>
            ` : ''}
            
            ${data.hasFollowUpAdvice ? `
              <p style="background-color: #fef3c7; padding: 12px; border-radius: 4px; color: #78350f;">
                <strong>📌 Note:</strong> Your doctor has included follow-up advice in this report.
              </p>
            ` : ''}
            
            <p>
              Please log in to CareKaro to view the complete report, including:
            </p>
            
            <ul style="color: #64748b;">
              <li>Doctor's observations and remarks</li>
              <li>Attached documents and test results</li>
              <li>Recommended follow-up actions</li>
            </ul>
            
            <center>
              <a href="${dashboardUrl}/doctor-reports" class="button">
                View Report
              </a>
            </center>
            
            <p style="font-size: 14px; color: #94a3b8;">
              If you have questions about this report, please contact your doctor directly.
            </p>
            
            <div class="footer">
              <p>
                This is an automated notification from CareKaro Health Management System.<br>
                Do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  if (type === "doctor_registration_status") {
    const statusMessages = {
      'approved': {
        title: '✅ Your Doctor Registration is Approved!',
        message: 'Congratulations! Your registration as a medical professional on CareKaro has been approved.',
        details: 'You can now start sending medical reports to patients and managing your professional dashboard.',
        buttonText: 'Go to Doctor Dashboard',
        buttonUrl: `${dashboardUrl}/doctor`
      },
      'rejected': {
        title: '❌ Doctor Registration Not Approved',
        message: 'We regret to inform you that your doctor registration on CareKaro has not been approved at this time.',
        details: 'This may be due to incomplete documentation or verification issues. Please contact our support team for more information or to resubmit your application.',
        buttonText: 'Contact Support',
        buttonUrl: `${dashboardUrl}/contact`
      },
      'suspended': {
        title: '⚠️ Doctor Account Suspended',
        message: 'Your doctor account on CareKaro has been suspended.',
        details: 'If you believe this is an error, please contact our support team immediately for assistance.',
        buttonText: 'Contact Support',
        buttonUrl: `${dashboardUrl}/contact`
      }
    };

    const status = statusMessages[data.registrationStatus as keyof typeof statusMessages] || statusMessages.rejected;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚕️ CareKaro</div>
            </div>
            
            <h1>${status.title}</h1>
            
            <p>Hello Dr. ${data.userName},</p>
            
            <p>${status.message}</p>
            
            <div class="${data.registrationStatus === 'approved' ? 'info-box' : 'alert-box'}">
              <p style="margin: 0; color: ${data.registrationStatus === 'approved' ? '#1e40af' : '#991b1b'};">
                ${status.details}
              </p>
            </div>
            
            ${data.registrationStatus === 'approved' ? `
              <p>With your approved account, you can:</p>
              <ul style="color: #64748b;">
                <li>Send medical reports directly to patients</li>
                <li>Add observations, remarks, and follow-up advice</li>
                <li>Track reports you've sent</li>
                <li>Manage your professional profile</li>
              </ul>
            ` : ''}
            
            <center>
              <a href="${status.buttonUrl}" class="button">
                ${status.buttonText}
              </a>
            </center>
            
            <div class="footer">
              <p>
                This is an automated notification from CareKaro Health Management System.<br>
                Do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  return "";
};

const getEmailSubject = (type: string, data: any) => {
  switch (type) {
    case "critical_finding":
      return `⚠️ Critical Health Alert - Immediate Attention Required`;
    case "report_complete":
      return `✅ Your Medical Report Analysis is Ready${data.reportTitle ? `: ${data.reportTitle}` : ''}`;
    case "follow_up_reminder":
      return `🔔 Health Reminder from CareKaro`;
    case "doctor_report_received":
      return `📋 New Medical Report from Dr. ${data.doctorName || 'Your Doctor'}`;
    case "doctor_registration_status":
      const statusText = data.registrationStatus === 'approved' 
        ? 'Approved' 
        : data.registrationStatus === 'suspended' 
        ? 'Suspended' 
        : 'Update';
      return `🩺 Doctor Registration ${statusText} - CareKaro`;
    default:
      return "CareKaro Health Update";
  }
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

  try {
    const { type, to, data, userId }: EmailRequest & { userId?: string } = await req.json();

    if (!to || !type) {
      throw new Error('Missing required fields: to, type');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Get the dashboard URL from environment or use default
    const dashboardUrl = Deno.env.get('DASHBOARD_URL') || 'https://dream-weave-studio-84.vercel.app';

    const html = getEmailTemplate(type, data, dashboardUrl);
    const subject = getEmailSubject(type, data);

    console.log(`Sending ${type} email to ${to}`);

    let emailStatus = 'sent';
    let errorMessage = null;
    let resendEmailId = null;

    // Send the email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'CareKaro <onboarding@resend.dev>', // Update with your verified domain
      to: [to],
      subject,
      html,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      emailStatus = 'failed';
      errorMessage = emailError.message || 'Failed to send email';
    } else {
      console.log('Email sent successfully:', emailData);
      resendEmailId = emailData?.id || null;
    }

    // Log the email to database
    if (userId) {
      try {
        await supabaseClient.from('email_logs').insert({
          user_id: userId,
          recipient_email: to,
          email_type: type,
          subject,
          report_id: data.reportId || null,
          status: emailStatus,
          error_message: errorMessage,
          resend_email_id: resendEmailId,
        });
      } catch (logError) {
        console.error('Error logging email:', logError);
        // Don't fail the request if logging fails
      }
    }

    if (emailError) {
      throw emailError;
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendEmailId }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-notification-email:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email notification. Please try again later.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
