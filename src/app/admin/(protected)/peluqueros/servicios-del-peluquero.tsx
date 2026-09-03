"use client";

import { useTransition } from "react";
import type { Servicio } from "@/types/database";
import {
  establecerTodosLosServicios,
  quitarTodasLasAsignaciones,
  toggleServicioPeluquero,
} from "./actions";

export function ServiciosDelPeluquero({
  peluqueroId,
  servicios,
  asignadosIds,
}: {
  peluqueroId: string;
  servicios: Servicio[];
  asignadosIds: string[];
}) {
  const [pending, startTransition] = useTransition();
  const ofreceTodos = asignadosIds.length === 0;

  if (servicios.length === 0) {
    return (
      <p className="text-xs text-gray-400">Cargá servicios primero en la sección Servicios.</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={ofreceTodos}
          disabled={pending}
          onChange={(e) => {
            const marcado = e.target.checked;
            startTransition(async () => {
              if (marcado) {
                await quitarTodasLasAsignaciones(peluqueroId);
              } else {
                await establecerTodosLosServicios(
                  peluqueroId,
                  servicios.map((s) => s.id)
                );
              }
            });
          }}
        />
        Ofrece todos los servicios
      </label>

      {!ofreceTodos && (
        <div className="flex flex-wrap gap-1.5">
          {servicios.map((s) => {
            const asignado = asignadosIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await toggleServicioPeluquero(peluqueroId, s.id, !asignado);
                  })
                }
                className={`rounded-full border px-2.5 py-0.5 text-xs disabled:opacity-50 ${
                  asignado
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
