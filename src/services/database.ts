import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type MedicalReport = Tables<"medical_reports">;
export type MedicalReportInsert = TablesInsert<"medical_reports">;
export type MedicalReportUpdate = TablesUpdate<"medical_reports">;

export type HealthMetric = Tables<"health_metrics">;
export type HealthMetricInsert = TablesInsert<"health_metrics">;

export type SpecialistRecommendation = Tables<"specialist_recommendations">;
export type SpecialistRecommendationInsert = TablesInsert<"specialist_recommendations">;

export type Notification = Tables<"notifications">;

export const databaseService = {
  // Medical Reports
  medicalReports: {
    create: async (report: MedicalReportInsert) => {
      const { data, error } = await supabase
        .from("medical_reports")
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data as MedicalReport;
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("medical_reports")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as MedicalReport;
    },

    getByUserId: async (userId: string, limit = 50) => {
      const { data, error } = await supabase
        .from("medical_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as MedicalReport[];
    },

    update: async (id: string, updates: MedicalReportUpdate) => {
      const { data, error } = await supabase
        .from("medical_reports")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as MedicalReport;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from("medical_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    },

    getRecent: async (userId: string, limit = 5) => {
      const { data, error } = await supabase
        .from("medical_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as MedicalReport[];
    },
  },

  // Health Metrics
  healthMetrics: {
    create: async (metric: HealthMetricInsert) => {
      const { data, error } = await supabase
        .from("health_metrics")
        .insert(metric)
        .select()
        .single();

      if (error) throw error;
      return data as HealthMetric;
    },

    createBatch: async (metrics: HealthMetricInsert[]) => {
      const { data, error } = await supabase
        .from("health_metrics")
        .insert(metrics)
        .select();

      if (error) throw error;
      return data as HealthMetric[];
    },

    getByReportId: async (reportId: string) => {
      const { data, error } = await supabase
        .from("health_metrics")
        .select("*")
        .eq("report_id", reportId)
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      return data as HealthMetric[];
    },

    getByUserId: async (userId: string, metricName?: string) => {
      let query = supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false });

      if (metricName) {
        query = query.eq("metric_name", metricName);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as HealthMetric[];
    },

    getTrends: async (userId: string, metricName: string, startDate?: Date, endDate?: Date) => {
      let query = supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", userId)
        .eq("metric_name", metricName)
        .order("recorded_at", { ascending: true });

      if (startDate) {
        query = query.gte("recorded_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("recorded_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as HealthMetric[];
    },
  },

  // Specialist Recommendations
  recommendations: {
    create: async (recommendation: SpecialistRecommendationInsert) => {
      const { data, error } = await supabase
        .from("specialist_recommendations")
        .insert(recommendation)
        .select()
        .single();

      if (error) throw error;
      return data as SpecialistRecommendation;
    },

    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from("specialist_recommendations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SpecialistRecommendation[];
    },

    getByReportId: async (reportId: string) => {
      const { data, error } = await supabase
        .from("specialist_recommendations")
        .select("*")
        .eq("report_id", reportId)
        .order("urgency", { ascending: false });

      if (error) throw error;
      return data as SpecialistRecommendation[];
    },

    acknowledge: async (id: string) => {
      const { data, error } = await supabase
        .from("specialist_recommendations")
        .update({ 
          is_acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SpecialistRecommendation;
    },
  },

  // Notifications
  notifications: {
    getByUserId: async (userId: string, unreadOnly = false) => {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Notification[];
    },

    markAsRead: async (id: string) => {
      const { data, error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },

    markAllAsRead: async (userId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return true;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    },
  },
};
