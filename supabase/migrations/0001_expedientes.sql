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
  estado_preacta_validado boolean default false,

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
alter publication supabase_realtime add table public.expedientes;

-- RLS: demo sin autenticación, acceso abierto para el rol anon.
-- NOTA: esto es deliberadamente inseguro, válido solo para el MVP del hackatón.
alter table public.expedientes enable row level security;

create policy "expedientes_select_anon" on public.expedientes
  for select to anon, authenticated using (true);

create policy "expedientes_insert_anon" on public.expedientes
  for insert to anon, authenticated with check (true);

create policy "expedientes_update_anon" on public.expedientes
  for update to anon, authenticated using (true) with check (true);
