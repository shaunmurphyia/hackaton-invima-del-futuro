"use client";

import { useState } from "react";
import { generarBlockchainHash } from "@/lib/crypto";
import { actualizarExpediente } from "@/lib/invima/data";
import type { Expediente } from "@/lib/invima/types";
import { Field, PrimaryButton, Section } from "./ui";

export function DecisionView({
  expedientes,
  onRefrescar,
}: {
  expedientes: Expediente[];
  onRefrescar: () => void;
}) {
  const [firmando, setFirmando] = useState<string | null>(null);
  const [scores, setScores] = useState<
    Record<string, { beneficio: string; riesgo: string }>
  >({});
  const listosParaFirma = expedientes.filter(
    (e) =>
      e.estado === "en_evaluacion" &&
      e.aprobado_seguridad &&
      e.aprobado_legal &&
      e.aprobado_calidad,
  );

  function setScore(expId: string, campo: "beneficio" | "riesgo", valor: string) {
    setScores((prev) => ({
      ...prev,
      [expId]: { ...prev[expId], [campo]: valor },
    }));
  }

  async function firmarResolucion(exp: Expediente) {
    const score = scores[exp.id];
    const umbra_score_beneficio = Number(score?.beneficio);
    const umbra_score_riesgo = Number(score?.riesgo);
    if (
      !umbra_score_beneficio ||
      !umbra_score_riesgo ||
      umbra_score_beneficio < 1 ||
      umbra_score_beneficio > 100 ||
      umbra_score_riesgo < 1 ||
      umbra_score_riesgo > 100
    ) {
      return;
    }

    setFirmando(exp.id);
    try {
      const hash = await generarBlockchainHash({
        id: exp.id,
        producto_nombre: exp.producto_nombre,
        principio_activo: exp.principio_activo ?? "",
        endpoints_clinicos: exp.endpoints_clinicos ?? "",
        especificaciones_calidad: exp.especificaciones_calidad ?? "",
        umbra_score_beneficio,
        umbra_score_riesgo,
      });

      await actualizarExpediente(exp.id, {
        umbra_score_beneficio,
        umbra_score_riesgo,
        blockchain_hash: hash,
        estado: "aprobado",
      });
      onRefrescar();
    } finally {
      setFirmando(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Panel de Firma de Resolución y Acta PAR/SBA
        </h2>
        {listosParaFirma.length === 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            No hay expedientes con las 3 firmas concurrentes completas.
          </p>
        )}
      </div>
      {listosParaFirma.map((exp) => (
        <div key={exp.id} className="flex flex-col gap-4">
          <p className="font-medium text-foreground">{exp.producto_nombre}</p>
          <Section>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Beneficio (UMBRA) 1-100">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={scores[exp.id]?.beneficio ?? ""}
                  onChange={(e) => setScore(exp.id, "beneficio", e.target.value)}
                  className="modal-field"
                />
              </Field>
              <Field label="Riesgo (UMBRA) 1-100">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={scores[exp.id]?.riesgo ?? ""}
                  onChange={(e) => setScore(exp.id, "riesgo", e.target.value)}
                  className="modal-field"
                />
              </Field>
            </div>
          </Section>
          <p className="text-xs text-muted-foreground">
            Balance cuantitativo beneficio-riesgo — Value Tree UMBRA, rastro de
            auditoría QoDoS.
          </p>
          <PrimaryButton
            onClick={() => firmarResolucion(exp)}
            disabled={
              firmando === exp.id ||
              !scores[exp.id]?.beneficio ||
              !scores[exp.id]?.riesgo
            }
            className="self-start"
          >
            {firmando === exp.id
              ? "Firmando y anclando hash..."
              : "Aprobar y firmar resolución"}
          </PrimaryButton>
        </div>
      ))}
    </div>
  );
}
