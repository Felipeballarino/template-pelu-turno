"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { FormasFlotantes } from "@/components/formas-flotantes";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {
    error: null,
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b from-violet-50 via-white to-white px-4">
      <FormasFlotantes />

      <motion.form
        action={formAction}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-sm space-y-4 rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-xl backdrop-blur"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 16 }}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white shadow-lg shadow-violet-300"
          style={{ background: "linear-gradient(145deg, #a78bfa, #7c3aed)" }}
        >
          ✂
        </motion.div>
        <h1 className="text-center text-xl font-semibold text-gray-900">
          Panel de administración
        </h1>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          disabled={pending}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-200 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
        >
          {pending ? "Ingresando..." : "Ingresar"}
        </motion.button>
      </motion.form>
    </div>
  );
}
