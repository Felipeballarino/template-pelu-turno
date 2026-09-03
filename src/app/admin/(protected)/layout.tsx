import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege /admin, pero validamos también acá por si
  // este layout se renderiza en un contexto donde el middleware no corrió.
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex gap-4 text-sm font-medium text-gray-600">
            <Link href="/admin/calendario" className="hover:text-gray-900">
              Calendario
            </Link>
            <Link href="/admin/turnos" className="hover:text-gray-900">
              Turnos
            </Link>
            <Link href="/admin/peluqueros" className="hover:text-gray-900">
              Peluqueros
            </Link>
            <Link href="/admin/servicios" className="hover:text-gray-900">
              Servicios
            </Link>
            <Link href="/admin/disponibilidad" className="hover:text-gray-900">
              Disponibilidad
            </Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">
              Cerrar sesión ({user.email})
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
