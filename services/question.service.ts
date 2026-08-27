import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Question } from "@/types/question";

type Client = SupabaseClient<Database>;

export async function listQuestions(productId: string, supabase: Client = createClient()): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function askQuestion(
  input: { productId: string; userId: string; question: string },
  supabase: Client = createClient(),
) {
  const { error } = await supabase.from("questions").insert({
    product_id: input.productId,
    user_id: input.userId,
    question: input.question,
  });
  if (error) throw error;
}

export async function answerQuestion(
  questionId: string,
  answer: string,
  supabase: Client = createClient(),
) {
  const { error } = await supabase
    .from("questions")
    .update({ answer, answered_at: new Date().toISOString() })
    .eq("id", questionId);
  if (error) throw error;
}
