"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
      <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function IconoTurnos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoPeluqueros() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" />
      <path d="M4.5 20c0-3.5 3.4-6 7.5-6s7.5 2.5 7.5 6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function IconoServicios() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
      <circle cx="6" cy="6" r="2.3" stroke="currentColor" />
      <circle cx="6" cy="18" r="2.3" stroke="currentColor" />
      <path d="M8 7.3L19 18M8 16.7L19 6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function IconoDisponibilidad() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
      <path
        d="M8.5 12.3l2.2 2.2 4.8-4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoEstadisticas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
      <path d="M4.5 20V10M12 20V4M19.5 20v-7" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

const ITEMS = [
  { href: "/admin/calendario", label: "Calendario", Icono: IconoCalendario },
  { href: "/admin/turnos", label: "Turnos", Icono: IconoTurnos },
  { href: "/admin/peluqueros", label: "Peluqueros", Icono: IconoPeluqueros },
  { href: "/admin/servicios", label: "Servicios", Icono: IconoServicios },
  { href: "/admin/disponibilidad", label: "Horarios", Icono: IconoDisponibilidad },
  { href: "/admin/estadisticas", label: "Stats", Icono: IconoEstadisticas },
] as const;

/**
 * Navegación inferior tipo app, para el uso en celular (que es el
 * principal). En pantallas grandes se oculta y se usa la barra superior de
 * AdminLayout en su lugar.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="grid grid-cols-6">
        {ITEMS.map(({ href, label, Icono }) => {
          const activo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-0.5 py-2 text-[10px] transition-colors ${
                activo ? "text-violet-600" : "text-gray-400"
              }`}
            >
              {activo && (
                <motion.div
                  layoutId="bottom-nav-activo"
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-violet-600"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icono />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
