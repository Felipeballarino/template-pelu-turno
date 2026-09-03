/**
 * Utilidades de calendario semanal (lunes a domingo) sobre fechas
 * "de calendario" (YYYY-MM-DD, sin hora). Se trabaja siempre en UTC
 * internamente para hacer aritmética de días sin que la zona horaria
 * del servidor corra la fecha (ver también src/lib/date.ts).
 */

function parseFechaISO(fechaISO: string): Date {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function formatFechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function sumarDias(fechaISO: string, dias: number): string {
  const fecha = parseFechaISO(fechaISO);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return formatFechaISO(fecha);
}

/** Lunes de la semana que contiene `fechaISO`. */
export function inicioSemana(fechaISO: string): string {
  const fecha = parseFechaISO(fechaISO);
  const diaSemana = fecha.getUTCDay(); // 0 domingo ... 6 sábado
  const diasDesdeLunes = (diaSemana + 6) % 7;
  fecha.setUTCDate(fecha.getUTCDate() - diasDesdeLunes);
  return formatFechaISO(fecha);
}

export interface DiaSemana {
  fecha: string; // YYYY-MM-DD
  diaSemanaIndex: number; // 0 domingo ... 6 sábado (igual que Date.getDay())
}

/** Los 7 días (lunes a domingo) de la semana que contiene `fechaISO`. */
export function diasDeSemana(fechaISO: string): DiaSemana[] {
  const lunes = inicioSemana(fechaISO);
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    return { fecha, diaSemanaIndex: parseFechaISO(fecha).getUTCDay() };
  });
}

export interface DiaCalendario {
  fecha: string; // YYYY-MM-DD
  diaMes: number;
  delMesActual: boolean;
}

/** Primer día (YYYY-MM-01) del mes que contiene `fechaISO`. */
export function inicioMes(fechaISO: string): string {
  return `${fechaISO.slice(0, 7)}-01`;
}

export function mesSiguiente(fechaISO: string): string {
  const fecha = parseFechaISO(inicioMes(fechaISO));
  fecha.setUTCMonth(fecha.getUTCMonth() + 1);
  return formatFechaISO(fecha);
}

export function mesAnterior(fechaISO: string): string {
  const fecha = parseFechaISO(inicioMes(fechaISO));
  fecha.setUTCMonth(fecha.getUTCMonth() - 1);
  return formatFechaISO(fecha);
}

export function nombreMes(fechaISO: string): string {
  const fecha = parseFechaISO(inicioMes(fechaISO));
  const texto = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Grilla de 6 semanas (42 días, lunes a domingo) que cubre el mes de
 * `fechaISO`, incluyendo días del mes anterior/siguiente para completar
 * las semanas — el patrón habitual de un mini-calendario mensual.
 */
export function grillaMes(fechaISO: string): DiaCalendario[] {
  const mes = Number(fechaISO.slice(5, 7));
  const inicioGrilla = inicioSemana(inicioMes(fechaISO));
  return Array.from({ length: 42 }, (_, i) => {
    const fecha = sumarDias(inicioGrilla, i);
    return {
      fecha,
      diaMes: Number(fecha.slice(8, 10)),
      delMesActual: Number(fecha.slice(5, 7)) === mes,
    };
  });
}
