"use client";

import { formatearHora } from "@/lib/date";
import { construirLinkWhatsApp, construirMensajeCancelacion } from "@/lib/whatsapp";
import { cancelarTurno } from "./actions";
import type { EstadoTurno } from "@/types/database";

const ESTADO_ESTILOS: Record<EstadoTurno, string> = {
  pagado: "bg-green-100 text-green-700",
  pendiente_efectivo: "bg-amber-100 text-amber-700",
  cancelado: "bg-gray-100 text-gray-500",
};

const ESTADO_LABELS: Record<EstadoTurno, string> = {
  pagado: "Pagado",
  pendiente_efectivo: "Pendiente (efectivo)",
  cancelado: "Cancelado",
};

interface TurnoRowProps {
  id: string;
  peluqueroNombre: string;
  servicioNombre: string;
  nombreCliente: string;
  telefonoCliente: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoTurno;
}

export function TurnoRow({
  id,
  peluqueroNombre,
  servicioNombre,
  nombreCliente,
  telefonoCliente,
  horaInicio,
  horaFin,
  estado,
}: TurnoRowProps) {
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
        {estado !== "cancelado" && (
          <button
            onClick={async () => {
              if (!confirm(`¿Cancelar el turno de ${nombreCliente}?`)) return;
              const info = await cancelarTurno(id);
              if (!info) return;
              // Se avisa al cliente por WhatsApp, ofreciéndole otros
              // horarios libres del mismo peluquero si los hay.
              const mensaje = construirMensajeCancelacion(info);
              window.open(
                construirLinkWhatsApp(info.telefonoCliente, mensaje),
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="text-red-600 hover:text-red-800"
          >
            Cancelar
          </button>
        )}
      </td>
    </tr>
  );
}
