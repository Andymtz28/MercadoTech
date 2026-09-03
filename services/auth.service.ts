import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Profile } from "@/types/user";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

type Client = SupabaseClient<Database>;

export interface AuthProfile extends Profile {
  email: string;
}

export async function register(input: RegisterInput, supabase: Client = createClient()) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { display_name: input.displayName, role: input.role },
      // Sin esto, Supabase usa la "Site URL" fija del dashboard del proyecto
      // para el link de confirmación — en producción eso mandaba al usuario
      // de vuelta a localhost. NEXT_PUBLIC_SITE_URL hace que el redirect sea
      // correcto tanto en local como en cada entorno de Vercel (requiere
      // agregar `${NEXT_PUBLIC_SITE_URL}/**` a la lista de Redirect URLs en
      // Supabase → Authentication → URL Configuration).
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    },
  });
  if (error) throw error;
  return data;
}

export async function login(input: LoginInput, supabase: Client = createClient()) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;
  return data;
}

export async function logout(supabase: Client = createClient()) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(supabase: Client = createClient()): Promise<AuthProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;

  return { ...(data as Profile), email: user.email! };
}

// Encapsula el listener de auth para que hooks/ no necesite conocer
// lib/supabase directamente (cadena hooks → services → Supabase). Devuelve
// la función de limpieza (unsubscribe). El SDK propaga los cambios entre
// instancias del cliente aunque login/logout usen una instancia distinta a
// la de este listener.
export function subscribeToAuthChanges(onChange: () => void, supabase: Client = createClient()): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => onChange());
  return () => subscription.unsubscribe();
}
