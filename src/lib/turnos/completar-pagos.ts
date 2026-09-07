import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { hoyArgentina, horaActualArgentinaEnMinutos } from "@/lib/date";
import { formatearHHMM } from "@/lib/reserva/tiempo";

/**
 * Se paga en efectivo AL FINALIZAR el turno (no hay cobro online para esos
 * casos), así que un turno "pendiente_efectivo" cuyo horario ya terminó se
 * considera cobrado: se pasa a "pagado" automáticamente. Se llama al
 * principio de cada página que lista turnos (turnos, calendario,
 * estadísticas) para que el estado esté siempre al día sin depender de que
 * el admin lo marque a mano ni de un cron aparte.
 */
export async function marcarTurnosPasadosComoPagados(supabase: SupabaseClient<Database>) {
  const hoy = hoyArgentina();
  const horaActual = formatearHHMM(horaActualArgentinaEnMinutos());

  const { error } = await supabase
    .from("turnos")
    .update({ estado: "pagado" })
    .eq("estado", "pendiente_efectivo")
    .or(`fecha.lt.${hoy},and(fecha.eq.${hoy},hora_fin.lte.${horaActual})`);

  if (error) {
    // No es crítico para poder ver la página: si falla, los turnos
    // simplemente se ven como "pendiente" un rato más.
    console.error("No se pudieron marcar turnos pasados como pagados:", error.message);
  }
}
