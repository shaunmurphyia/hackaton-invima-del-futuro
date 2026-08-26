"use client";

import { useState } from "react";
import { actualizarExpediente } from "@/lib/invima/data";
import type { Expediente } from "@/lib/invima/types";

const COMPLIANCE_STATUS_LABEL: Record<string, string> = {
  CONFORME: "Conforme",
  EVALUADO_APTO_CON_OBSERVACIONES: "Apto con observaciones",
  REQUIERE_SUBSANACION: "Requiere subsanación",
  NO_CONFORME: "No conforme",
};

const CHECKPOINT_STATUS_LABEL: Record<string, string> = {
  COMPLIANT: "Cumple",
  WARNING: "Advertencia",
  ACTION_REQUIRED: "Acción requerida",
};

export function TriajeView({
  expedientes,
  onRefrescar,
}: {
  expedientes: Expediente[];
  onRefrescar: () => void;
}) {
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const pendientes = expedientes.filter((e) => e.estado === "en_triaje");

  async function extraerConIA(exp: Expediente) {
    if (!exp.dossier_texto) return;
    setProcesandoId(exp.id);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: exp.dossier_texto }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? "Error de extracción");

      await actualizarExpediente(exp.id, {
        principio_activo: datos.principio_activo,
        endpoints_clinicos: datos.endpoints_clinicos,
        especificaciones_calidad: datos.especificaciones_calidad,
      });
      onRefrescar();
    } finally {
      setProcesandoId(null);
    }
  }

  async function aprobarPreacta(exp: Expediente) {
    await actualizarExpediente(exp.id, {
      estado_preacta_validado: true,
      estado: "en_evaluacion",
    });
    onRefrescar();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        Bandeja de Triaje y Control de Admisión
      </h2>
      {pendientes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay expedientes pendientes de triaje.
        </p>
      )}
      {pendientes.map((exp) => (
        <div key={exp.id} className="glass-strong rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">{exp.producto_nombre}</p>
            <span className="text-xs text-muted-foreground">
              {exp.solicitante_email}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              {exp.formatos?.codigo}
            </span>
            <span className="gladwell-gradient rounded-full px-3 py-1 text-xs font-medium text-white">
              Sala {exp.formatos?.sala}
            </span>
          </div>

          <div className="glass mt-4 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Validación práctica INVIMA
            </h3>
            {exp.invima_compliance_json ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold text-foreground">
                    {exp.invima_compliance_score}%
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {COMPLIANCE_STATUS_LABEL[exp.invima_compliance_status ?? ""] ??
                      exp.invima_compliance_status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {exp.invima_compliance_json.productCategory}
                  </span>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {exp.invima_compliance_json.checkpoints.map((c) => (
                    <li key={c.code} className="text-xs">
                      <span className="font-medium text-foreground">
                        [{CHECKPOINT_STATUS_LABEL[c.status] ?? c.status}]{" "}
                      </span>
                      <span className="text-muted-foreground">
                        {c.requirement} — {c.details}
                      </span>
                    </li>
                  ))}
                </ul>
                {exp.invima_compliance_json.regulatoryRecommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Recomendaciones
                    </p>
                    <ul className="mt-1 list-disc pl-4">
                      {exp.invima_compliance_json.regulatoryRecommendations.map(
                        (r, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            {r}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Sin validación práctica disponible para este expediente (se
                calcula al radicar el dossier en PDF).
              </p>
            )}
          </div>

          {exp.principio_activo ? (
            <div className="modal-field mt-4 grid gap-2 text-sm">
              <p>
                <span className="text-muted-foreground">Principio activo: </span>
                {exp.principio_activo}
              </p>
              <p>
                <span className="text-muted-foreground">Endpoints clínicos: </span>
                {exp.endpoints_clinicos}
              </p>
              <p>
                <span className="text-muted-foreground">
                  Especificaciones de calidad:{" "}
                </span>
                {exp.especificaciones_calidad}
              </p>
            </div>
          ) : (
            <button
              onClick={() => extraerConIA(exp)}
              disabled={procesandoId === exp.id}
              className="gladwell-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg disabled:opacity-50"
            >
              {procesandoId === exp.id
                ? "Extrayendo con IA..."
                : "Extraer datos del e-CTD con IA"}
            </button>
          )}

          {exp.principio_activo && (
            <div className="mt-4">
              <button
                onClick={() => aprobarPreacta(exp)}
                className="rounded-full border border-border bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
              >
                Aprobar Preacta Digital → enviar a evaluación
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
