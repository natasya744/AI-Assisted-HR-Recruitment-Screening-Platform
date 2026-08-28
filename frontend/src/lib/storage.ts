import { supabase } from "@/lib/supabase";

const BUCKET = "candidate-cvs";

export async function uploadCandidateCv(
  candidateId: string,
  file: File,
): Promise<string> {
  const filePath = `${candidateId}/${file.name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return filePath;
}

export async function getCvPublicUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteCandidateCv(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) throw error;
}