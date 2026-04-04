export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_category: string
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_category: string
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_category?: string
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      blood_pressure_records: {
        Row: {
          created_at: string
          diastolic: number
          id: string
          notes: string | null
          pulse: number | null
          recorded_at: string
          systolic: number
          user_id: string
        }
        Insert: {
          created_at?: string
          diastolic: number
          id?: string
          notes?: string | null
          pulse?: number | null
          recorded_at?: string
          systolic: number
          user_id: string
        }
        Update: {
          created_at?: string
          diastolic?: number
          id?: string
          notes?: string | null
          pulse?: number | null
          recorded_at?: string
          systolic?: number
          user_id?: string
        }
        Relationships: []
      }
      contraction_records: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          intensity: number | null
          notes: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          intensity?: number | null
          notes?: string | null
          started_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          intensity?: number | null
          notes?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          doctor_id: string
          full_name: string
          hospital_affiliation: string | null
          id: string
          license_number: string
          phone: string | null
          specialization: string
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          doctor_id: string
          full_name: string
          hospital_affiliation?: string | null
          id?: string
          license_number: string
          phone?: string | null
          specialization: string
          updated_at?: string
          user_id: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          doctor_id?: string
          full_name?: string
          hospital_affiliation?: string | null
          id?: string
          license_number?: string
          phone?: string | null
          specialization?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      doctor_reports: {
        Row: {
          created_at: string
          doctor_id: string
          doctor_remarks: string | null
          examination_date: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          follow_up_advice: string | null
          id: string
          is_read: boolean | null
          observations: string | null
          patient_id: string
          read_at: string | null
          report_type: string
          risk_indicators: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          doctor_remarks?: string | null
          examination_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          follow_up_advice?: string | null
          id?: string
          is_read?: boolean | null
          observations?: string | null
          patient_id: string
          read_at?: string | null
          report_type: string
          risk_indicators?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          doctor_remarks?: string | null
          examination_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          follow_up_advice?: string | null
          id?: string
          is_read?: boolean | null
          observations?: string | null
          patient_id?: string
          read_at?: string | null
          report_type?: string
          risk_indicators?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reports_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          report_id: string | null
          resend_email_id: string | null
          sent_at: string | null
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          report_id?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          report_id?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "medical_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      family_connections: {
        Row: {
          allow_medicine_management: boolean | null
          created_at: string | null
          emergency_alerts: boolean | null
          id: string
          inviter_id: string
          inviter_name: string | null
          member_id: string
          member_name: string | null
          share_vitals: boolean | null
          status: string | null
          unlinked_at: string | null
          updated_at: string | null
        }
        Insert: {
          allow_medicine_management?: boolean | null
          created_at?: string | null
          emergency_alerts?: boolean | null
          id?: string
          inviter_id: string
          inviter_name?: string | null
          member_id: string
          member_name?: string | null
          share_vitals?: boolean | null
          status?: string | null
          unlinked_at?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_medicine_management?: boolean | null
          created_at?: string | null
          emergency_alerts?: boolean | null
          id?: string
          inviter_id?: string
          inviter_name?: string | null
          member_id?: string
          member_name?: string | null
          share_vitals?: boolean | null
          status?: string | null
          unlinked_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      family_invite_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          inviter_id: string
          inviter_name: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          inviter_id: string
          inviter_name?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          inviter_name?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      fitness_records: {
        Row: {
          activity_type: string
          calories_burned: number | null
          created_at: string
          distance_km: number | null
          duration_minutes: number | null
          heart_rate_avg: number | null
          id: string
          notes: string | null
          recorded_at: string
          steps: number | null
          user_id: string
        }
        Insert: {
          activity_type: string
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          heart_rate_avg?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          steps?: number | null
          user_id: string
        }
        Update: {
          activity_type?: string
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          heart_rate_avg?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          steps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      health_assessments: {
        Row: {
          ai_analysis: string | null
          answers: Json | null
          assessment_date: string
          assessment_type: string
          created_at: string
          id: string
          recommendations: string[] | null
          score: number | null
          severity: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          answers?: Json | null
          assessment_date?: string
          assessment_type: string
          created_at?: string
          id?: string
          recommendations?: string[] | null
          score?: number | null
          severity?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          answers?: Json | null
          assessment_date?: string
          assessment_type?: string
          created_at?: string
          id?: string
          recommendations?: string[] | null
          score?: number | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          created_at: string | null
          id: string
          is_abnormal: boolean | null
          metric_name: string
          metric_unit: string
          metric_value: number
          recorded_at: string | null
          reference_range_max: number | null
          reference_range_min: number | null
          report_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_abnormal?: boolean | null
          metric_name: string
          metric_unit: string
          metric_value: number
          recorded_at?: string | null
          reference_range_max?: number | null
          reference_range_min?: number | null
          report_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_abnormal?: boolean | null
          metric_name?: string
          metric_unit?: string
          metric_value?: number
          recorded_at?: string | null
          reference_range_max?: number | null
          reference_range_min?: number | null
          report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "medical_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      kick_records: {
        Row: {
          created_at: string
          id: string
          kick_count: number | null
          notes: string | null
          session_end: string | null
          session_start: string
          target_kicks: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kick_count?: number | null
          notes?: string | null
          session_end?: string | null
          session_start: string
          target_kicks?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kick_count?: number | null
          notes?: string | null
          session_end?: string | null
          session_start?: string
          target_kicks?: number | null
          user_id?: string
        }
        Relationships: []
      }
      libido_records: {
        Row: {
          created_at: string
          exercise_done: boolean | null
          id: string
          libido_level: number | null
          mood: string | null
          notes: string | null
          recorded_at: string
          sleep_hours: number | null
          stress_level: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_done?: boolean | null
          id?: string
          libido_level?: number | null
          mood?: string | null
          notes?: string | null
          recorded_at?: string
          sleep_hours?: number | null
          stress_level?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_done?: boolean | null
          id?: string
          libido_level?: number | null
          mood?: string | null
          notes?: string | null
          recorded_at?: string
          sleep_hours?: number | null
          stress_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      medical_files: {
        Row: {
          created_at: string
          description: string | null
          doctor_report_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          mime_type: string | null
          sender_phone: string | null
          source: string
          updated_at: string
          uploaded_by: string
          uploaded_by_role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          doctor_report_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
          sender_phone?: string | null
          source?: string
          updated_at?: string
          uploaded_by: string
          uploaded_by_role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          doctor_report_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
          sender_phone?: string | null
          source?: string
          updated_at?: string
          uploaded_by?: string
          uploaded_by_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_files_doctor_report_id_fkey"
            columns: ["doctor_report_id"]
            isOneToOne: false
            referencedRelation: "doctor_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_reports: {
        Row: {
          ai_summary: string | null
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          has_critical_findings: boolean | null
          id: string
          key_findings: string[] | null
          report_date: string | null
          report_type: Database["public"]["Enums"]["report_type"]
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          has_critical_findings?: boolean | null
          id?: string
          key_findings?: string[] | null
          report_date?: string | null
          report_type: Database["public"]["Enums"]["report_type"]
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          has_critical_findings?: boolean | null
          id?: string
          key_findings?: string[] | null
          report_date?: string | null
          report_type?: Database["public"]["Enums"]["report_type"]
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medication_records: {
        Row: {
          created_at: string
          dosage: string | null
          frequency: string | null
          id: string
          medication_name: string
          notes: string | null
          taken_at: string
          time_of_day: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          frequency?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          taken_at?: string
          time_of_day?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          frequency?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          taken_at?: string
          time_of_day?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      mental_health_checkins: {
        Row: {
          ai_insights: string | null
          anxiety_level: number | null
          checkin_date: string
          created_at: string
          energy_level: number | null
          id: string
          journal_entry: string | null
          mood_rating: number | null
          sleep_quality: number | null
          stress_level: number | null
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          ai_insights?: string | null
          anxiety_level?: number | null
          checkin_date?: string
          created_at?: string
          energy_level?: number | null
          id?: string
          journal_entry?: string | null
          mood_rating?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          ai_insights?: string | null
          anxiety_level?: number | null
          checkin_date?: string
          created_at?: string
          energy_level?: number | null
          id?: string
          journal_entry?: string | null
          mood_rating?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          related_report_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          related_report_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          related_report_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "medical_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ovulation_predictions: {
        Row: {
          ai_notes: string | null
          created_at: string
          cycle_length: number | null
          fertile_window_end: string
          fertile_window_start: string
          id: string
          next_period_date: string | null
          predicted_ovulation_date: string
          user_id: string
        }
        Insert: {
          ai_notes?: string | null
          created_at?: string
          cycle_length?: number | null
          fertile_window_end: string
          fertile_window_start: string
          id?: string
          next_period_date?: string | null
          predicted_ovulation_date: string
          user_id: string
        }
        Update: {
          ai_notes?: string | null
          created_at?: string
          cycle_length?: number | null
          fertile_window_end?: string
          fertile_window_start?: string
          id?: string
          next_period_date?: string | null
          predicted_ovulation_date?: string
          user_id?: string
        }
        Relationships: []
      }
      period_records: {
        Row: {
          created_at: string
          end_date: string | null
          flow_intensity: string | null
          id: string
          notes: string | null
          start_date: string
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          flow_intensity?: string | null
          id?: string
          notes?: string | null
          start_date: string
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          flow_intensity?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allergies: string[] | null
          avatar_url: string | null
          blood_group: string | null
          chronic_conditions: string[] | null
          created_at: string
          current_medications: string[] | null
          date_of_birth: string | null
          display_name: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          gender: string | null
          id: string
          patient_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          avatar_url?: string | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          current_medications?: string[] | null
          date_of_birth?: string | null
          display_name?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          gender?: string | null
          id?: string
          patient_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          avatar_url?: string | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          current_medications?: string[] | null
          date_of_birth?: string | null
          display_name?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          gender?: string | null
          id?: string
          patient_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_shares: {
        Row: {
          access_count: number | null
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          max_access_count: number | null
          recipient_email: string | null
          report_id: string
          share_token: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          max_access_count?: number | null
          recipient_email?: string | null
          report_id: string
          share_token: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          max_access_count?: number | null
          recipient_email?: string | null
          report_id?: string
          share_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_shares_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "medical_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_records: {
        Row: {
          bedtime: string | null
          created_at: string
          duration_hours: number | null
          id: string
          interruptions: number | null
          notes: string | null
          quality_rating: number | null
          sleep_date: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          duration_hours?: number | null
          id?: string
          interruptions?: number | null
          notes?: string | null
          quality_rating?: number | null
          sleep_date: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          duration_hours?: number | null
          id?: string
          interruptions?: number | null
          notes?: string | null
          quality_rating?: number | null
          sleep_date?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      specialist_recommendations: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          id: string
          is_acknowledged: boolean | null
          reasoning: string
          recommended_actions: string[] | null
          report_id: string | null
          specialty: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          reasoning: string
          recommended_actions?: string[] | null
          report_id?: string | null
          specialty: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          reasoning?: string
          recommended_actions?: string[] | null
          report_id?: string | null
          specialty?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_recommendations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "medical_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          last_four_digits: string | null
          next_billing_date: string
          payment_method: string | null
          period: string
          plan: string
          price: number
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_four_digits?: string | null
          next_billing_date?: string
          payment_method?: string | null
          period?: string
          plan?: string
          price?: number
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_four_digits?: string | null
          next_billing_date?: string
          payment_method?: string | null
          period?: string
          plan?: string
          price?: number
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      substance_records: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          quantity: number | null
          recorded_at: string
          substance_type: string
          trigger_reason: string | null
          unit: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          recorded_at?: string
          substance_type: string
          trigger_reason?: string | null
          unit?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          recorded_at?: string
          substance_type?: string
          trigger_reason?: string | null
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suspicious_activities: {
        Row: {
          created_at: string
          details: Json | null
          detected_at: string
          id: string
          pattern_type: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: Database["public"]["Enums"]["suspicious_activity_severity"]
          status: Database["public"]["Enums"]["suspicious_activity_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          detected_at?: string
          id?: string
          pattern_type: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["suspicious_activity_severity"]
          status?: Database["public"]["Enums"]["suspicious_activity_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          detected_at?: string
          id?: string
          pattern_type?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["suspicious_activity_severity"]
          status?: Database["public"]["Enums"]["suspicious_activity_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      symptom_assessments: {
        Row: {
          ai_analysis: string | null
          assessment_type: string
          created_at: string
          duration: string | null
          id: string
          recommendations: string[] | null
          severity: string | null
          symptoms: string[]
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          assessment_type: string
          created_at?: string
          duration?: string | null
          id?: string
          recommendations?: string[] | null
          severity?: string | null
          symptoms: string[]
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          assessment_type?: string
          created_at?: string
          duration?: string | null
          id?: string
          recommendations?: string[] | null
          severity?: string | null
          symptoms?: string[]
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      testosterone_records: {
        Row: {
          ai_insights: string | null
          created_at: string
          free_testosterone: number | null
          id: string
          notes: string | null
          recorded_at: string
          testosterone_unit: string | null
          total_testosterone: number | null
          user_id: string
        }
        Insert: {
          ai_insights?: string | null
          created_at?: string
          free_testosterone?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          testosterone_unit?: string | null
          total_testosterone?: number | null
          user_id: string
        }
        Update: {
          ai_insights?: string | null
          created_at?: string
          free_testosterone?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          testosterone_unit?: string | null
          total_testosterone?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vision_records: {
        Row: {
          created_at: string
          id: string
          left_eye_vision: string | null
          notes: string | null
          recorded_at: string
          right_eye_vision: string | null
          screen_time_hours: number | null
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          left_eye_vision?: string | null
          notes?: string | null
          recorded_at?: string
          right_eye_vision?: string | null
          screen_time_hours?: number | null
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          left_eye_vision?: string | null
          notes?: string | null
          recorded_at?: string
          right_eye_vision?: string | null
          screen_time_hours?: number | null
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      water_records: {
        Row: {
          created_at: string
          drink_type: string | null
          id: string
          intake_date: string
          intake_ml: number
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          drink_type?: string | null
          id?: string
          intake_date?: string
          intake_ml: number
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          drink_type?: string | null
          id?: string
          intake_date?: string
          intake_ml?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weight_records: {
        Row: {
          bmi: number | null
          created_at: string
          height: number | null
          id: string
          notes: string | null
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          bmi?: number | null
          created_at?: string
          height?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          bmi?: number | null
          created_at?: string
          height?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      wellness_goals: {
        Row: {
          created_at: string
          goal_type: string
          id: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_type: string
          id?: string
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_type?: string
          id?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      audit_analytics: {
        Row: {
          action_category: string | null
          action_type: string | null
          count: number | null
          date: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      email_analytics: {
        Row: {
          count: number | null
          date: string | null
          email_type: string | null
          status: string | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_shares: { Args: never; Returns: undefined }
      generate_share_token: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_doctor: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action_category: string
          p_action_type: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "doctor"
      notification_type:
        | "critical_finding"
        | "report_ready"
        | "follow_up_reminder"
        | "health_alert"
      report_status: "processing" | "completed" | "failed"
      report_type:
        | "blood_test"
        | "ecg"
        | "xray"
        | "mri"
        | "ct_scan"
        | "ultrasound"
        | "other"
      suspicious_activity_severity: "low" | "medium" | "high" | "critical"
      suspicious_activity_status:
        | "pending"
        | "reviewed"
        | "dismissed"
        | "escalated"
      urgency_level: "low" | "medium" | "high" | "critical"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "doctor"],
      notification_type: [
        "critical_finding",
        "report_ready",
        "follow_up_reminder",
        "health_alert",
      ],
      report_status: ["processing", "completed", "failed"],
      report_type: [
        "blood_test",
        "ecg",
        "xray",
        "mri",
        "ct_scan",
        "ultrasound",
        "other",
      ],
      suspicious_activity_severity: ["low", "medium", "high", "critical"],
      suspicious_activity_status: [
        "pending",
        "reviewed",
        "dismissed",
        "escalated",
      ],
      urgency_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
