import { supabase } from "@/integrations/supabase/client";

export interface DoctorProfile {
  id: string;
  user_id: string;
  doctor_id: string;
  full_name: string;
  specialization: string;
  license_number: string;
  hospital_affiliation: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorReport {
  id: string;
  doctor_id: string;
  patient_id: string;
  report_type: string;
  title: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  examination_date: string | null;
  doctor_remarks: string | null;
  observations: string | null;
  risk_indicators: string[] | null;
  follow_up_advice: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  doctor_profile?: DoctorProfile;
}

export const doctorService = {
  // Doctor Profile Management
  async getDoctorProfile(userId: string): Promise<DoctorProfile | null> {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as DoctorProfile | null;
  },

  async createDoctorProfile(profile: Omit<DoctorProfile, 'id' | 'created_at' | 'updated_at' | 'verification_status' | 'verified_at' | 'verified_by'>): Promise<DoctorProfile> {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data as DoctorProfile;
  },

  async updateDoctorProfile(id: string, updates: Partial<DoctorProfile>): Promise<DoctorProfile> {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DoctorProfile;
  },

  // For checking if current user is a verified doctor
  async isVerifiedDoctor(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_doctor', { _user_id: userId });

    if (error) {
      console.error('Error checking doctor status:', error);
      return false;
    }

    return data || false;
  },

  // Doctor Reports - For Doctors
  async createReport(report: Omit<DoctorReport, 'id' | 'created_at' | 'updated_at' | 'is_read' | 'read_at'>): Promise<DoctorReport> {
    const { data, error } = await supabase
      .from('doctor_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data as DoctorReport;
  },

  async getDoctorReports(doctorProfileId: string): Promise<DoctorReport[]> {
    const { data, error } = await supabase
      .from('doctor_reports')
      .select('*')
      .eq('doctor_id', doctorProfileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DoctorReport[];
  },

  // Patient Reports Inbox - For Patients
  async getPatientReports(patientId: string): Promise<(DoctorReport & { doctor_profile: DoctorProfile })[]> {
    const { data, error } = await supabase
      .from('doctor_reports')
      .select(`
        *,
        doctor_profile:doctor_profiles!doctor_id(*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (DoctorReport & { doctor_profile: DoctorProfile })[];
  },

  async markReportAsRead(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_reports')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', reportId);

    if (error) throw error;
  },

  async getUnreadReportCount(patientId: string): Promise<number> {
    const { count, error } = await supabase
      .from('doctor_reports')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // Admin Functions
  async getAllDoctorProfiles(status?: string): Promise<DoctorProfile[]> {
    let query = supabase
      .from('doctor_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('verification_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as DoctorProfile[];
  },

  async verifyDoctor(doctorId: string, status: 'approved' | 'rejected' | 'suspended', adminId: string): Promise<DoctorProfile> {
    const updates: Partial<DoctorProfile> = {
      verification_status: status,
      verified_by: adminId,
      verified_at: status === 'approved' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('doctor_profiles')
      .update(updates)
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;

    // Also add doctor role if approved
    if (status === 'approved') {
      const doctorProfile = data as DoctorProfile;
      await supabase
        .from('user_roles')
        .upsert({ user_id: doctorProfile.user_id, role: 'doctor' }, { onConflict: 'user_id' });
    }

    return data as DoctorProfile;
  },

  // Search patients (for doctors to send reports) - includes email for notifications
  // Supports search by name or patient ID (PAT-XXXXXXXX format, first 8 chars of user_id)
  async searchPatients(searchQuery: string): Promise<{ user_id: string; display_name: string | null; patient_id: string | null; email?: string }[]> {
    const isPatientIdSearch = searchQuery.toUpperCase().startsWith('PAT-');
    
    let query = supabase
      .from('profiles')
      .select('user_id, display_name, patient_id')
      .not('patient_id', 'is', null); // Only search patients (those with patient_id)
    
    if (isPatientIdSearch) {
      // Search by patient ID (case-insensitive)
      query = query.ilike('patient_id', `%${searchQuery}%`);
    } else {
      // Search by display name
      query = query.ilike('display_name', `%${searchQuery}%`);
    }
    
    const { data, error } = await query.limit(10);

    if (error) throw error;

    const results = data || [];
    
    // Enrich with emails using edge function
    const enrichedResults = await Promise.all(
      results.map(async (patient) => {
        try {
          const email = await doctorService.getUserEmail(patient.user_id);
          return { ...patient, email };
        } catch {
          return patient;
        }
      })
    );

    return enrichedResults;
  },

  // Get user email by user_id (for notifications) - uses edge function
  async getUserEmail(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-email', {
        body: { userId }
      });
      
      if (error) {
        console.error('Error getting user email:', error);
        return null;
      }
      
      return data?.email || null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  },
};
