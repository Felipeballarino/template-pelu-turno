export const TIMEZONE = "America/Argentina/Buenos_Aires";

/**
 * Fecha de "hoy" en la zona horaria de Argentina, como string YYYY-MM-DD
 * (formato que usa la columna `fecha` de Postgres). No usar `new Date()`
 * .toISOString() directo: eso toma la fecha en UTC y puede desfasarse un
 * día respecto a Argentina.
 */
export function hoyArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatearFechaLarga(fechaISO: string): string {
  // fechaISO viene como "YYYY-MM-DD", un valor de calendario sin hora.
  // Se construye en UTC y se formatea también en UTC: así el día mostrado
  // es siempre el mismo que el guardado, sin importar en qué zona horaria
  // corra el servidor (evita que se corra un día por la conversión).
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(fecha);
}

export function formatearHora(horaHHMMSS: string): string {
  return horaHHMMSS.slice(0, 5); // "14:30:00" -> "14:30"
}

/** Hora actual en Argentina, en minutos desde medianoche (0-1439). */
export function horaActualArgentinaEnMinutos(): number {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const horas = Number(partes.find((p) => p.type === "hour")?.value ?? "0");
  const minutos = Number(partes.find((p) => p.type === "minute")?.value ?? "0");
  return horas * 60 + minutos;
}

// Índice 0 = domingo ... 6 = sábado, misma convención que Date.getDay()
// y que la columna `dia_semana` de horarios_laborales.
export const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

/**
 * Formatea un conjunto de días de la semana de forma compacta, ej.
 * [1,2,3,4,5] -> "Lunes a Viernes", [0,6] -> "Domingo, Sábado".
 * Reconoce rangos consecutivos comunes para no listar día por día.
 */
export function formatearDias(diasSemanaIndices: number[]): string {
  const dias = [...new Set(diasSemanaIndices)].sort((a, b) => a - b);
  const clave = dias.join(",");

  if (clave === "0,1,2,3,4,5,6") return "Todos los días";
  if (clave === "1,2,3,4,5") return "Lunes a Viernes";
  if (clave === "0,6") return "Sábados y domingos";

  return dias.map((d) => DIAS_SEMANA[d]).join(", ");
}
