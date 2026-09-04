import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";
import { BottomNav } from "./bottom-nav";

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
    <div className="min-h-screen bg-linear-to-b from-violet-50/40 via-white to-white">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Nav de escritorio: en celular se usa la barra inferior (BottomNav) */}
          <nav className="hidden gap-4 text-sm font-medium text-gray-600 sm:flex">
            <Link href="/admin/calendario" className="hover:text-violet-600">
              Calendario
            </Link>
            <Link href="/admin/turnos" className="hover:text-violet-600">
              Turnos
            </Link>
            <Link href="/admin/peluqueros" className="hover:text-violet-600">
              Peluqueros
            </Link>
            <Link href="/admin/servicios" className="hover:text-violet-600">
              Servicios
            </Link>
            <Link href="/admin/disponibilidad" className="hover:text-violet-600">
              Disponibilidad
            </Link>
          </nav>
          <span className="text-sm font-semibold text-gray-900 sm:hidden">
            Turno <span className="italic text-violet-600">Pelu</span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-violet-600"
              title={user.email}
            >
              <span className="hidden sm:inline">Cerrar sesión ({user.email})</span>
              <span className="sm:hidden">Salir</span>
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}
