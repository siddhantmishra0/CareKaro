import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 'critical_finding' | 'report_complete' | 'follow_up_reminder' | 'doctor_report_received' | 'doctor_registration_status';

export interface SendNotificationParams {
  type: NotificationType;
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

export const notificationService = {
  /**
   * Send an email notification to a user
   */
  sendEmail: async (params: SendNotificationParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: params
      });

      if (error) {
        console.error('Notification error:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  },

  /**
   * Send critical finding alert
   */
  sendCriticalFindingAlert: async (
    userEmail: string,
    userName: string,
    reportTitle: string,
    reportId: string,
    keyFindings: string[]
  ) => {
    return notificationService.sendEmail({
      type: 'critical_finding',
      to: userEmail,
      data: {
        userName,
        reportTitle,
        reportId,
        keyFindings,
      }
    });
  },

  /**
   * Send report completion notification
   */
  sendReportCompleteNotification: async (
    userEmail: string,
    userName: string,
    reportTitle: string,
    reportId: string,
    summaryPreview: string,
    findingsCount: number,
    hasRecommendations: boolean
  ) => {
    return notificationService.sendEmail({
      type: 'report_complete',
      to: userEmail,
      data: {
        userName,
        reportTitle,
        reportId,
        summaryPreview,
        findingsCount,
        hasRecommendations,
      }
    });
  },

  /**
   * Send follow-up reminder
   */
  sendFollowUpReminder: async (
    userEmail: string,
    userName: string,
    reminderType: 'check_report' | 'schedule_appointment' | 'upload_results',
    options?: {
      reportTitle?: string;
      reportId?: string;
      specialtyRecommendation?: string;
    }
  ) => {
    return notificationService.sendEmail({
      type: 'follow_up_reminder',
      to: userEmail,
      data: {
        userName,
        reminderType,
        reportTitle: options?.reportTitle,
        reportId: options?.reportId,
        specialtyRecommendation: options?.specialtyRecommendation,
      }
    });
  },

  /**
   * Send notification when a doctor sends a report to a patient
   */
  sendDoctorReportNotification: async (
    patientEmail: string,
    patientName: string,
    doctorName: string,
    reportTitle: string,
    reportType: string,
    hasRiskIndicators: boolean,
    hasFollowUpAdvice: boolean
  ) => {
    return notificationService.sendEmail({
      type: 'doctor_report_received',
      to: patientEmail,
      data: {
        userName: patientName,
        doctorName,
        reportTitle,
        reportType,
        hasRiskIndicators,
        hasFollowUpAdvice,
      }
    });
  },

  /**
   * Send notification when a doctor's registration status changes
   */
  sendDoctorRegistrationStatusNotification: async (
    doctorEmail: string,
    doctorName: string,
    status: 'approved' | 'rejected' | 'suspended'
  ) => {
    return notificationService.sendEmail({
      type: 'doctor_registration_status',
      to: doctorEmail,
      data: {
        userName: doctorName,
        registrationStatus: status,
      }
    });
  },
};
