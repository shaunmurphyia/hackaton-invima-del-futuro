import { createClient } from "@/lib/supabase/client";
import type { Expediente, Formato, InvimaComplianceResult } from "./types";

const supabase = createClient();

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001/api/v1";

export async function evaluarConformidadInvima(
  archivo: File,
): Promise<InvimaComplianceResult> {
  const formData = new FormData();
  formData.append("file", archivo);

  const res = await fetch(`${BACKEND_URL}/documents/analyze-all`, {
    method: "POST",
    body: formData,
  });
  const respuesta = await res.json();
  if (!res.ok) {
    throw new Error(respuesta.message ?? "Error validando conformidad INVIMA");
  }
  return respuesta.data.invimaCompliance as InvimaComplianceResult;
}

export async function listarFormatos(): Promise<Formato[]> {
  const { data, error } = await supabase
    .from("formatos")
    .select("*")
    .order("codigo", { ascending: true });

  if (error) throw error;
  return data as Formato[];
}

export async function listarExpedientes(): Promise<Expediente[]> {
  const { data, error } = await supabase
    .from("expedientes")
    .select("*, formatos(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Expediente[];
}

export async function obtenerExpediente(id: string): Promise<Expediente | null> {
  const { data, error } = await supabase
    .from("expedientes")
    .select("*, formatos(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Expediente | null;
}

export async function crearExpediente(input: {
  producto_nombre: string;
  solicitante_email: string;
  dossier_texto: string;
  formato_codigo: string;
  invima_compliance_score?: number;
  invima_compliance_status?: string;
  invima_compliance_json?: InvimaComplianceResult;
}): Promise<Expediente> {
  const { data, error } = await supabase
    .from("expedientes")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Expediente;
}

export async function actualizarExpediente(
  id: string,
  cambios: Partial<Expediente>,
): Promise<Expediente> {
  const { data, error } = await supabase
    .from("expedientes")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Expediente;
}

export function suscribirseExpedientes(onChange: () => void) {
  const channel = supabase
    .channel("expedientes-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "expedientes" },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
