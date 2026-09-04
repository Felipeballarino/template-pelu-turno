"use client";

import { useState } from "react";
import { formatearHora } from "@/lib/date";
import { cancelarYAvisar, recordarYMarcar } from "./cancelar-y-avisar";
import type { EstadoTurno } from "@/types/database";

export const ESTADO_ESTILOS: Record<EstadoTurno, string> = {
  pagado: "bg-green-100 text-green-700",
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
  peluqueroNombre: string;
  servicioNombre: string;
  nombreCliente: string;
  telefonoCliente: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoTurno;
  puedeRecordar: boolean;
}

/** Fila de tabla — se usa en pantallas grandes (ver TurnoCard para celular). */
export function TurnoRow({
  id,
  peluqueroNombre,
  servicioNombre,
  nombreCliente,
  telefonoCliente,
  horaInicio,
  horaFin,
  estado,
  puedeRecordar,
}: TurnoRowProps) {
  const [recordado, setRecordado] = useState(false);

  return (
    <tr className="border-b">
      <td className="px-4 py-2 text-sm text-gray-900">
        {formatearHora(horaInicio)}–{formatearHora(horaFin)}
      </td>
      <td className="px-4 py-2 text-sm text-gray-600">{peluqueroNombre}</td>
      <td className="px-4 py-2 text-sm text-gray-600">{servicioNombre}</td>
      <td className="px-4 py-2 text-sm text-gray-900">
        {nombreCliente}
        <div className="text-xs text-gray-400">{telefonoCliente}</div>
      </td>
      <td className="px-4 py-2 text-sm">
        <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO_ESTILOS[estado]}`}>
          {ESTADO_LABELS[estado]}
        </span>
      </td>
      <td className="px-4 py-2 text-right text-sm">
        <div className="flex items-center justify-end gap-3">
          {(puedeRecordar || recordado) && (
            <button
              disabled={recordado}
              onClick={() => {
                recordarYMarcar({ id, nombreCliente, telefonoCliente, servicioNombre, horaInicio });
                setRecordado(true);
              }}
              className="text-amber-600 hover:text-amber-800 disabled:text-gray-300"
            >
              {recordado ? "Recordado ✓" : "Recordar"}
            </button>
          )}
          {estado !== "cancelado" && (
            <button
              onClick={() => cancelarYAvisar(id, nombreCliente)}
              className="text-red-600 hover:text-red-800"
            >
              Cancelar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
