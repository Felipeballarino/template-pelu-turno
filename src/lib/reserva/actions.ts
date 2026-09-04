"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hoyArgentina, horaActualArgentinaEnMinutos } from "@/lib/date";
import { sumarDias } from "@/lib/semana";
import { indiceServiciosPorPeluquero, peluqueroOfreceServicio } from "./servicios-peluquero";
import { formatearHHMM, minutosDesdeMedianoche } from "./tiempo";
import { crearTurnoEnBaseDeDatos, type ResultadoCrearTurno } from "./crear-turno";

// Rango horario que se ofrece cuando un peluquero todavía no tiene cargado
// un horario semanal propio (ver horarios_laborales). Se puede ajustar acá
// si en general la peluquería abre en otro horario.
const RANGO_DEFAULT_INICIO = "09:00";
const RANGO_DEFAULT_FIN = "20:00";

// Cada cuántos minutos se ofrece un horario de inicio distinto.
const PASO_MINUTOS = 15;

interface Ventana {
  inicio: number;
  fin: number;
}

export interface SlotDisponible {
  hora: string; // "HH:MM"
  peluqueroId: string;
  peluqueroNombre: string;
}

export async function obtenerHorariosDisponibles(params: {
  peluqueroId: string; // "" = cualquiera disponible
  servicioId: string;
  fecha: string; // YYYY-MM-DD
  duracionMinutos: number;
}): Promise<SlotDisponible[]> {
  const supabase = createAdminClient();

  const [{ data: peluqueros }, { data: asignaciones }] = await Promise.all([
    supabase.from("peluqueros").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("peluquero_servicios").select("peluquero_id, servicio_id"),
  ]);
  const indiceServicios = indiceServiciosPorPeluquero(asignaciones ?? []);

  const candidatos = (peluqueros ?? []).filter((p) => {
    if (params.peluqueroId && p.id !== params.peluqueroId) return false;
    return peluqueroOfreceServicio(indiceServicios, p.id, params.servicioId);
  });

  if (candidatos.length === 0) return [];

  const idsCandidatos = candidatos.map((p) => p.id);
  // dia_semana: 0 domingo ... 6 sábado, mismo criterio que horarios_laborales.
  const diaSemana = new Date(`${params.fecha}T00:00:00Z`).getUTCDay();

  const [{ data: horarios }, { data: bloqueos }, { data: turnos }] = await Promise.all([
    supabase
      .from("horarios_laborales")
      .select("peluquero_id, dia_semana, hora_inicio, hora_fin")
      .in("peluquero_id", idsCandidatos),
    supabase
      .from("bloqueos")
      .select("peluquero_id, hora_inicio, hora_fin")
      .in("peluquero_id", idsCandidatos)
      .eq("fecha", params.fecha),
    supabase
      .from("turnos")
      .select("peluquero_id, hora_inicio, hora_fin")
      .in("peluquero_id", idsCandidatos)
      .eq("fecha", params.fecha)
      .neq("estado", "cancelado"),
  ]);

  const inicioDefault = minutosDesdeMedianoche(RANGO_DEFAULT_INICIO);
  const finDefault = minutosDesdeMedianoche(RANGO_DEFAULT_FIN);

  // Si la fecha elegida es hoy, no se ofrecen horarios que ya pasaron.
  const limiteInferior = params.fecha === hoyArgentina() ? horaActualArgentinaEnMinutos() : 0;

  const slots: SlotDisponible[] = [];

  for (const peluquero of candidatos) {
    const horariosPeluquero = (horarios ?? []).filter((h) => h.peluquero_id === peluquero.id);

    // Sin horario semanal cargado = disponible en el rango por defecto,
    // todos los días. Con horario cargado, solo se respetan sus ventanas
    // (y si no trabaja ese día de la semana, no hay ventanas = cerrado).
    const ventanas: Ventana[] =
      horariosPeluquero.length > 0
        ? horariosPeluquero
            .filter((h) => h.dia_semana === diaSemana)
            .map((h) => ({
              inicio: minutosDesdeMedianoche(h.hora_inicio),
              fin: minutosDesdeMedianoche(h.hora_fin),
            }))
        : [{ inicio: inicioDefault, fin: finDefault }];

    if (ventanas.length === 0) continue;

    const ocupados: Ventana[] = [
      ...(bloqueos ?? [])
        .filter((b) => b.peluquero_id === peluquero.id)
        .map((b) => ({
          inicio: minutosDesdeMedianoche(b.hora_inicio),
          fin: minutosDesdeMedianoche(b.hora_fin),
        })),
      ...(turnos ?? [])
        .filter((t) => t.peluquero_id === peluquero.id)
        .map((t) => ({
          inicio: minutosDesdeMedianoche(t.hora_inicio),
          fin: minutosDesdeMedianoche(t.hora_fin),
        })),
    ];

    for (const ventana of ventanas) {
      for (
        let inicio = ventana.inicio;
        inicio + params.duracionMinutos <= ventana.fin;
        inicio += PASO_MINUTOS
      ) {
        if (inicio < limiteInferior) continue;
        const fin = inicio + params.duracionMinutos;
        const seSuperpone = ocupados.some((o) => o.inicio < fin && o.fin > inicio);
        if (!seSuperpone) {
          slots.push({ hora: formatearHHMM(inicio), peluqueroId: peluquero.id, peluqueroNombre: peluquero.nombre });
        }
      }
    }
  }

  slots.sort((a, b) => a.hora.localeCompare(b.hora) || a.peluqueroNombre.localeCompare(b.peluqueroNombre));

  if (params.peluqueroId) return slots;

  // "Cualquiera disponible": si varios peluqueros están libres al mismo
  // horario, se ofrece una sola vez (se asigna al primero que aparezca).
  const vistos = new Set<string>();
  return slots.filter((s) => {
    if (vistos.has(s.hora)) return false;
    vistos.add(s.hora);
    return true;
  });
}

export interface SlotConFecha extends SlotDisponible {
  fecha: string;
}

/**
 * Busca los próximos horarios libres de un peluquero para un servicio,
 * explorando día por día a partir de `desdeFecha`. Se usa para sugerirle
 * alternativas a un cliente cuando el admin cancela su turno.
 */
export async function obtenerProximosHorariosDisponibles(params: {
  peluqueroId: string;
  servicioId: string;
  duracionMinutos: number;
  desdeFecha: string;
  cantidad?: number;
  diasAExplorar?: number;
}): Promise<SlotConFecha[]> {
  const cantidad = params.cantidad ?? 3;
  const diasAExplorar = params.diasAExplorar ?? 14;

  const resultado: SlotConFecha[] = [];
  let fecha = params.desdeFecha;
  for (let i = 0; i < diasAExplorar && resultado.length < cantidad; i++) {
    const slots = await obtenerHorariosDisponibles({
      peluqueroId: params.peluqueroId,
      servicioId: params.servicioId,
      fecha,
      duracionMinutos: params.duracionMinutos,
    });
    for (const s of slots) {
      resultado.push({ ...s, fecha });
      if (resultado.length >= cantidad) break;
    }
    fecha = sumarDias(fecha, 1);
  }
  return resultado;
}

export type ResultadoReserva = ResultadoCrearTurno;

/** Reserva pagando en efectivo en el local (turno queda pendiente_efectivo). */
export async function crearTurnoPublico(input: {
  servicioId: string;
  peluqueroId: string;
  fecha: string;
  horaInicio: string;
  nombreCliente: string;
  telefonoCliente: string;
}): Promise<ResultadoReserva> {
  return crearTurnoEnBaseDeDatos({ ...input, estado: "pendiente_efectivo" });
}
