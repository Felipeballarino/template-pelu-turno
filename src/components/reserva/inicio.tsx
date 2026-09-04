"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Peluquero, Servicio } from "@/types/database";
import type { AsignacionServicio } from "@/lib/reserva/servicios-peluquero";
import { FormasFlotantes } from "@/components/formas-flotantes";
import { ReservaForm } from "./reserva-form";
import { CancelarPorTelefono } from "./cancelar-por-telefono";

type Vista = "inicio" | "reservar" | "cancelar";

interface InicioProps {
  servicios: Servicio[];
  peluqueros: Peluquero[];
  asignaciones: AsignacionServicio[];
  mercadoPagoHabilitado: boolean;
}

export function Inicio(props: InicioProps) {
  const [vista, setVista] = useState<Vista>("inicio");

  // Al volver de Mercado Pago (?pago=exitoso|pendiente|fallido), se entra
  // directo a la vista de reserva para que muestre el banner del resultado
  // (ver el useEffect correspondiente en ReservaForm). Necesita ser un
  // efecto: window.location solo existe después de montar en el cliente.
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (parametros.get("pago")) setVista("reservar");
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-violet-50 via-white to-white">
      <AnimatePresence mode="wait">
        {vista === "reservar" && (
          <motion.div
            key="reservar"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ReservaForm {...props} onVolver={() => setVista("inicio")} />
          </motion.div>
        )}
        {vista === "cancelar" && (
          <motion.div
            key="cancelar"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <CancelarPorTelefono onVolver={() => setVista("inicio")} />
          </motion.div>
        )}
        {vista === "inicio" && (
          <motion.div
            key="inicio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center space-y-10 overflow-hidden px-6 py-8 text-center"
          >
            <FormasFlotantes />

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 16 }}
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl text-3xl text-white shadow-xl shadow-violet-300"
                style={{ background: "linear-gradient(145deg, #a78bfa, #7c3aed)" }}
              >
                ✂
              </motion.div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Turno <span className="italic text-violet-600">Pelu</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500">¿Qué querés hacer?</p>
            </motion.div>

            <motion.div
              className="relative space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                onClick={() => setVista("reservar")}
                className="w-full rounded-2xl px-4 py-4 text-base font-medium text-white shadow-xl shadow-violet-300"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
              >
                Reservar turno
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                onClick={() => setVista("cancelar")}
                className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-4 text-base font-medium text-gray-700 shadow-md backdrop-blur hover:bg-white"
              >
                Cancelar un turno
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
