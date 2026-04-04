import { supabase } from "@/integrations/supabase/client";

export type SuspiciousActivitySeverity = "low" | "medium" | "high" | "critical";
export type SuspiciousActivityStatus = "pending" | "reviewed" | "dismissed" | "escalated";

export interface SuspiciousActivity {
  id: string;
  user_id: string;
  pattern_type: string;
  severity: SuspiciousActivitySeverity;
  details: Record<string, unknown> | null;
  status: SuspiciousActivityStatus;
  detected_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  // Enriched fields
  user_name?: string;
  user_email?: string;
}

export interface SuspiciousActivityFilters {
  status?: SuspiciousActivityStatus | "all";
  severity?: SuspiciousActivitySeverity | "all";
  patternType?: string | "all";
  page?: number;
  perPage?: number;
}

export interface SuspiciousActivityStats {
  total: number;
  pending: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  escalated: number;
  dismissed: number;
  reviewed: number;
}

const PATTERN_TYPE_LABELS: Record<string, string> = {
  failed_logins: "Failed Login Attempts",
  excessive_downloads: "Excessive Report Downloads",
  rapid_exports: "Rapid Data Exports",
  mass_sharing: "Mass Report Sharing",
  rapid_profile_changes: "Rapid Profile Changes",
  excessive_api_calls: "Excessive API Calls",
  unusual_access_hours: "Unusual Access Hours",
};

export const suspiciousActivityService = {
  getPatternLabel(patternType: string): string {
    return PATTERN_TYPE_LABELS[patternType] || patternType.replace(/_/g, " ");
  },

  async getActivities(filters: SuspiciousActivityFilters = {}): Promise<{
    data: SuspiciousActivity[];
    count: number;
  }> {
    const { status = "all", severity = "all", patternType = "all", page = 1, perPage = 50 } = filters;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("suspicious_activities")
      .select("*", { count: "exact" })
      .order("detected_at", { ascending: false })
      .range(from, to);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (severity !== "all") {
      query = query.eq("severity", severity);
    }

    if (patternType !== "all") {
      query = query.eq("pattern_type", patternType);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Enrich with user information
    const userIds = [...new Set(data?.map((a) => a.user_id) || [])];
    let userMap: Map<string, { display_name: string }> = new Map();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      userMap = new Map(profiles?.map((p) => [p.user_id, { display_name: p.display_name || "Unknown User" }]) || []);
    }

    const enrichedData: SuspiciousActivity[] = (data || []).map((activity) => ({
      ...activity,
      severity: activity.severity as SuspiciousActivitySeverity,
      status: activity.status as SuspiciousActivityStatus,
      details: (typeof activity.details === 'object' && activity.details !== null && !Array.isArray(activity.details))
        ? activity.details as Record<string, unknown>
        : null,
      user_name: userMap.get(activity.user_id)?.display_name || "Unknown User",
    }));

    return { data: enrichedData, count: count || 0 };
  },

  async getStats(): Promise<SuspiciousActivityStats> {
    const { data, error } = await supabase
      .from("suspicious_activities")
      .select("status, severity");

    if (error) throw error;

    const stats: SuspiciousActivityStats = {
      total: data?.length || 0,
      pending: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      escalated: 0,
      dismissed: 0,
      reviewed: 0,
    };

    data?.forEach((activity) => {
      // Count by status
      if (activity.status === "pending") stats.pending++;
      else if (activity.status === "escalated") stats.escalated++;
      else if (activity.status === "dismissed") stats.dismissed++;
      else if (activity.status === "reviewed") stats.reviewed++;

      // Count by severity
      if (activity.severity === "critical") stats.critical++;
      else if (activity.severity === "high") stats.high++;
      else if (activity.severity === "medium") stats.medium++;
      else if (activity.severity === "low") stats.low++;
    });

    return stats;
  },

  async updateStatus(
    activityId: string,
    status: SuspiciousActivityStatus,
    resolutionNotes?: string,
    reviewedBy?: string
  ): Promise<void> {
    const { error } = await supabase
      .from("suspicious_activities")
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        reviewed_by: reviewedBy || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", activityId);

    if (error) throw error;

    // Log the admin action
    if (reviewedBy) {
      await supabase.from("audit_logs").insert({
        user_id: reviewedBy,
        action_type: `suspicious_activity_${status}`,
        action_category: "admin_actions",
        resource_type: "suspicious_activity",
        resource_id: activityId,
        details: { new_status: status, resolution_notes: resolutionNotes },
      });
    }
  },

  async dismiss(activityId: string, notes: string, reviewedBy: string): Promise<void> {
    return this.updateStatus(activityId, "dismissed", notes, reviewedBy);
  },

  async escalate(activityId: string, notes: string, reviewedBy: string): Promise<void> {
    return this.updateStatus(activityId, "escalated", notes, reviewedBy);
  },

  async markReviewed(activityId: string, notes: string, reviewedBy: string): Promise<void> {
    return this.updateStatus(activityId, "reviewed", notes, reviewedBy);
  },

  async getUserRecentActivity(userId: string, limit = 20): Promise<unknown[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
