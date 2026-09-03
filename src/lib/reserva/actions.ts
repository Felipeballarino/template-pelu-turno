"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hoyArgentina, horaActualArgentinaEnMinutos } from "@/lib/date";
import { sumarDias } from "@/lib/semana";
import { indiceServiciosPorPeluquero, peluqueroOfreceServicio } from "./servicios-peluquero";

// Rango horario que se ofrece cuando un peluquero todavía no tiene cargado
// un horario semanal propio (ver horarios_laborales). Se puede ajustar acá
// si en general la peluquería abre en otro horario.
const RANGO_DEFAULT_INICIO = "09:00";
const RANGO_DEFAULT_FIN = "20:00";

// Cada cuántos minutos se ofrece un horario de inicio distinto.
const PASO_MINUTOS = 15;

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function formatearHHMM(minutos: number): string {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

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

export interface ResultadoReserva {
  ok: boolean;
  error?: string;
  turno?: {
    peluqueroNombre: string;
    peluqueroWhatsapp: string;
    servicioNombre: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    nombreCliente: string;
  };
}

export async function crearTurnoPublico(input: {
  servicioId: string;
  peluqueroId: string;
  fecha: string;
  horaInicio: string;
  nombreCliente: string;
  telefonoCliente: string;
}): Promise<ResultadoReserva> {
  const nombreCliente = input.nombreCliente.trim();
  const telefonoCliente = input.telefonoCliente.trim();

  if (
    !input.servicioId ||
    !input.peluqueroId ||
    !input.fecha ||
    !input.horaInicio ||
    !nombreCliente ||
    !telefonoCliente
  ) {
    return { ok: false, error: "Faltan datos para confirmar el turno." };
  }

  const supabase = createAdminClient();

  const { data: servicio, error: errorServicio } = await supabase
    .from("servicios")
    .select("nombre, duracion_minutos")
    .eq("id", input.servicioId)
    .single();
  if (errorServicio || !servicio) {
    return { ok: false, error: "El servicio elegido ya no está disponible." };
  }

  const { data: peluquero, error: errorPeluquero } = await supabase
    .from("peluqueros")
    .select("nombre, telefono_whatsapp")
    .eq("id", input.peluqueroId)
    .single();
  if (errorPeluquero || !peluquero) {
    return { ok: false, error: "El peluquero elegido ya no está disponible." };
  }

  const { data: asignacionesPeluquero } = await supabase
    .from("peluquero_servicios")
    .select("peluquero_id, servicio_id")
    .eq("peluquero_id", input.peluqueroId);
  const indiceServicios = indiceServiciosPorPeluquero(asignacionesPeluquero ?? []);
  if (!peluqueroOfreceServicio(indiceServicios, input.peluqueroId, input.servicioId)) {
    return { ok: false, error: "Ese peluquero no ofrece el servicio elegido." };
  }

  const horaFin = formatearHHMM(
    minutosDesdeMedianoche(input.horaInicio) + servicio.duracion_minutos
  );

  const { error: errorInsert } = await supabase.from("turnos").insert({
    peluquero_id: input.peluqueroId,
    servicio_id: input.servicioId,
    nombre_cliente: nombreCliente,
    telefono_cliente: telefonoCliente,
    fecha: input.fecha,
    hora_inicio: input.horaInicio,
    hora_fin: horaFin,
    estado: "pendiente_efectivo",
  });

  if (errorInsert) {
    // 23P01 = exclusion_violation: el constraint turnos_no_solapados
    // (supabase/001_schema.sql) frenó un choque de horarios porque otro
    // cliente reservó ese mismo horario un instante antes.
    if (errorInsert.code === "23P01") {
      return { ok: false, error: "Ese horario se acaba de ocupar. Elegí otro, por favor." };
    }
    return { ok: false, error: "No se pudo confirmar el turno. Probá de nuevo." };
  }

  return {
    ok: true,
    turno: {
      peluqueroNombre: peluquero.nombre,
      peluqueroWhatsapp: peluquero.telefono_whatsapp,
      servicioNombre: servicio.nombre,
      fecha: input.fecha,
      horaInicio: input.horaInicio,
      horaFin,
      nombreCliente,
    },
  };
}
