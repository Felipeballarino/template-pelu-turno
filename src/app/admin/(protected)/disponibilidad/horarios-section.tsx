"use client";

import { useRef, useState } from "react";
import { formatearDias, formatearHora } from "@/lib/date";
import { eliminarHorariosLaborales } from "./actions";
import { EliminarButton } from "./eliminar-button";
import { HorarioForm, type ValoresHorario } from "./horario-form";

export interface FranjaGrupo {
  hora_inicio: string;
  hora_fin: string;
  ids: string[];
}

export interface GrupoHorario {
  dias: number[];
  franjas: FranjaGrupo[];
}

function claveGrupo(g: GrupoHorario): string {
  return g.dias.join(",");
}

export function HorariosSection({
  peluqueroId,
  grupos,
}: {
  peluqueroId: string;
  grupos: GrupoHorario[];
}) {
  const [edicion, setEdicion] = useState<{ clave: string; valores: ValoresHorario } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function editarGrupo(g: GrupoHorario) {
    const [franja1, franja2] = g.franjas;
    setEdicion({
      clave: claveGrupo(g),
      valores: {
        dias: g.dias,
        horaInicio1: franja1.hora_inicio,
        horaFin1: franja1.hora_fin,
        horaInicio2: franja2?.hora_inicio,
        horaFin2: franja2?.hora_fin,
        idsOriginales: g.franjas.flatMap((f) => f.ids),
      },
    });
    // Lleva la vista al formulario para que sea obvio qué se está editando,
    // sobre todo si la tabla de horarios es larga.
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div ref={formRef}>
        <HorarioForm
          key={edicion?.clave ?? "nuevo"}
          peluqueroId={peluqueroId}
          valoresIniciales={edicion?.valores}
          onCancelarEdicion={() => setEdicion(null)}
          onGuardado={() => setEdicion(null)}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Día</th>
              <th className="px-4 py-2 text-xs font-medium uppercase text-gray-500">Horario</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {grupos.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">
                  Sin horario fijo cargado (disponible siempre).
                </td>
              </tr>
            )}
            {grupos.map((g) => {
              const clave = claveGrupo(g);
              const idsDelGrupo = g.franjas.flatMap((f) => f.ids);
              const textoHorario = g.franjas
                .map((f) => `${formatearHora(f.hora_inicio)}–${formatearHora(f.hora_fin)}`)
                .join(" y ");
              return (
                <tr key={clave} className="border-b">
                  <td className="px-4 py-2 text-sm text-gray-900">{formatearDias(g.dias)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{textoHorario}</td>
                  <td className="px-4 py-2 text-right text-sm">
                    <button
                      onClick={() => editarGrupo(g)}
                      className="mr-3 text-gray-600 hover:text-gray-900"
                    >
                      Editar
                    </button>
                    <EliminarButton
                      confirmMessage={`¿Eliminar el horario de ${formatearDias(g.dias)} (${textoHorario})?`}
                      onDelete={() => {
                        if (edicion?.clave === clave) setEdicion(null);
                        eliminarHorariosLaborales(idsDelGrupo);
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
