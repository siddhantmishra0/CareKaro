import { supabase } from "@/integrations/supabase/client";

export interface CreateShareParams {
  reportId: string;
  expiresInHours: number;
  recipientEmail?: string;
  maxAccessCount?: number;
}

export interface ShareLink {
  id: string;
  share_token: string;
  report_id: string;
  recipient_email: string | null;
  expires_at: string;
  access_count: number;
  max_access_count: number | null;
  is_active: boolean;
  created_at: string;
}

export const shareService = {
  /**
   * Create a new share link for a report
   */
  async createShare(params: CreateShareParams): Promise<ShareLink> {
    const { reportId, expiresInHours, recipientEmail, maxAccessCount } = params;

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate share token using the database function
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_share_token');

    if (tokenError) throw tokenError;

    // Create the share record
    const { data, error } = await supabase
      .from('report_shares')
      .insert({
        report_id: reportId,
        user_id: user.id,
        share_token: tokenData,
        recipient_email: recipientEmail || null,
        expires_at: expiresAt.toISOString(),
        max_access_count: maxAccessCount || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all shares for a specific report
   */
  async getReportShares(reportId: string): Promise<ShareLink[]> {
    const { data, error } = await supabase
      .from('report_shares')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Revoke a share link (deactivate it)
   */
  async revokeShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('report_shares')
      .update({ is_active: false })
      .eq('id', shareId);

    if (error) throw error;
  },

  /**
   * Delete a share link permanently
   */
  async deleteShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('report_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
  },

  /**
   * Get share link URL
   */
  getShareUrl(token: string): string {
    return `${window.location.origin}/shared/${token}`;
  },

  /**
   * View a shared report using token (calls edge function)
   */
  async viewSharedReport(token: string) {
    const { data, error } = await supabase.functions.invoke('view-shared-report', {
      body: { token },
    });

    if (error) throw error;
    return data;
  },
};
