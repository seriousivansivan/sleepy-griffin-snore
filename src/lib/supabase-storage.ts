import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Uploads a file to a specified Supabase Storage bucket and returns the public URL.
 * @param file The file object to upload.
 * @param bucketName The name of the storage bucket.
 * @param path The path within the bucket (e.g., 'logos/company-id.png').
 * @returns The public URL of the uploaded file, or null on failure.
 */
export async function uploadFileAndGetUrl(
  file: File,
  bucketName: string,
  path: string
): Promise<string | null> {
  try {
    // 1. Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      toast.error(`File upload failed: ${uploadError.message}`);
      return null;
    }

    // 2. Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    return urlData.publicUrl;

  } catch (e) {
    console.error("General upload error:", e);
    toast.error("An unexpected error occurred during file upload.");
    return null;
  }
}