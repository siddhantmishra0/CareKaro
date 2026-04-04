import { supabase } from "@/integrations/supabase/client";

export interface FamilyConnection {
  id: string;
  inviter_id: string;
  member_id: string;
  inviter_name: string;
  member_name: string;
  status: string;
  share_vitals: boolean;
  allow_medicine_management: boolean;
  emergency_alerts: boolean;
  created_at: string;
  updated_at: string;
  family_member_id: string;
  family_member_name: string;
  is_inviter: boolean;
}

export interface InviteCode {
  code: string;
  expires_at: string;
}

export interface VerifyCodeResult {
  valid: boolean;
  inviter_id: string;
  inviter_name: string;
  code_id: string;
}

export interface MemberHealthData {
  profile: {
    display_name: string;
    blood_group: string;
  };
  health_metrics: Array<{
    id: string;
    metric_name: string;
    metric_value: number;
    metric_unit: string;
    recorded_at: string;
    is_abnormal: boolean;
  }>;
  medications: Array<{
    id: string;
    medication_name: string;
    dosage: string;
    taken_at: string;
  }>;
  permissions: {
    share_vitals: boolean;
    allow_medicine_management: boolean;
    emergency_alerts: boolean;
  };
}

export const familyService = {
  generateInviteCode: async (): Promise<InviteCode> => {
    // supabase.functions.invoke automatically includes the auth token.
    const { data, error } = await supabase.functions.invoke('family-linking', {
      body: JSON.stringify({ action: 'generate-code' }),
    });
    if (error) throw error;
    return data as InviteCode;
  },

  verifyCode: async (code: string): Promise<VerifyCodeResult> => {
    const { data, error } = await supabase.functions.invoke('family-linking', {
      body: JSON.stringify({ action: 'verify-code', code }),
    });
    if (error) throw error;
    return data as VerifyCodeResult;
  },

  connect: async (codeId: string, inviterId: string, inviterName: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('family-linking', {
      body: JSON.stringify({
        action: 'connect',
        code_id: codeId,
        inviter_id: inviterId,
        inviter_name: inviterName,
      }),
    });
    if (error) throw error;
  },

  getConnections: async (): Promise<FamilyConnection[]> => {
    const { data, error } = await supabase.functions.invoke('family-linking', {
      body: JSON.stringify({ action: 'get-connections' }),
    });
    if (error) throw error;
    return (data as any).connections;
  },

  updatePermissions: async (
    connectionId: string,
    permissions: {
      share_vitals?: boolean;
      allow_medicine_management?: boolean;
      emergency_alerts?: boolean;
    }
  ): Promise<void> => {
    const { error } = await supabase.functions.invoke('family-linking', {
      body: JSON.stringify({
        action: 'update-permissions',
        connection_id: connectionId,
        ...permissions,
      }),
    });
    if (error) throw error;
  },

  unlinkMember: async (connectionId: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('family-linking', {
      body: JSON.stringify({
        action: 'unlink',
        connection_id: connectionId,
      }),
    });
    if (error) throw error;
  },

  getMemberHealth: async (memberId: string): Promise<MemberHealthData> => {
    const { data, error } = await supabase.functions.invoke('family-linking', {
      body: JSON.stringify({ action: 'get-member-health', member_id: memberId }),
    });
    if (error) throw error;
    return data as MemberHealthData;
  },
};