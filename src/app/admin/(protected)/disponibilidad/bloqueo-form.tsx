"use client";

import { useState, useTransition } from "react";
import { hoyArgentina } from "@/lib/date";
import { construirLinkWhatsApp, construirMensajeBloqueoConflicto } from "@/lib/whatsapp";
import { crearBloqueo, verificarConflictosBloqueo } from "./actions";

export function BloqueoForm({ peluqueroId }: { peluqueroId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hoy = hoyArgentina();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const fecha = String(data.get("fecha") ?? "");
    const horaInicio = String(data.get("hora_inicio") ?? "");
    const horaFin = String(data.get("hora_fin") ?? "");

    startTransition(async () => {
      try {
        // Un peluquero no puede tener dos turnos activos superpuestos (lo
        // impide un constraint de la base), así que acá va a haber como
        // mucho un turno en conflicto con el horario que se quiere bloquear.
        const conflictos = await verificarConflictosBloqueo(peluqueroId, fecha, horaInicio, horaFin);

        if (conflictos.length > 0) {
          const detalle = conflictos
            .map((c) => `${c.nombreCliente} (${c.servicioNombre})`)
            .join(", ");
          const confirmado = confirm(
            `Ya hay un turno reservado en ese horario: ${detalle}. ¿Confirmás el bloqueo igual? El turno no se cancela solo — le avisamos al cliente por WhatsApp para que se contacte.`
          );
          if (!confirmado) return;
        }

        await crearBloqueo(data);

        for (const conflicto of conflictos) {
          const mensaje = construirMensajeBloqueoConflicto({
            nombreCliente: conflicto.nombreCliente,
            servicioNombre: conflicto.servicioNombre,
            fecha,
            horaInicio,
          });
          window.open(
            construirLinkWhatsApp(conflicto.telefonoCliente, mensaje),
            "_blank",
            "noopener,noreferrer"
          );
        }

        form.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el bloqueo.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="peluquero_id" value={peluqueroId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Fecha</label>
        <input
          type="date"
          name="fecha"
          required
          min={hoy}
          defaultValue={hoy}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
        <input
          type="time"
          name="hora_inicio"
          required
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
        <input
          type="time"
          name="hora_fin"
          required
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Motivo (opcional)</label>
        <input
          name="motivo"
          placeholder="Turno médico, etc."
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Bloquear"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
