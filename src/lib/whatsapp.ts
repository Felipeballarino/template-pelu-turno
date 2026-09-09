import { formatearFechaLarga, formatearHora } from "./date";

/** Acepta "HH:MM" o "HH:MM:SS" y siempre devuelve "HH:MM". */
function normalizarHora(hora: string): string {
  return formatearHora(hora.length === 5 ? `${hora}:00` : hora);
}

export function construirLinkWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Abre una pestaña en blanco YA (sincrónicamente, dentro del gesto del
 * usuario que la dispara) para completarle la URL de WhatsApp más
 * adelante con `completarPestanaWhatsApp`, una vez que se sepa (por
 * ejemplo, después de esperar la respuesta de una acción del servidor).
 *
 * Si en cambio se llama a window.open() recién después de un await,
 * algunos navegadores ya no lo consideran parte del gesto directo del
 * usuario y lo bloquean en silencio, sin avisar — por eso conviene
 * abrirla antes y completarla después, en vez de construir la URL final
 * primero y abrir recién al final.
 *
 * No se le pasan las flags "noopener"/"noreferrer" a window.open porque
 * con ellas el navegador siempre devuelve null (no habría cómo
 * completarle la URL después); en su lugar se corta `opener` a mano acá
 * mismo, que logra el mismo efecto de seguridad.
 */
export function abrirPestanaEnBlanco(): Window | null {
  const pestana = window.open("", "_blank");
  if (pestana) pestana.opener = null;
  return pestana;
}

/** Completa (o cierra, si `telefono` es null) una pestaña abierta con abrirPestanaEnBlanco. */
export function completarPestanaWhatsApp(
  pestana: Window | null,
  telefono: string | null | undefined,
  mensaje: string
) {
  if (!pestana) return;
  if (!telefono) {
    pestana.close();
    return;
  }
  pestana.location.href = construirLinkWhatsApp(telefono, mensaje);
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
 * Mensaje al cliente cuando el admin reprograma su turno desde el panel
 * (cambia día, horario, peluquero o servicio) sin que el cliente lo pida.
 */
export function construirMensajeReprogramacion(params: {
  nombreCliente: string;
  servicioNombre: string;
  fecha: string;
  horaInicio: string;
}): string {
  const fechaTexto = formatearFechaLarga(params.fecha);
  const horaTexto = normalizarHora(params.horaInicio);
  return `Hola ${params.nombreCliente}! Te escribimos de la peluquería: te reprogramamos tu turno de ${params.servicioNombre} para el ${fechaTexto} a las ${horaTexto}hs. Cualquier inconveniente, avisanos.`;
}

/**
 * Mensaje al PELUQUERO cuando es el cliente el que cambia el día/horario de
 * su propio turno (desde /cancelar/[id] o desde "Cambiar o cancelar un
 * turno" buscando por teléfono en la home).
 */
export function construirMensajeAvisoPeluqueroReprogramacion(params: {
  peluqueroNombre: string;
  nombreCliente: string;
  servicioNombre: string;
  fechaAnterior: string;
  horaInicioAnterior: string;
  fechaNueva: string;
  horaInicioNueva: string;
}): string {
  const fechaAnteriorTexto = formatearFechaLarga(params.fechaAnterior);
  const horaAnteriorTexto = normalizarHora(params.horaInicioAnterior);
  const fechaNuevaTexto = formatearFechaLarga(params.fechaNueva);
  const horaNuevaTexto = normalizarHora(params.horaInicioNueva);

  return `Hola ${params.peluqueroNombre}! Soy ${params.nombreCliente}, cambié mi turno de ${params.servicioNombre} del ${fechaAnteriorTexto} a las ${horaAnteriorTexto}hs para el ${fechaNuevaTexto} a las ${horaNuevaTexto}hs.`;
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
  return `Hola ${params.nombreCliente}! Te recordamos tu turno de ${params.servicioNombre} hoy a las ${horaTexto}hs. Si no podés venir o querés cambiar el horario, entrá acá: ${params.linkCancelacion}`;
}
