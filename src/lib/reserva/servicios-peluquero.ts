/**
 * Funciones puras (sin acceso a datos) para saber qué peluquero ofrece qué
 * servicio, a partir de las filas de peluquero_servicios. Se usan tanto en
 * server actions como en componentes de cliente, por eso van separadas de
 * lib/reserva/actions.ts (que sí tiene "use server").
 */

export interface AsignacionServicio {
  peluquero_id: string;
  servicio_id: string;
}

export type IndiceServiciosPorPeluquero = Map<string, Set<string>>;

export function indiceServiciosPorPeluquero(
  asignaciones: AsignacionServicio[]
): IndiceServiciosPorPeluquero {
  const indice: IndiceServiciosPorPeluquero = new Map();
  for (const a of asignaciones) {
    const set = indice.get(a.peluquero_id) ?? new Set<string>();
    set.add(a.servicio_id);
    indice.set(a.peluquero_id, set);
  }
  return indice;
}

/**
 * Un peluquero sin ninguna asignación cargada se considera que ofrece
 * TODOS los servicios (compatibilidad hacia atrás). En cuanto tiene al
 * menos una asignación, solo ofrece esos servicios explícitamente.
 */
export function peluqueroOfreceServicio(
  indice: IndiceServiciosPorPeluquero,
  peluqueroId: string,
  servicioId: string
): boolean {
  const asignados = indice.get(peluqueroId);
  if (!asignados || asignados.size === 0) return true;
  return asignados.has(servicioId);
}
