"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Sin este archivo, un error al renderizar cualquier pantalla del panel
 * (turnos, calendario, etc.) dejaba la página en blanco sin ningún aviso.
 * Next.js usa este componente como boundary para toda la sección
 * /admin/(protected) cuando un Server o Client Component de esa sección
 * tira una excepción durante el render.
 */
export default function ErrorAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" strokeWidth={1.8} />
      <h1 className="text-base font-semibold text-gray-900">Algo salió mal</h1>
      <p className="max-w-sm text-sm text-gray-500">
        {error.message || "No se pudo cargar esta pantalla. Probá de nuevo."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
      >
        Reintentar
      </button>
    </div>
  );
}
