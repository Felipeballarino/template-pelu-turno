"use client";

import { useState, useTransition } from "react";
import { DIAS_SEMANA, formatearHora } from "@/lib/date";
import { crearHorarioLaboral, eliminarHorariosLaborales } from "./actions";

const LUN_A_VIE = [1, 2, 3, 4, 5];
const TODOS = [0, 1, 2, 3, 4, 5, 6];

export interface ValoresHorario {
  dias: number[];
  horaInicio1: string;
  horaFin1: string;
  horaInicio2?: string;
  horaFin2?: string;
  /** ids de todas las filas del grupo que se está editando (todas sus franjas y días). */
  idsOriginales: string[];
}

interface HorarioFormProps {
  peluqueroId: string;
  valoresIniciales?: ValoresHorario;
  onCancelarEdicion?: () => void;
  onGuardado?: () => void;
}

export function HorarioForm({
  peluqueroId,
  valoresIniciales,
  onCancelarEdicion,
  onGuardado,
}: HorarioFormProps) {
  const [diasElegidos, setDiasElegidos] = useState<number[]>(valoresIniciales?.dias ?? LUN_A_VIE);
  const [segundaFranja, setSegundaFranja] = useState(Boolean(valoresIniciales?.horaInicio2));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleDia(dia: number) {
    setDiasElegidos((actual) =>
      actual.includes(dia) ? actual.filter((d) => d !== dia) : [...actual, dia].sort()
    );
  }

  function franjaFormData(horaInicio: string, horaFin: string): FormData {
    const fd = new FormData();
    fd.set("peluquero_id", peluqueroId);
    diasElegidos.forEach((d) => fd.append("dias_semana", String(d)));
    fd.set("hora_inicio", horaInicio);
    fd.set("hora_fin", horaFin);
    return fd;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const horaInicio1 = String(data.get("hora_inicio_1") ?? "");
    const horaFin1 = String(data.get("hora_fin_1") ?? "");
    const horaInicio2 = String(data.get("hora_inicio_2") ?? "");
    const horaFin2 = String(data.get("hora_fin_2") ?? "");

    if (diasElegidos.length === 0) {
      setError("Elegí al menos un día.");
      return;
    }

    startTransition(async () => {
      try {
        // Al editar, se borra primero el grupo completo que se estaba
        // editando (todos sus días y franjas) y recién después se crea la
        // nueva versión. Si solo confiáramos en el reemplazo por
        // superposición de crearHorarioLaboral, un día que se saca de la
        // selección (ej. sacar el viernes de "lunes a viernes") quedaría
        // con su franja vieja intacta, porque esa franja ya no se vuelve a
        // enviar para ese día.
        if (valoresIniciales) {
          await eliminarHorariosLaborales(valoresIniciales.idsOriginales);
        }
        await crearHorarioLaboral(franjaFormData(horaInicio1, horaFin1));
        if (segundaFranja) {
          await crearHorarioLaboral(franjaFormData(horaInicio2, horaFin2));
        }
        form.reset();
        setSegundaFranja(false);
        onGuardado?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el horario.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {valoresIniciales && (
        <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <span>Editando un horario existente.</span>
          <button
            type="button"
            onClick={onCancelarEdicion}
            className="font-medium underline hover:no-underline"
          >
            Cancelar edición
          </button>
        </div>
      )}

      {/* Días */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-600">Días</label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDiasElegidos(LUN_A_VIE)}
              className="text-gray-500 hover:text-gray-900"
            >
              Lun-Vie
            </button>
            <button
              type="button"
              onClick={() => setDiasElegidos(TODOS)}
              className="text-gray-500 hover:text-gray-900"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setDiasElegidos([])}
              className="text-gray-500 hover:text-gray-900"
            >
              Ninguno
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIAS_SEMANA.map((dia, i) => (
            <label
              key={dia}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                diasElegidos.includes(i)
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={diasElegidos.includes(i)}
                onChange={() => toggleDia(i)}
                className="sr-only"
              />
              {dia.slice(0, 3)}
            </label>
          ))}
        </div>
      </div>

      {/* Franja 1 */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Horario</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="time"
            name="hora_inicio_1"
            required
            defaultValue={valoresIniciales && formatearHora(valoresIniciales.horaInicio1)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <span className="text-sm text-gray-400">a</span>
          <input
            type="time"
            name="hora_fin_1"
            required
            defaultValue={valoresIniciales && formatearHora(valoresIniciales.horaFin1)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Franja 2 (opcional, para horario partido) */}
      {segundaFranja ? (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-600">
              Y también de (horario partido)
            </label>
            <button
              type="button"
              onClick={() => setSegundaFranja(false)}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              Quitar segunda franja
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              name="hora_inicio_2"
              required
              defaultValue={valoresIniciales?.horaInicio2 && formatearHora(valoresIniciales.horaInicio2)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
            <span className="text-sm text-gray-400">a</span>
            <input
              type="time"
              name="hora_fin_2"
              required
              defaultValue={valoresIniciales?.horaFin2 && formatearHora(valoresIniciales.horaFin2)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSegundaFranja(true)}
          className="text-sm text-gray-500 underline hover:text-gray-900"
        >
          + Agregar segunda franja (ej. horario partido con pausa al mediodía)
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending || diasElegidos.length === 0}
        className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
      >
        {pending ? "Guardando..." : valoresIniciales ? "Guardar cambios" : "Agregar"}
      </button>
    </form>
  );
}
