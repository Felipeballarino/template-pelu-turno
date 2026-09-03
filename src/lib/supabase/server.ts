import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cliente de Supabase para usar en Server Components, Server Actions y
 * Route Handlers. Lee/escribe la sesión vía cookies (necesario para el
 * login del rol "peluquero" en el paso 3). Usa la anon key: respeta RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar: ocurre cuando setAll es invocado desde un
            // Server Component. Es inofensivo si hay middleware refrescando
            // la sesión (lo agregamos si sumamos login de peluqueros).
          }
        },
      },
    }
  );
}
