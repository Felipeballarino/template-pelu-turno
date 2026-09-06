"use client";

import { Trash2 } from "lucide-react";

export function EliminarButton({
  confirmMessage,
  onDelete,
}: {
  confirmMessage: string;
  onDelete: () => void | Promise<void>;
}) {
  return (
    <button
      onClick={() => {
        if (confirm(confirmMessage)) onDelete();
      }}
      title="Eliminar"
      className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
    </button>
  );
}
