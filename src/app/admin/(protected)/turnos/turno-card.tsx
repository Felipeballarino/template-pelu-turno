"use client";

import { useState } from "react";
import { formatearHora } from "@/lib/date";
import { cancelarYAvisar, recordarYMarcar } from "./cancelar-y-avisar";
import { ESTADO_ESTILOS, ESTADO_LABELS, type TurnoRowProps } from "./turno-row";

/** Tarjeta pensada para celular — ver TurnoRow para la versión de tabla. */
export function TurnoCard({
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
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="w-14 shrink-0 text-sm font-semibold text-gray-900">
          {formatearHora(horaInicio)}
          <div className="text-xs font-normal text-gray-400">{formatearHora(horaFin)}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{nombreCliente}</p>
          <p className="text-xs text-gray-500">{servicioNombre}</p>
          <p className="text-xs text-gray-400">
            {peluqueroNombre} · {telefonoCliente}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${ESTADO_ESTILOS[estado]}`}
          >
            {ESTADO_LABELS[estado]}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {(puedeRecordar || recordado) && (
          <button
            disabled={recordado}
            onClick={() => {
              recordarYMarcar({ id, nombreCliente, telefonoCliente, servicioNombre, horaInicio });
              setRecordado(true);
            }}
            className="text-xs font-medium text-amber-600 active:text-amber-800 disabled:text-gray-300"
          >
            {recordado ? "Recordado ✓" : "Recordar"}
          </button>
        )}
        {estado !== "cancelado" && (
          <button
            onClick={() => cancelarYAvisar(id, nombreCliente)}
            className="text-xs font-medium text-red-600 active:text-red-800"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
