/**
 * Normaliza un teléfono argentino al formato que necesita wa.me:
 * 549 + código de área + número, sin 0 inicial ni "15".
 *
 * Se aplica del lado del servidor en el punto de guardado (no solo en el
 * formulario) para que quede bien sin importar cómo se haya escrito: con
 * o sin 0 adelante, con "54" pero sin el "9", ya completo, etc.
 */
export function normalizarTelefonoArgentino(input: string): string {
  let digitos = input.replace(/\D/g, "");

  if (digitos.startsWith("00")) digitos = digitos.slice(2);
  while (digitos.startsWith("0")) digitos = digitos.slice(1);

  if (digitos.startsWith("549")) return digitos;
  if (digitos.startsWith("54")) return `549${digitos.slice(2)}`;

  return `549${digitos}`;
}
