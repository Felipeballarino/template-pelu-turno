import type { EstadoTurno } from "@/types/database";

export const ESTADO_ESTILOS: Record<EstadoTurno, string> = {
  pagado: "bg-emerald-100 text-emerald-700",
  pendiente_efectivo: "bg-amber-100 text-amber-700",
  cancelado: "bg-gray-100 text-gray-500",
};

export const ESTADO_LABELS: Record<EstadoTurno, string> = {
  pagado: "Pagado",
  pendiente_efectivo: "Pendiente (efectivo)",
  cancelado: "Cancelado",
};

export interface TurnoRowProps {
  id: string;
  peluqueroId: string;
  servicioId: string;
  peluqueroNombre: string;
  servicioNombre: string;
  nombreCliente: string;
  telefonoCliente: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoTurno;
  puedeRecordar: boolean;
  /** Turno de hoy dentro de su rango horario ahora mismo (no es un valor guardado en la base). */
  enCurso: boolean;
}
