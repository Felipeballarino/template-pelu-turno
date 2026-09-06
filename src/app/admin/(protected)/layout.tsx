import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

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
    <div className="min-h-screen bg-gray-50 sm:bg-white">
      <Sidebar userEmail={user.email} logout={logout} />

      {/* Header solo en celular: en escritorio el sidebar ya muestra la marca */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur sm:hidden">
        <span className="text-sm font-semibold text-gray-900">
          Turno <span className="italic text-violet-600">Pelu</span>
        </span>
      </header>

      <main className="px-4 py-6 pb-24 sm:ml-64 sm:px-8 sm:py-8 sm:pb-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
