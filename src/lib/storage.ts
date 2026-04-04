import { supabase } from "@/integrations/supabase/client";

export const storageService = {
  /**
   * Upload a medical report file to user's folder
   * File path format: {user_id}/{report_id}/{filename}
   */
  uploadMedicalReport: async (
    userId: string,
    reportId: string,
    file: File
  ) => {
    const filePath = `${userId}/${reportId}/${file.name}`;
    
    const { data, error } = await supabase.storage
      .from("medical-reports")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;
    
    // Get public URL (will require authentication to access)
    const { data: urlData } = supabase.storage
      .from("medical-reports")
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: urlData.publicUrl,
      fullPath: data.fullPath,
    };
  },

  /**
   * Get a signed URL for accessing a medical report file
   * Signed URLs expire after specified time (default 1 hour)
   */
  getSignedUrl: async (filePath: string, expiresIn: number = 900) => {
    const { data, error } = await supabase.storage
      .from("medical-reports")
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Download a medical report file
   */
  downloadFile: async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("medical-reports")
      .download(filePath);

    if (error) throw error;
    return data;
  },

  /**
   * Delete a medical report file
   */
  deleteFile: async (filePath: string) => {
    const { error } = await supabase.storage
      .from("medical-reports")
      .remove([filePath]);

    if (error) throw error;
    return true;
  },

  /**
   * List all files in a user's folder
   */
  listUserFiles: async (userId: string) => {
    const { data, error } = await supabase.storage
      .from("medical-reports")
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get file metadata
   */
  getFileInfo: async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("medical-reports")
      .list(filePath.substring(0, filePath.lastIndexOf("/")), {
        search: filePath.substring(filePath.lastIndexOf("/") + 1),
      });

    if (error) throw error;
    return data[0];
  },

  /**
   * Upload or update user avatar
   * File path format: {user_id}/avatar.{extension}
   */
  uploadAvatar: async (userId: string, file: File) => {
    // Delete old avatar if exists
    const oldAvatarPath = `${userId}/`;
    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list(oldAvatarPath);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${oldAvatarPath}${f.name}`);
      await supabase.storage.from("avatars").remove(filesToDelete);
    }

    // Upload new avatar
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: urlData.publicUrl,
      fullPath: data.fullPath,
    };
  },

  /**
   * Delete user avatar
   */
  deleteAvatar: async (userId: string) => {
    const avatarPath = `${userId}/`;
    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list(avatarPath);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${avatarPath}${f.name}`);
      const { error } = await supabase.storage
        .from("avatars")
        .remove(filesToDelete);

      if (error) throw error;
    }

    return true;
  },
};
