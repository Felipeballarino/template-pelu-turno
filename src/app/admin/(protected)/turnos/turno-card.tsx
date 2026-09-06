"use client";

import { useState } from "react";
import { Bell, X, Phone, Pencil } from "lucide-react";
import { formatearHora } from "@/lib/date";
import { cancelarYAvisar, recordarYMarcar } from "./cancelar-y-avisar";
import { ESTADO_ESTILOS, ESTADO_LABELS, type TurnoRowProps } from "./turno-row";
import { EditarTurnoForm } from "./editar-turno-form";
import type { Peluquero, Servicio } from "@/types/database";
import type { AsignacionServicio } from "@/lib/reserva/servicios-peluquero";

interface TurnoCardProps extends TurnoRowProps {
  peluqueros: Peluquero[];
  servicios: Servicio[];
  asignaciones: AsignacionServicio[];
}

/** Tarjeta de turno, usada tanto en celular como en escritorio. */
export function TurnoCard({
  id,
  peluqueroId,
  servicioId,
  peluqueroNombre,
  servicioNombre,
  nombreCliente,
  telefonoCliente,
  fecha,
  horaInicio,
  horaFin,
  estado,
  puedeRecordar,
  enCurso,
  peluqueros,
  servicios,
  asignaciones,
}: TurnoCardProps) {
  const [recordado, setRecordado] = useState(false);
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <EditarTurnoForm
        turnoId={id}
        nombreCliente={nombreCliente}
        servicios={servicios}
        peluqueros={peluqueros}
        asignaciones={asignaciones}
        servicioIdInicial={servicioId}
        peluqueroIdInicial={peluqueroId}
        fechaInicial={fecha}
        horaInicioInicial={horaInicio}
        onCancelar={() => setEditando(false)}
        onGuardado={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Horario destacado */}
      <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-violet-50 py-2 text-violet-700">
        <span className="text-sm font-semibold leading-tight">{formatearHora(horaInicio)}</span>
        <span className="text-[11px] leading-tight text-violet-400">
          {formatearHora(horaFin)}
        </span>
      </div>

      {/* Cliente y servicio */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{nombreCliente}</p>
        <p className="truncate text-sm text-gray-500">{servicioNombre}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400">
          <span className="truncate">{peluqueroNombre}</span>
          <span aria-hidden>·</span>
          <Phone className="h-3 w-3 shrink-0" strokeWidth={1.8} />
          {telefonoCliente}
        </p>
      </div>

      {/* Estado + acciones */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {enCurso && (
          <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blue-600" />
            En curso
          </span>
        )}
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_ESTILOS[estado]}`}
        >
          {ESTADO_LABELS[estado]}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {(puedeRecordar || recordado) && (
            <button
              disabled={recordado}
              onClick={() => {
                recordarYMarcar({ id, nombreCliente, telefonoCliente, servicioNombre, horaInicio });
                setRecordado(true);
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              <Bell className="h-3.5 w-3.5" strokeWidth={1.8} />
              {recordado ? "Recordado" : "Recordar"}
            </button>
          )}
          {estado !== "cancelado" && (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
              Editar
            </button>
          )}
          {estado !== "cancelado" && (
            <button
              onClick={() => cancelarYAvisar(id, nombreCliente)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.8} />
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
