"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hoyArgentina } from "@/lib/date";
import { formatearHHMM, minutosDesdeMedianoche } from "./tiempo";
import type { EstadoTurno } from "@/types/database";

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

export interface TurnoParaCancelar {
  id: string;
  estado: EstadoTurno;
  servicioId: string;
  servicioNombre: string;
  duracionMinutos: number;
  peluqueroId: string;
  peluqueroNombre: string;
  peluqueroWhatsapp: string;
  nombreCliente: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

/**
 * Busca un turno por id para mostrarlo en la pantalla pública de
 * cancelación (/cancelar/[id]). El id de un turno es un UUID
 * impredecible: es lo único que protege este link, que se le manda al
 * cliente por WhatsApp al confirmar la reserva (ver reserva-form.tsx) —
 * no hay login de cliente en esta app.
 */
export async function obtenerTurnoParaCancelar(id: string): Promise<TurnoParaCancelar | null> {
  if (!id) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(
      "id, estado, fecha, hora_inicio, hora_fin, nombre_cliente, servicio_id, peluquero_id, servicios(nombre, duracion_minutos), peluqueros(nombre, telefono_whatsapp)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const servicio = Array.isArray(data.servicios) ? data.servicios[0] : data.servicios;
  const peluquero = Array.isArray(data.peluqueros) ? data.peluqueros[0] : data.peluqueros;

  return {
    id: data.id,
    estado: data.estado,
    servicioId: data.servicio_id,
    servicioNombre: servicio?.nombre ?? "—",
    duracionMinutos: servicio?.duracion_minutos ?? 30,
    peluqueroId: data.peluquero_id,
    peluqueroNombre: peluquero?.nombre ?? "—",
    peluqueroWhatsapp: peluquero?.telefono_whatsapp ?? "",
    nombreCliente: data.nombre_cliente,
    fecha: data.fecha,
    horaInicio: data.hora_inicio,
    horaFin: data.hora_fin,
  };
}

export interface TurnoBusqueda {
  id: string;
  nombreCliente: string;
  servicioId: string;
  servicioNombre: string;
  duracionMinutos: number;
  peluqueroId: string;
  peluqueroNombre: string;
  peluqueroWhatsapp: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

/**
 * Busca turnos activos y futuros por teléfono, para la pantalla de
 * "Cancelar un turno" (el cliente no tiene login, así que esto funciona
 * como identificación: el mismo teléfono que usó al reservar). Compara
 * solo dígitos para tolerar variaciones de formato (espacios, guiones,
 * con o sin código de país).
 */
export async function buscarTurnosPorTelefono(telefono: string): Promise<TurnoBusqueda[]> {
  const digitos = soloDigitos(telefono);
  if (digitos.length < 6) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, hora_fin, nombre_cliente, telefono_cliente, servicio_id, peluquero_id, servicios(nombre, duracion_minutos), peluqueros(nombre, telefono_whatsapp)"
    )
    .neq("estado", "cancelado")
    .gte("fecha", hoyArgentina())
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  return (data ?? [])
    .filter((t) => {
      const guardado = soloDigitos(t.telefono_cliente);
      return guardado.endsWith(digitos) || digitos.endsWith(guardado);
    })
    .map((t) => {
      const servicio = Array.isArray(t.servicios) ? t.servicios[0] : t.servicios;
      const peluquero = Array.isArray(t.peluqueros) ? t.peluqueros[0] : t.peluqueros;
      return {
        id: t.id,
        nombreCliente: t.nombre_cliente,
        servicioId: t.servicio_id,
        servicioNombre: servicio?.nombre ?? "—",
        duracionMinutos: servicio?.duracion_minutos ?? 30,
        peluqueroId: t.peluquero_id,
        peluqueroNombre: peluquero?.nombre ?? "—",
        peluqueroWhatsapp: peluquero?.telefono_whatsapp ?? "",
        fecha: t.fecha,
        horaInicio: t.hora_inicio,
        horaFin: t.hora_fin,
      };
    });
}

export interface ResultadoCancelacionCliente {
  ok: boolean;
  error?: string;
}

export async function cancelarTurnoCliente(id: string): Promise<ResultadoCancelacionCliente> {
  if (!id) return { ok: false, error: "Turno inválido." };

  const supabase = createAdminClient();

  const { data: turno } = await supabase.from("turnos").select("estado").eq("id", id).maybeSingle();
  if (!turno) return { ok: false, error: "No encontramos ese turno." };
  if (turno.estado === "cancelado") {
    return { ok: false, error: "Este turno ya estaba cancelado." };
  }

  const { error } = await supabase.from("turnos").update({ estado: "cancelado" }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo cancelar el turno. Probá de nuevo." };

  return { ok: true };
}

export interface ResultadoEdicionCliente {
  ok: boolean;
  error?: string;
  horaFin?: string;
}

/**
 * El cliente cambia el día/horario de su propio turno (mismo servicio y
 * peluquero), eligiendo entre los horarios libres que le ofrece la pantalla
 * de /cancelar/[id]. Igual que el resto de las acciones de esta pantalla,
 * no requiere login: el UUID del turno en la URL es lo que autoriza.
 */
export async function editarTurnoCliente(
  id: string,
  nuevaFecha: string,
  nuevaHoraInicio: string
): Promise<ResultadoEdicionCliente> {
  if (!id || !nuevaFecha || !nuevaHoraInicio) {
    return { ok: false, error: "Faltan datos para reprogramar el turno." };
  }

  const supabase = createAdminClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select("estado, fecha, servicios(duracion_minutos)")
    .eq("id", id)
    .maybeSingle();
  if (!turno) return { ok: false, error: "No encontramos ese turno." };
  if (turno.estado === "cancelado") {
    return { ok: false, error: "Este turno ya está cancelado." };
  }
  if (turno.fecha < hoyArgentina()) {
    return { ok: false, error: "Este turno ya pasó." };
  }

  const servicio = Array.isArray(turno.servicios) ? turno.servicios[0] : turno.servicios;
  const duracionMinutos = servicio?.duracion_minutos ?? 30;
  const horaFin = formatearHHMM(minutosDesdeMedianoche(nuevaHoraInicio) + duracionMinutos);

  const { error } = await supabase
    .from("turnos")
    .update({ fecha: nuevaFecha, hora_inicio: nuevaHoraInicio, hora_fin: horaFin })
    .eq("id", id);

  if (error) {
    // 23P01 = exclusion_violation (ver supabase/001_schema.sql).
    if (error.code === "23P01") {
      return { ok: false, error: "Ese horario se acaba de ocupar. Elegí otro." };
    }
    return { ok: false, error: "No se pudo reprogramar el turno. Probá de nuevo." };
  }

  return { ok: true, horaFin };
}
