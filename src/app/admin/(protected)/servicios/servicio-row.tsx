"use client";

import { useState } from "react";
import type { Servicio } from "@/types/database";
import { actualizarServicio, eliminarServicio } from "./actions";

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function ServicioRow({ servicio }: { servicio: Servicio }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <tr className="border-b">
        <td colSpan={5} className="px-4 py-3">
          <form
            action={async (formData) => {
              await actualizarServicio(servicio.id, formData);
              setEditando(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              name="nombre"
              defaultValue={servicio.nombre}
              required
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <input
              name="duracion_minutos"
              type="number"
              min={1}
              defaultValue={servicio.duracion_minutos}
              required
              className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <input
              name="precio"
              type="number"
              min={0}
              step="0.01"
              defaultValue={servicio.precio}
              required
              className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input type="checkbox" name="activo" defaultChecked={servicio.activo} />
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
      <td className="px-4 py-2 text-sm text-gray-900">{servicio.nombre}</td>
      <td className="px-4 py-2 text-sm text-gray-600">{servicio.duracion_minutos} min</td>
      <td className="px-4 py-2 text-sm text-gray-600">{formatoPrecio.format(servicio.precio)}</td>
      <td className="px-4 py-2 text-sm">
        <span
          className={
            servicio.activo
              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
              : "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
          }
        >
          {servicio.activo ? "Activo" : "Inactivo"}
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
            if (confirm(`¿Eliminar "${servicio.nombre}"? Esta acción no se puede deshacer.`)) {
              eliminarServicio(servicio.id);
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
