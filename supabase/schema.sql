-- ============================================================
-- Esquema Supabase para "IA para tu Negocio"
-- Tabla de leads: cada nombre de negocio que escriben en el taller.
-- Cómo aplicarlo: Supabase -> SQL Editor -> pega esto -> Run.
-- ============================================================

create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  negocio     text not null,
  tipo        text default 'afiche',
  creado_en   timestamptz not null default now()
);

-- Índice para ordenar/filtrar por fecha rápido.
create index if not exists leads_creado_en_idx on public.leads (creado_en desc);

-- Row Level Security: la tabla queda cerrada al público.
-- El proxy escribe con la SERVICE ROLE key, que ignora RLS,
-- así que NO necesitamos políticas para insertar desde el servidor.
-- Esto evita que alguien escriba/lea con la anon key desde el navegador.
alter table public.leads enable row level security;

-- (Opcional) Si más adelante quieres un dashboard que lea estos leads
-- con un usuario autenticado, agrega aquí una policy de SELECT.
