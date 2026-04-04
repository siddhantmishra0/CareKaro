import { supabase } from "@/integrations/supabase/client";

export interface MedicalFile {
  id: string;
  user_id: string;
  uploaded_by: string;
  uploaded_by_role: string;
  source: "whatsapp" | "website";
  file_name: string;
  file_url: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  mime_type: string | null;
  description: string | null;
  doctor_report_id: string | null;
  sender_phone: string | null;
  created_at: string;
  updated_at: string;
}

export const medicalFilesService = {
  async getMyFiles(): Promise<MedicalFile[]> {
    const { data, error } = await supabase
      .from("medical_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as MedicalFile[];
  },

  async uploadFileFromWebsite(
    userId: string,
    file: File,
    description?: string,
    patientId?: string
  ): Promise<MedicalFile> {
    const timestamp = Date.now();
    const targetUserId = patientId || userId;
    const rolePrefix = patientId ? "doctor" : "patient";
    const filePath = `${rolePrefix}/${targetUserId}/${timestamp}-${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("medical-reports")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Insert metadata
    const { data, error } = await supabase
      .from("medical_files")
      .insert({
        user_id: targetUserId,
        uploaded_by: userId,
        uploaded_by_role: patientId ? "doctor" : "patient",
        source: "website" as const,
        file_name: file.name,
        file_url: filePath,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type.startsWith("image/") ? "image" : "document",
        mime_type: file.type,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as MedicalFile;
  },

  async getSignedUrl(filePath: string, expiresIn = 900): Promise<string> {
    const { data, error } = await supabase.storage
      .from("medical-reports")
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  async sendViaWhatsApp(patientId: string, fileId: string, templateName?: string) {
    const { data, error } = await supabase.functions.invoke("whatsapp-send", {
      body: { patientId, fileId, templateName },
    });

    if (error) throw error;
    return data;
  },
};
