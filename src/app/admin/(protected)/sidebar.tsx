"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ListChecks,
  Users,
  Scissors,
  Clock,
  BarChart3,
  LogOut,
} from "lucide-react";

const ITEMS = [
  { href: "/admin/calendario", label: "Calendario", Icono: CalendarDays },
  { href: "/admin/turnos", label: "Turnos", Icono: ListChecks },
  { href: "/admin/peluqueros", label: "Peluqueros", Icono: Users },
  { href: "/admin/servicios", label: "Servicios", Icono: Scissors },
  { href: "/admin/disponibilidad", label: "Disponibilidad", Icono: Clock },
  { href: "/admin/estadisticas", label: "Estadísticas", Icono: BarChart3 },
] as const;

/**
 * Sidebar fijo para escritorio. En celular no se renderiza: se usa BottomNav.
 */
export function Sidebar({
  userEmail,
  logout,
}: {
  userEmail: string | undefined;
  logout: () => void | Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-gray-200 bg-white sm:flex">
      <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
        <span className="text-lg font-semibold text-gray-900">
          Turno <span className="italic text-violet-600">Pelu</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ITEMS.map(({ href, label, Icono }) => {
          const activo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activo
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {activo && (
                <motion.div
                  layoutId="sidebar-activo"
                  className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-violet-600"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icono className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <form action={logout}>
          <button
            type="submit"
            title={userEmail}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            <span className="flex min-w-0 flex-col">
              <span>Cerrar sesión</span>
              {userEmail && (
                <span className="truncate text-xs text-gray-400">{userEmail}</span>
              )}
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}
