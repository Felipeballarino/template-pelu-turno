import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente de Supabase con la SERVICE ROLE KEY: ignora RLS por completo.
 *
 * Uso EXCLUSIVO en código de servidor de confianza (webhook de Mercado
 * Pago, route handlers de administración ya autenticados). Nunca importar
 * este archivo desde un Client Component ni exponer la key con el
 * prefijo NEXT_PUBLIC_.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
