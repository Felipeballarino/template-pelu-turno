/** Aritmética simple sobre horarios "HH:MM", sin acceso a datos. */

export function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function formatearHHMM(minutos: number): string {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
