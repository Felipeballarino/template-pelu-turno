"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hoyArgentina } from "@/lib/date";
import type { EstadoTurno } from "@/types/database";

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

export interface TurnoParaCancelar {
  id: string;
  estado: EstadoTurno;
  servicioNombre: string;
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
      "id, estado, fecha, hora_inicio, hora_fin, nombre_cliente, servicios(nombre), peluqueros(nombre, telefono_whatsapp)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const servicio = Array.isArray(data.servicios) ? data.servicios[0] : data.servicios;
  const peluquero = Array.isArray(data.peluqueros) ? data.peluqueros[0] : data.peluqueros;

  return {
    id: data.id,
    estado: data.estado,
    servicioNombre: servicio?.nombre ?? "—",
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
  servicioNombre: string;
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
      "id, fecha, hora_inicio, hora_fin, telefono_cliente, servicios(nombre), peluqueros(nombre, telefono_whatsapp)"
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
        servicioNombre: servicio?.nombre ?? "—",
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
