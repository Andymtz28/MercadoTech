import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ADVERTENCIA: cliente con service role, bypasea RLS por completo.
// Solo para uso en Route Handlers / Server Actions que lo requieran
// explícitamente (ej. tareas administrativas). JAMÁS importar este
// archivo desde código que se ejecute o empaquete en el cliente (browser).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
