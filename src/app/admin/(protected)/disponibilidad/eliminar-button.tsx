"use client";

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
      className="text-red-600 hover:text-red-800"
    >
      Eliminar
    </button>
  );
}
