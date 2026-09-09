"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export function EliminarButton({
  confirmMessage,
  onDelete,
}: {
  confirmMessage: string;
  onDelete: () => void | Promise<void>;
}) {
  const [eliminando, setEliminando] = useState(false);

  async function handleClick() {
    if (!confirm(confirmMessage)) return;
    setEliminando(true);
    try {
      await onDelete();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={eliminando}
      title="Eliminar"
      className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className={`h-4 w-4 ${eliminando ? "animate-pulse" : ""}`} strokeWidth={1.8} />
    </button>
  );
}
