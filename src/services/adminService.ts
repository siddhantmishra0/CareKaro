import { supabase } from "@/integrations/supabase/client";

export interface EmailLog {
  id: string;
  user_id: string;
  recipient_email: string;
  email_type: string;
  subject: string;
  report_id: string | null;
  status: string;
  error_message: string | null;
  resend_email_id: string | null;
  sent_at: string;
  created_at: string;
}

export interface EmailAnalytics {
  date: string;
  email_type: string;
  status: string;
  count: number;
  unique_users: number;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export const adminService = {
  /**
   * Check if current user is an admin
   */
  async isAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('is_admin', { _user_id: user.id });

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data || false;
  },

  /**
   * Get current user's role
   */
  async getUserRole(): Promise<'admin' | 'doctor' | 'user' | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return (data?.role as 'admin' | 'doctor' | 'user') || null;
  },

  /**
   * Get all email logs with pagination
   */
  async getEmailLogs(params?: {
    page?: number;
    perPage?: number;
    emailType?: string;
    status?: string;
    userId?: string;
  }): Promise<{ data: EmailLog[]; count: number }> {
    const page = params?.page || 1;
    const perPage = params?.perPage || 50;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(from, to);

    if (params?.emailType) {
      query = query.eq('email_type', params.emailType);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
    };
  },

  /**
   * Get email analytics
   */
  async getEmailAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<EmailAnalytics[]> {
    let query = supabase
      .from('email_analytics')
      .select('*')
      .order('date', { ascending: false });

    if (params?.startDate) {
      query = query.gte('date', params.startDate);
    }

    if (params?.endDate) {
      query = query.lte('date', params.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  },

  /**
   * Get email statistics summary
   */
  async getEmailStatsSummary(): Promise<{
    totalEmails: number;
    successfulEmails: number;
    failedEmails: number;
    criticalAlerts: number;
    reportCompleted: number;
    followUpReminders: number;
  }> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('email_type, status');

    if (error) throw error;

    const stats = {
      totalEmails: data?.length || 0,
      successfulEmails: data?.filter(e => e.status === 'sent').length || 0,
      failedEmails: data?.filter(e => e.status === 'failed').length || 0,
      criticalAlerts: data?.filter(e => e.email_type === 'critical_finding').length || 0,
      reportCompleted: data?.filter(e => e.email_type === 'report_complete').length || 0,
      followUpReminders: data?.filter(e => e.email_type === 'follow_up_reminder').length || 0,
    };

    return stats;
  },

  /**
   * Get all users with their roles (admin only)
   */
  async getAllUsersWithRoles(): Promise<Array<{
    id: string;
    email: string;
    display_name: string | null;
    role: 'admin' | 'user';
  }>> {
    // First get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name');

    if (profilesError) throw profilesError;

    // Then get all user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) throw rolesError;

    // Get auth users - this requires service role in production
    // For now, we'll combine profiles and roles
    const usersWithRoles = profiles?.map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.user_id);
      return {
        id: profile.user_id,
        email: '', // Would need auth.users access
        display_name: profile.display_name,
        role: (userRole?.role as 'admin' | 'user') || 'user',
      };
    }) || [];

    return usersWithRoles;
  },
};
