"use client";

import type { DiaSemana } from "@/lib/semana";
import type { EstadoTurno, HorarioLaboral } from "@/types/database";
import { DIAS_SEMANA, formatearHora } from "@/lib/date";
import { construirLinkWhatsApp, construirMensajeCancelacion } from "@/lib/whatsapp";
import type { CancelacionInfo } from "../turnos/actions";

// Rango horario que muestra la grilla. Se puede ajustar acá si una
// peluquería trabaja fuera de este rango (ej. hasta más tarde).
const HORA_INICIO_GRILLA = 8;
const HORA_FIN_GRILLA = 21;
const PX_POR_MINUTO = 1; // 60px por hora

const ALTO_GRILLA = (HORA_FIN_GRILLA - HORA_INICIO_GRILLA) * 60 * PX_POR_MINUTO;

function minutosDelDia(horaHHMMSS: string): number {
  const [h, m] = horaHHMMSS.split(":").map(Number);
  return h * 60 + m;
}

function clamp(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}

interface Bloque {
  inicio: number; // minutos desde medianoche
  fin: number;
}

/**
 * Tramos del día (dentro del rango de la grilla) en los que el peluquero
 * NO trabaja, a partir de su horario semanal. Si no tiene ningún horario
 * cargado, se considera disponible todo el rango (sin sombreado).
 */
function segmentosCerrados(diaSemanaIndex: number, horarios: HorarioLaboral[]): Bloque[] {
  if (horarios.length === 0) return [];

  const inicioGrilla = HORA_INICIO_GRILLA * 60;
  const finGrilla = HORA_FIN_GRILLA * 60;

  const ventanas = horarios
    .filter((h) => h.dia_semana === diaSemanaIndex)
    .map((h) => ({
      inicio: clamp(minutosDelDia(h.hora_inicio), inicioGrilla, finGrilla),
      fin: clamp(minutosDelDia(h.hora_fin), inicioGrilla, finGrilla),
    }))
    .filter((v) => v.fin > v.inicio)
    .sort((a, b) => a.inicio - b.inicio);

  const cerrados: Bloque[] = [];
  let cursor = inicioGrilla;
  for (const v of ventanas) {
    if (v.inicio > cursor) cerrados.push({ inicio: cursor, fin: v.inicio });
    cursor = Math.max(cursor, v.fin);
  }
  if (cursor < finGrilla) cerrados.push({ inicio: cursor, fin: finGrilla });
  return cerrados;
}

const ESTADO_COLOR: Record<EstadoTurno, string> = {
  pagado: "bg-green-100 border-green-400 text-green-800",
  pendiente_efectivo: "bg-amber-100 border-amber-400 text-amber-800",
  cancelado: "bg-gray-100 border-gray-300 text-gray-400 line-through",
};

export interface TurnoCalendario {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoTurno;
  nombre_cliente: string;
  servicioNombre: string;
}

export interface BloqueoCalendario {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string | null;
}

interface CalendarGridProps {
  dias: DiaSemana[];
  turnos: TurnoCalendario[];
  bloqueos: BloqueoCalendario[];
  horarios: HorarioLaboral[];
  onCancelarTurno: (id: string) => Promise<CancelacionInfo | null>;
}

export function CalendarGrid({
  dias,
  turnos,
  bloqueos,
  horarios,
  onCancelarTurno,
}: CalendarGridProps) {
  const horas = Array.from(
    { length: HORA_FIN_GRILLA - HORA_INICIO_GRILLA + 1 },
    (_, i) => HORA_INICIO_GRILLA + i
  );

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <div className="grid min-w-[880px] grid-cols-[56px_repeat(7,1fr)]">
        {/* Encabezado */}
        <div />
        {dias.map((dia) => (
          <div key={dia.fecha} className="border-b border-l px-2 py-2 text-center">
            <div className="text-xs font-medium uppercase text-gray-500">
              {DIAS_SEMANA[dia.diaSemanaIndex].slice(0, 3)}
            </div>
            <div className="text-sm font-semibold text-gray-900">{dia.fecha.slice(8, 10)}</div>
          </div>
        ))}

        {/* Columna de horas */}
        <div className="relative border-b" style={{ height: ALTO_GRILLA }}>
          {horas.map((h) => (
            <div
              key={h}
              className="absolute right-1 -translate-y-1/2 text-xs text-gray-400"
              style={{ top: (h - HORA_INICIO_GRILLA) * 60 * PX_POR_MINUTO }}
            >
              {h}:00
            </div>
          ))}
        </div>

        {/* Columnas de días */}
        {dias.map((dia) => {
          const cerrados = segmentosCerrados(dia.diaSemanaIndex, horarios);
          const turnosDelDia = turnos.filter((t) => t.fecha === dia.fecha);
          const bloqueosDelDia = bloqueos.filter((b) => b.fecha === dia.fecha);

          return (
            <div
              key={dia.fecha}
              className="relative border-b border-l"
              style={{
                height: ALTO_GRILLA,
                backgroundImage:
                  "repeating-linear-gradient(to bottom, transparent, transparent 59px, rgb(243 244 246) 59px, rgb(243 244 246) 60px)",
              }}
            >
              {cerrados.map((c, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 bg-gray-100"
                  style={{
                    top: (c.inicio - HORA_INICIO_GRILLA * 60) * PX_POR_MINUTO,
                    height: (c.fin - c.inicio) * PX_POR_MINUTO,
                  }}
                  title="Fuera de horario"
                />
              ))}

              {bloqueosDelDia.map((b) => {
                const inicio = clamp(
                  minutosDelDia(b.hora_inicio) - HORA_INICIO_GRILLA * 60,
                  0,
                  ALTO_GRILLA
                );
                const fin = clamp(
                  minutosDelDia(b.hora_fin) - HORA_INICIO_GRILLA * 60,
                  0,
                  ALTO_GRILLA
                );
                return (
                  <div
                    key={b.id}
                    className="absolute inset-x-0.5 overflow-hidden rounded border border-dashed border-gray-400 bg-[repeating-linear-gradient(45deg,rgb(229_231_235),rgb(229_231_235)_6px,rgb(209_213_219)_6px,rgb(209_213_219)_12px)] px-1 text-[11px] text-gray-600"
                    style={{ top: inicio, height: Math.max(fin - inicio, 14) }}
                    title={b.motivo ?? "Bloqueado"}
                  >
                    {b.motivo ?? "Bloqueado"}
                  </div>
                );
              })}

              {turnosDelDia.map((t) => {
                const inicio = clamp(
                  minutosDelDia(t.hora_inicio) - HORA_INICIO_GRILLA * 60,
                  0,
                  ALTO_GRILLA
                );
                const fin = clamp(
                  minutosDelDia(t.hora_fin) - HORA_INICIO_GRILLA * 60,
                  0,
                  ALTO_GRILLA
                );
                return (
                  <button
                    key={t.id}
                    onClick={async () => {
                      if (t.estado === "cancelado") return;
                      if (!confirm(`¿Cancelar el turno de ${t.nombre_cliente}?`)) return;
                      const info = await onCancelarTurno(t.id);
                      if (!info) return;
                      const mensaje = construirMensajeCancelacion(info);
                      window.open(
                        construirLinkWhatsApp(info.telefonoCliente, mensaje),
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                    className={`absolute inset-x-0.5 overflow-hidden rounded border px-1 text-left text-[11px] leading-tight ${ESTADO_COLOR[t.estado]}`}
                    style={{ top: inicio, height: Math.max(fin - inicio, 16) }}
                    title={`${t.nombre_cliente} · ${t.servicioNombre} · ${formatearHora(t.hora_inicio)}–${formatearHora(t.hora_fin)}`}
                  >
                    <span className="font-medium">{formatearHora(t.hora_inicio)}</span>{" "}
                    {t.nombre_cliente}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
