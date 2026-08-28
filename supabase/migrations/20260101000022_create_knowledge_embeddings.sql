-- knowledge_embeddings: UNA tabla para las dos fuentes que se indexan
-- (productos y artículos de soporte), discriminada por source_type — más
-- simple que dos tablas gemelas y permite búsquedas conjuntas (útil si
-- mañana se agrega una fuente nueva: mismo patrón, otro source_type).
--
-- source_id NO tiene foreign key: apunta a dos tablas origen distintas
-- (products o support_articles) según source_type, y Postgres no soporta
-- FKs condicionales. Consecuencia: si se borra el producto/artículo
-- original, la ficha queda huérfana (source_id ya no resuelve a ninguna
-- fila). La Fase 4.3 mitiga esto con limpieza best-effort al borrar un
-- producto, y la Fase 4.4 descarta huérfanos al hidratar resultados.
--
-- Cambiar de modelo de embeddings a uno con otra dimensión exige migración:
-- `alter table knowledge_embeddings alter column embedding type
-- extensions.vector(N)` + recrear el índice HNSW y la función
-- match_knowledge con la nueva dimensión — no basta con cambiar la
-- variable de entorno del modelo.
create table public.knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('producto', 'articulo_soporte')),
  source_id uuid not null,
  chunk_index integer not null default 0,
  content text not null,
  embedding extensions.vector(384) not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (source_type, source_id, chunk_index)
);

alter table public.knowledge_embeddings enable row level security;

create index knowledge_embeddings_embedding_idx
  on public.knowledge_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);
