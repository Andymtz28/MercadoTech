-- RPC de recuperación: dado el embedding de una consulta, devuelve las
-- fichas más parecidas por similitud coseno (1 - distancia). SECURITY
-- INVOKER (a diferencia de create_order_from_cart, que es SECURITY
-- DEFINER): esta función solo LEE datos ya filtrados por RLS según quién
-- llama — no necesita saltarse permisos, necesita respetarlos. Si
-- p_source_type es null, busca en ambas fuentes.
create function public.match_knowledge(
  query_embedding extensions.vector(384),
  p_source_type text default null,
  match_count int default 5,
  similarity_threshold float default 0.3
)
returns table (
  source_type text,
  source_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    ke.source_type,
    ke.source_id,
    ke.content,
    ke.metadata,
    1 - (ke.embedding <=> query_embedding) as similarity
  from public.knowledge_embeddings ke
  where (p_source_type is null or ke.source_type = p_source_type)
    and 1 - (ke.embedding <=> query_embedding) >= similarity_threshold
  order by ke.embedding <=> query_embedding
  limit match_count;
$$;
