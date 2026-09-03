import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface SupportArticle {
  id: string;
  title: string;
  content: string;
  category: string | null;
}

// RLS ya restringe a artículos publicados (support_articles_select — using
// is_published) y permite lectura anónima, así que no hace falta filtrar
// is_published aquí ni exigir sesión.
export async function getSupportArticleById(
  id: string,
  supabase: Client = createClient(),
): Promise<SupportArticle | null> {
  const { data, error } = await supabase
    .from("support_articles")
    .select("id, title, content, category")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
