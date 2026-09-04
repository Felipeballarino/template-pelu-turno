import { formatearFechaLarga, formatearHora } from "./date";

/** Acepta "HH:MM" o "HH:MM:SS" y siempre devuelve "HH:MM". */
function normalizarHora(hora: string): string {
  return formatearHora(hora.length === 5 ? `${hora}:00` : hora);
}

export function construirLinkWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

export interface AlternativaTurno {
  fecha: string;
  hora: string;
}

/**
 * Mensaje al cliente cuando el admin cancela su turno desde el panel,
 * ofreciendo otros horarios libres del mismo peluquero si hay.
 */
export function construirMensajeCancelacion(params: {
  nombreCliente: string;
  servicioNombre: string;
  fecha: string;
  horaInicio: string;
  alternativas: AlternativaTurno[];
}): string {
  const fechaTexto = formatearFechaLarga(params.fecha);
  const horaTexto = normalizarHora(params.horaInicio);

  let mensaje = `Hola ${params.nombreCliente}! Te escribimos de la peluquería: tuvimos que cancelar tu turno de ${params.servicioNombre} del ${fechaTexto} a las ${horaTexto}hs, disculpá las molestias.`;

  if (params.alternativas.length > 0) {
    const lista = params.alternativas
      .map((a) => `${formatearFechaLarga(a.fecha)} a las ${normalizarHora(a.hora)}hs`)
      .join(", ");
    mensaje += ` Estos horarios están libres si querés reprogramar: ${lista}.`;
  } else {
    mensaje += " Escribinos para coordinar un nuevo horario.";
  }

  return mensaje;
}

/**
 * Mensaje al cliente cuando el admin bloquea un horario que ya tenía su
 * turno reservado (ver verificarConflictosBloqueo).
 */
export function construirMensajeBloqueoConflicto(params: {
  nombreCliente: string;
  servicioNombre: string;
  fecha: string;
  horaInicio: string;
}): string {
  const fechaTexto = formatearFechaLarga(params.fecha);
  const horaTexto = normalizarHora(params.horaInicio);
  return `Hola ${params.nombreCliente}! Te escribimos de la peluquería: surgió un inconveniente con tu turno de ${params.servicioNombre} del ${fechaTexto} a las ${horaTexto}hs. Contactanos para reprogramarlo, disculpá las molestias.`;
}

/**
 * Recordatorio que el peluquero le manda al cliente unas horas antes del
 * turno (ver botón "Recordar" en /admin/turnos), con el link para que el
 * cliente lo cancele él mismo si no puede ir.
 */
export function construirMensajeRecordatorio(params: {
  nombreCliente: string;
  servicioNombre: string;
  horaInicio: string;
  linkCancelacion: string;
}): string {
  const horaTexto = normalizarHora(params.horaInicio);
  return `Hola ${params.nombreCliente}! Te recordamos tu turno de ${params.servicioNombre} hoy a las ${horaTexto}hs. Si no podés venir, cancelalo acá: ${params.linkCancelacion}`;
}
