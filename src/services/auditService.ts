import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface AuditEventParams {
  actionType: string;
  actionCategory: 'reports' | 'doctor_interactions' | 'data_sharing' | 'family_access' | 'admin_actions' | 'user_activity';
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, Json>;
}

export const auditService = {
  /**
   * Log an audit event for the current user
   */
  async logEvent(params: AuditEventParams): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action_type: params.actionType,
          action_category: params.actionCategory,
          resource_type: params.resourceType || null,
          resource_id: params.resourceId || null,
          details: params.details || null,
        }]);

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  },

  /**
   * Log a report view event
   */
  async logReportView(reportId: string, reportTitle: string): Promise<void> {
    await this.logEvent({
      actionType: 'report_viewed',
      actionCategory: 'reports',
      resourceType: 'medical_report',
      resourceId: reportId,
      details: { title: reportTitle }
    });
  },

  /**
   * Log a report download event
   */
  async logReportDownload(reportId: string, reportTitle: string): Promise<void> {
    await this.logEvent({
      actionType: 'report_downloaded',
      actionCategory: 'reports',
      resourceType: 'medical_report',
      resourceId: reportId,
      details: { title: reportTitle }
    });
  },

  /**
   * Log a health tool usage event
   */
  async logHealthToolUsage(toolName: string): Promise<void> {
    await this.logEvent({
      actionType: 'health_tool_used',
      actionCategory: 'user_activity',
      resourceType: 'health_tool',
      details: { tool_name: toolName }
    });
  },

  /**
   * Log a user login event
   */
  async logUserLogin(): Promise<void> {
    await this.logEvent({
      actionType: 'user_logged_in',
      actionCategory: 'user_activity',
    });
  },

  /**
   * Log a profile update event
   */
  async logProfileUpdate(fields: string[]): Promise<void> {
    await this.logEvent({
      actionType: 'profile_updated',
      actionCategory: 'user_activity',
      resourceType: 'profile',
      details: { updated_fields: fields }
    });
  },
};
