import { DIAS_SEMANA } from "@/lib/date";
import { DiaHorario, type Franja } from "./dia-horario";
import type { HorarioLaboral } from "@/types/database";

// Orden de visualización: Lunes a Domingo (los índices de dia_semana en la
// base siguen la convención de Date.getDay(): 0 = Domingo).
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

export function HorariosSection({
  peluqueroId,
  horarios,
}: {
  peluqueroId: string;
  horarios: HorarioLaboral[];
}) {
  const porDia = new Map<number, Franja[]>();
  for (const h of horarios) {
    const lista = porDia.get(h.dia_semana) ?? [];
    lista.push({ id: h.id, hora_inicio: h.hora_inicio, hora_fin: h.hora_fin });
    porDia.set(h.dia_semana, lista);
  }
  for (const lista of porDia.values()) {
    lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }

  return (
    <div className="space-y-2.5">
      {ORDEN_DIAS.map((dia) => (
        <DiaHorario
          key={dia}
          peluqueroId={peluqueroId}
          diaIndex={dia}
          nombreDia={DIAS_SEMANA[dia]}
          franjas={porDia.get(dia) ?? []}
        />
      ))}
    </div>
  );
}
