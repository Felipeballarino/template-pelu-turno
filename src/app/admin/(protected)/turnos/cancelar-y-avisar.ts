import {
  abrirPestanaEnBlanco,
  completarPestanaWhatsApp,
  construirMensajeCancelacion,
  construirMensajeRecordatorio,
} from "@/lib/whatsapp";
import { cancelarTurno, marcarRecordatorioEnviado } from "./actions";

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

/**
 * Cancela un turno y le avisa al cliente por WhatsApp con horarios
 * alternativos. Usado desde TurnoCard.
 */
export async function cancelarYAvisar(id: string, nombreCliente: string): Promise<ResultadoAccion> {
  if (!confirm(`¿Cancelar el turno de ${nombreCliente}?`)) return { ok: false };

  const pestana = abrirPestanaEnBlanco();
  try {
    const info = await cancelarTurno(id);
    if (!info) {
      pestana?.close();
      return { ok: false, error: "No se encontró el turno." };
    }
    completarPestanaWhatsApp(pestana, info.telefonoCliente, construirMensajeCancelacion(info));
    return { ok: true };
  } catch (e) {
    pestana?.close();
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo cancelar el turno." };
  }
}

/**
 * Abre WhatsApp con el recordatorio del turno (con link para que el
 * cliente lo cancele si hace falta) y marca que ya se mandó, para no
 * ofrecerlo de nuevo. No hay envío automático real (ver charla sobre
 * costo/trámite de la API de WhatsApp Business) — esto es la alternativa
 * gratuita: un toque del peluquero.
 */
export async function recordarYMarcar(params: {
  id: string;
  nombreCliente: string;
  telefonoCliente: string;
  servicioNombre: string;
  horaInicio: string;
}): Promise<ResultadoAccion> {
  const pestana = abrirPestanaEnBlanco();
  try {
    const linkCancelacion = `${window.location.origin}/cancelar/${params.id}`;
    const mensaje = construirMensajeRecordatorio({
      nombreCliente: params.nombreCliente,
      servicioNombre: params.servicioNombre,
      horaInicio: params.horaInicio,
      linkCancelacion,
    });
    completarPestanaWhatsApp(pestana, params.telefonoCliente, mensaje);
    await marcarRecordatorioEnviado(params.id);
    return { ok: true };
  } catch (e) {
    pestana?.close();
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo marcar el recordatorio." };
  }
}
