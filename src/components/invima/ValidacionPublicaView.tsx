"use client";

import { useState } from "react";
import { generarBlockchainHash } from "@/lib/crypto";
import { obtenerExpediente } from "@/lib/invima/data";
import { PrimaryButton, TextInput } from "./ui";

type Resultado = "vigente" | "no_coincide" | "no_encontrado" | null;

export function ValidacionPublicaView() {
  const [uuid, setUuid] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [nombreProducto, setNombreProducto] = useState<string | null>(null);

  async function validar() {
    setBuscando(true);
    setResultado(null);
    try {
      const exp = await obtenerExpediente(uuid.trim());
      if (!exp || !exp.blockchain_hash) {
        setResultado("no_encontrado");
        return;
      }

      const hashRecalculado = await generarBlockchainHash({
        id: exp.id,
        producto_nombre: exp.producto_nombre,
        principio_activo: exp.principio_activo ?? "",
        endpoints_clinicos: exp.endpoints_clinicos ?? "",
        especificaciones_calidad: exp.especificaciones_calidad ?? "",
        umbra_score_beneficio: exp.umbra_score_beneficio ?? 0,
        umbra_score_riesgo: exp.umbra_score_riesgo ?? 0,
      });

      setNombreProducto(exp.producto_nombre);
      setResultado(hashRecalculado === exp.blockchain_hash ? "vigente" : "no_coincide");
    } catch {
      setResultado("no_encontrado");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Portal RISP — Verificación Criptográfica Pública
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aduaneros, clínicas o distribuidores ingresan el UUID del expediente
          para verificar su vigencia y autenticidad en segundos.
        </p>
      </div>
      <div className="flex gap-2">
        <TextInput
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
          placeholder="UUID del expediente"
        />
        <PrimaryButton
          onClick={validar}
          disabled={buscando || !uuid.trim()}
          className="shrink-0"
        >
          {buscando ? "Validando..." : "Validar"}
        </PrimaryButton>
      </div>

      {resultado === "vigente" && (
        <div className="glass-strong rounded-2xl border border-accent/40 p-5 text-accent">
          <p className="font-semibold">DOCUMENTO AUTÉNTICO Y VIGENTE</p>
          <p className="text-sm text-foreground/80">{nombreProducto}</p>
        </div>
      )}
      {resultado === "no_coincide" && (
        <div className="glass-strong rounded-2xl border border-destructive/40 p-5 text-destructive">
          <p className="font-semibold">
            ADVERTENCIA: HASH NO COINCIDE O DOCUMENTO ALTERADO
          </p>
        </div>
      )}
      {resultado === "no_encontrado" && (
        <div className="glass-strong rounded-2xl border border-destructive/40 p-5 text-destructive">
          <p className="font-semibold">
            Expediente no encontrado o aún sin resolución firmada
          </p>
        </div>
      )}
    </div>
  );
}
