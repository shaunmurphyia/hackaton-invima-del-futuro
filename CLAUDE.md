System Prompt & Developer Blueprint: MVP de Modernización Regulatoria (v2)
Este archivo está diseñado para ser cargado en Cursor como contexto global (.cursorrules o claude-v2.md) para guiar a la IA en la construcción de un MVP interactivo de 2 horas. Define de forma explícita el rol de los 5 tipos de usuarios en el flujo, el esquema de datos en Supabase, el endpoint de extracción de OpenAI y los prompts para diseñar una UI que permita alternar dinámicamente entre los diferentes perfiles.

1. Visión General del Proyecto
El objetivo es construir un prototipo de una sola página (Next.js, Tailwind CSS, Supabase, OpenAI API) que demuestre de extremo a extremo cómo el flujo optimizado reduce tiempos, elimina cuellos de botella y reemplaza los silos secuenciales por trabajo concurrentemente seguro.

2. Los 5 Roles de Usuario del Sistema
Para que el MVP sea verdaderamente interactivo y demuestre el flujo real, la UI debe incluir un Selector de Rol en la cabecera para simular la experiencia de cada actor:

1. Solicitante / Fabricante (Usuario Externo) [2]
Misión: Radicar expedientes técnicos y subsanar inconsistencias.
Acciones en el MVP:
Carga el Módulo 2 del e-CTD (simulado con un archivo de texto o cuadro de texto).
Monitorea el triaje y recibe rechazos automáticos preventivos si falta información obligatoria.
Responde a solicitudes de subsanación dentro de un límite estricto de máximo 2 ciclos (ZAZIBONA).
Pantalla/UI: Portal de Radicación Digital.
2. Administrador de Admisión y Triaje (Superusuario Interno) [2]
Misión: Supervisar la admisión automatizada y validar la extracción de datos por IA.
Acciones en el MVP:
Monitorea el estado de completitud validado por el RIMS en menos de 5 días (simulado).
Verifica y confirma la clasificación inteligente de priorización (Ruta Acelerada vs. Ruta Ordinaria).
Revisa la extracción automática de datos clínicos del e-CTD Módulo 2 generada por el modelo de OpenAI y autoriza el borrador de la Preacta Digital para enviarlo a evaluación.
Pantalla/UI: Bandeja de Triaje y Control de Admisión.
3. Evaluadores Técnicos Concurrentes (Mesa Técnica - Interno) [2]
Misión: Analizar el expediente en paralelo bajo una sola plataforma unificada eliminando silos.
Acciones en el MVP:
Tres sub-roles (Seguridad, Legal, y Calidad y Eficacia) acceden de forma concurrente al mismo expediente desde el día 1.
Usan plantillas homogéneas (GRevP) para redactar y guardar sus firmas/conceptos favorables.
Emiten requerimientos consolidados de subsanación si es necesario (afectando el contador de ciclos).
Pantalla/UI: Consola de Evaluación Paralela.
4. Tomador de Decisión / Firmantes Autorizados (Comité / Delegado - Interno) [2]
Misión: Emitir la resolución científica final utilizando marcos metodológicos sin sesgos.
Acciones en el MVP:
Utiliza un formulario estructurado de balance cuantitativo beneficio-riesgo basado en el Value Tree de UMBRA y el rastro de auditoría científica QoDoS.
Enruta casos de alta complejidad a Comisiones Científicas, o autoriza de forma delegada/automática los casos estandarizados.
Su firma activa el Smart Contract condicional (If/Then) para acuñar el hash inmutable.
Pantalla/UI: Panel de Firma de Resolución y Acta PAR/SBA.
5. Entidades de Validación Externa (Consulta - Externo) [3]
Misión: Validar en tiempo real la vigencia y autenticidad del registro sanitario sin papeles.
Acciones en el MVP:
Consultas públicas rápidas ejecutadas por aduaneros (VUCE/DIAN), clínicas, hospitales o distribuidores.
Arrastran el PDF del acta o ingresan el ID para verificar si el hash coincide criptográficamente en menos de 5 segundos.
Pantalla/UI: Portal RISP Público de Verificación Criptográfica.
3. Modelo de Datos de Supabase (SQL)
Ejecuta este script en el SQL Editor de Supabase. El modelo centraliza los datos extraídos, el control de los 5 usuarios/firmas, el límite de ciclos ZAZIBONA y el anclaje criptográfico:

-- Crear tabla de expedientes (RIMS Centralizado)
create table public.expedientes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  producto_nombre text not null,
  solicitante_email text not null,

  -- Clasificación de Priorización (Administrador de Triaje)
  ruta_evaluacion text default 'ordinaria' check (ruta_evaluacion in ('ordinaria', 'acelerada')),

  -- Datos clínicos extraídos por el Agente de IA (e-CTD Módulo 2)
  principio_activo text,
  endpoints_clinicos text,
  especificaciones_calidad text,
  estado_preacta_validado boolean default false, -- Aprobación del Admin de Triaje

  -- Estado de la Evaluación Concurrente (Mesa Técnica Paralela)
  aprobado_seguridad boolean default false,
  aprobado_legal boolean default false,
  aprobado_calidad boolean default false,
  comentario_seguridad text,
  comentario_legal text,
  comentario_calidad text,

  -- Control de Deficiency Cycles (Regla ZAZIBONA Max 2 ciclos)
  ciclos_subsanacion integer default 0,
  solicitud_subsanacion_activa boolean default false,

  -- Decisión Científica Final (Tomador de Decisión - UMBRA Score)
  umbra_score_beneficio integer check (umbra_score_beneficio between 1 and 100),
  umbra_score_riesgo integer check (umbra_score_riesgo between 1 and 100),
  metodo_firma text default 'delegada' check (metodo_firma in ('delegada', 'comite_pleno')),

  -- Anclaje Blockchain e Inmutabilidad
  blockchain_hash text,
  estado text default 'en_triaje'::text check (estado in ('en_triaje', 'en_evaluacion', 'subsanando', 'aprobado', 'rechazado')),

  -- Métricas para el Dashboard de Demostración
  tiempo_admision_segundos integer,
  tiempo_evaluacion_segundos integer
);

-- Habilitar tiempo real para actualizaciones dinámicas de la interfaz
alter table public.expedientes replica identity full;
4. Endpoint del Agente de Extracción (Next.js API Route)
Estructura el endpoint en app/api/extract/route.ts utilizando la API de OpenAI con gpt-4o-mini para auto-generar la preacta del administrador:

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { textContent } = await req.json();

    if (!textContent) {
      return NextResponse.json({ error: 'Contenido del e-CTD vacío' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1, // Consistencia en datos científicos y técnicos
      response_format: { type: \"json_object\" },
      messages: [
        {
          role: 'system',
          content: `Eres un agente regulador farmacéutico especializado en el e-CTD (Electronic Common Technical Document).
Tu tarea es analizar el texto extraído del Módulo 2 (Resumen Clínico y Calidad) y estructurar los metadatos para la Preacta Digital.\nDebes extraer estrictamente los siguientes campos y retornar un objeto JSON plano:\n{\n  \"producto_nombre\": \"Nombre comercial o código de investigación del medicamento\",\n  \"principio_activo\": \"Nombre científico del ingrediente activo (IFA)\",\n  \"endpoints_clinicos\": \"Puntos finales de eficacia clínica, tasa de éxito y población analizada\",\n  \"especificaciones_calidad\": \"Límites de pureza, método de síntesis o condiciones de conservación\"\n}\nSi un dato no está en el texto, escribe \"No especificado en el dossier\". No inventes nada.`
        },
        {
          role: 'user',
          content: textContent
        }
      ]
    });

    const data = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en extracción por IA:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
5. Algoritmo Criptográfico SHA-256 (Web Crypto)
Crea la función utilitaria en utils/crypto.ts para que el Smart Contract realice el anclaje digital de las firmas de los evaluadores y tomadores de decisiones:

export async function generarBlockchainHash(expediente: {
  id: string;
  producto_nombre: string;
  principio_activo: string;
  endpoints_clinicos: string;
  especificaciones_calidad: string;
  umbra_score_beneficio: number;
  umbra_score_riesgo: number;
}): Promise<string> {
  const payload = `${expediente.id}-${expediente.producto_nombre}-${expediente.principio_activo}-${expediente.endpoints_clinicos}-${expediente.especificaciones_calidad}-${expediente.umbra_score_beneficio}-${expediente.umbra_score_riesgo}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
6. Prompt para Diseñar la UI Reactiva Multiperfil en Cursor
Copia y pega este prompt estructurado en Cursor Composer (Cmd + I o Ctrl + I) para crear la vista interactiva. Este diseño incluye un selector dinámico para actuar como cualquiera de los 5 usuarios descritos:

*"Diseña una aplicación web dinámica de página única en Tailwind CSS (app/page.tsx) que simule de manera interactiva el Flujo de Modernización Regulatoria.

Requisito Clave: Coloca un selector dinámico bien visible en la cabecera (un dropdown o pestañas) para cambiar de rol activo. La interfaz debe adaptarse dinámicamente según el rol seleccionado:

VISTA: SOLICITANTE. Permite 'Radicar expediente' simulando el Módulo e-CTD (puedes proveer un botón con datos de ejemplo). Si el expediente entra en estado 'subsanando', le permite editar y volver a enviar, con un límite estricto de 2 intentos de subsanación.

VISTA: ADMINISTRADOR DE TRIAJE. Muestra las solicitudes entrantes. Permite validar visualmente la extracción por IA realizada por el endpoint /api/extract, clasificar la prioridad (Ordinaria / Acelerada) y aprobar el borrador de la Preacta Digital para iniciar la evaluación científica.

VISTA: EVALUADORES TÉCNICOS (Mesa Concurrente). Muestra 3 columnas/tarjetas paralelas: Seguridad, Legal, y Calidad. Permite que cada evaluador escriba un concepto corto y firme digitalmente ('Firma Concurrente'). Si hay objeciones, un botón les permite 'Solicitar Subsanación' (sumando al contador de ciclos). Si llega al límite de 2 ciclos, el expediente cambia automáticamente a 'rechazado'.

VISTA: PORTAL DE VALIDACIÓN EXTERNA (Aduana / Clínicas). Un portal público permanente donde cualquier tercero arrastra el acta final o ingresa el UUID. El sistema recalcula el hash SHA-256 y compara con la base de datos de Supabase en caliente. Debe responder en < 0.5 segundos con un aviso verde brillante de 'DOCUMENTO AUTÉNTICO Y VIGENTE' o un aviso rojo de 'ADVERTENCIA: HASH NO COINCIDE O DOCUMENTO ALTERADO'.

Incluye efectos de transición suaves y un panel lateral de estadísticas que muestre los ahorros de tiempo (ej. Admisión -80%, Transcripción por IA -90%, Firmas instantáneas por Smart Contract). Usa Tailwind de alta calidad con estados interactivos claros."*

Es posible que Gemini Notebook muestre información imprecisa. Verifica las respuestas.