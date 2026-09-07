"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Revalida la página actual cada `intervaloMs` mientras está abierta, sin
 * intervención del usuario. Se usa en pantallas cuyos datos cambian solos
 * con el paso del tiempo (ej. turnos que pasan a "pagado" al terminar su
 * horario) para que no dependan de que alguien recargue o navegue.
 */
export function AutoRefresh({ intervaloMs = 60_000 }: { intervaloMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervaloMs);
    return () => clearInterval(id);
  }, [router, intervaloMs]);

  return null;
}
