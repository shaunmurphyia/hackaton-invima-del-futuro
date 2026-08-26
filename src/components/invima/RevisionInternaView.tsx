"use client";

import { useState } from "react";
import { EvaluacionView } from "./EvaluacionView";
import { TriajeView } from "./TriajeView";
import type { Expediente } from "@/lib/invima/types";

type SubTab = "admision" | "mesa_concurrente";

export function RevisionInternaView({
  expedientes,
  onRefrescar,
}: {
  expedientes: Expediente[];
  onRefrescar: () => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>("admision");

  return (
    <div className="flex flex-col gap-6">
      <div className="glass inline-flex w-fit gap-1 rounded-full p-1">
        <button
          onClick={() => setSubTab("admision")}
          className={
            subTab === "admision"
              ? "rounded-full bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground"
              : "rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
          }
        >
          Admisión y Triaje
        </button>
        <button
          onClick={() => setSubTab("mesa_concurrente")}
          className={
            subTab === "mesa_concurrente"
              ? "rounded-full bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground"
              : "rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
          }
        >
          Mesa Concurrente
        </button>
      </div>

      {subTab === "admision" ? (
        <TriajeView expedientes={expedientes} onRefrescar={onRefrescar} />
      ) : (
        <EvaluacionView expedientes={expedientes} onRefrescar={onRefrescar} />
      )}
    </div>
  );
}
