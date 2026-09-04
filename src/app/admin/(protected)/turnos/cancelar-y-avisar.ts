import { construirLinkWhatsApp, construirMensajeCancelacion, construirMensajeRecordatorio } from "@/lib/whatsapp";
import { cancelarTurno, marcarRecordatorioEnviado } from "./actions";

/**
 * Cancela un turno y le avisa al cliente por WhatsApp con horarios
 * alternativos. Compartido entre TurnoRow (tabla, escritorio) y TurnoCard
 * (tarjeta, celular) para no duplicar la lógica.
 */
export async function cancelarYAvisar(id: string, nombreCliente: string) {
  if (!confirm(`¿Cancelar el turno de ${nombreCliente}?`)) return;
  const info = await cancelarTurno(id);
  if (!info) return;
  const mensaje = construirMensajeCancelacion(info);
  window.open(construirLinkWhatsApp(info.telefonoCliente, mensaje), "_blank", "noopener,noreferrer");
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
}) {
  const linkCancelacion = `${window.location.origin}/cancelar/${params.id}`;
  const mensaje = construirMensajeRecordatorio({
    nombreCliente: params.nombreCliente,
    servicioNombre: params.servicioNombre,
    horaInicio: params.horaInicio,
    linkCancelacion,
  });
  window.open(construirLinkWhatsApp(params.telefonoCliente, mensaje), "_blank", "noopener,noreferrer");
  await marcarRecordatorioEnviado(params.id);
}
