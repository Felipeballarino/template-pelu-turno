"use client";

import { useState } from "react";
import type { Peluquero, Servicio } from "@/types/database";
import { actualizarPeluquero, eliminarPeluquero } from "./actions";
import { ServiciosDelPeluquero } from "./servicios-del-peluquero";

interface PeluqueroRowProps {
  peluquero: Peluquero;
  servicios: Servicio[];
  serviciosAsignadosIds: string[];
}

export function PeluqueroRow({ peluquero, servicios, serviciosAsignadosIds }: PeluqueroRowProps) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <tr className="border-b">
        <td colSpan={5} className="px-4 py-3">
          <form
            action={async (formData) => {
              await actualizarPeluquero(peluquero.id, formData);
              setEditando(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              name="nombre"
              defaultValue={peluquero.nombre}
              required
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <input
              name="telefono_whatsapp"
              defaultValue={peluquero.telefono_whatsapp}
              required
              placeholder="5491122334455"
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input type="checkbox" name="activo" defaultChecked={peluquero.activo} />
              Activo
            </label>
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-800"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b">
      <td className="px-4 py-2 text-sm text-gray-900">{peluquero.nombre}</td>
      <td className="px-4 py-2 text-sm text-gray-600">{peluquero.telefono_whatsapp}</td>
      <td className="px-4 py-2">
        <ServiciosDelPeluquero
          peluqueroId={peluquero.id}
          servicios={servicios}
          asignadosIds={serviciosAsignadosIds}
        />
      </td>
      <td className="px-4 py-2 text-sm">
        <span
          className={
            peluquero.activo
              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
              : "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
          }
        >
          {peluquero.activo ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-4 py-2 text-right text-sm">
        <button
          onClick={() => setEditando(true)}
          className="mr-3 text-gray-600 hover:text-gray-900"
        >
          Editar
        </button>
        <button
          onClick={() => {
            if (confirm(`¿Eliminar a ${peluquero.nombre}? Esta acción no se puede deshacer.`)) {
              eliminarPeluquero(peluquero.id);
            }
          }}
          className="text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
}
