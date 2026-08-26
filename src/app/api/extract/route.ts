import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/ai/openai";

const extraccionSchema = z.object({
  producto_nombre: z
    .string()
    .describe("Nombre comercial o código de investigación del medicamento"),
  principio_activo: z
    .string()
    .describe("Nombre científico del ingrediente activo (IFA)"),
  endpoints_clinicos: z
    .string()
    .describe(
      "Puntos finales de eficacia clínica, tasa de éxito y población analizada",
    ),
  especificaciones_calidad: z
    .string()
    .describe(
      "Límites de pureza, método de síntesis o condiciones de conservación",
    ),
});

export async function POST(req: Request) {
  try {
    const { textContent } = await req.json();

    if (!textContent) {
      return NextResponse.json(
        { error: "Contenido del e-CTD vacío" },
        { status: 400 },
      );
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: extraccionSchema,
      system: `Eres un agente regulador farmacéutico especializado en el e-CTD (Electronic Common Technical Document).
Tu tarea es analizar el texto extraído del Módulo 2 (Resumen Clínico y Calidad) y estructurar los metadatos para la Preacta Digital.
Si un dato no está en el texto, escribe "No especificado en el dossier". No inventes nada.`,
      prompt: textContent,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Error en extracción por IA:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
