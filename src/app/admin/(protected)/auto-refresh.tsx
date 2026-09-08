"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Revalida la página actual cada `intervaloMs` mientras está abierta, sin
 * intervención del usuario. Se usa en pantallas cuyos datos cambian por
 * otra persona (ej. un cliente reservando desde la web pública) o solos
 * con el paso del tiempo (ej. turnos que pasan a "pagado" al terminar su
 * horario), para que no dependan de que alguien recargue o navegue.
 *
 * Además de la revalidación periódica, se refresca apenas la pestaña
 * vuelve a estar visible/enfocada: si alguien deja el panel abierto en
 * segundo plano, el navegador frena los timers y la próxima actualización
 * podría tardar; al volver a mirarla, conviene que ya esté al día.
 */
export function AutoRefresh({ intervaloMs = 20_000 }: { intervaloMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervaloMs);

    function alVolverAEstarVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", alVolverAEstarVisible);
    window.addEventListener("focus", alVolverAEstarVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolverAEstarVisible);
      window.removeEventListener("focus", alVolverAEstarVisible);
    };
  }, [router, intervaloMs]);

  return null;
}
