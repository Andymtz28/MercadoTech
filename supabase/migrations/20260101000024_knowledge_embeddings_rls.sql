-- knowledge_embeddings — SELECT solo para authenticated (decisión de la
-- Fase 4.4: la IA exige sesión, tanto para no dejar la pestaña muerta con
-- una RLS que la contradiga como para proteger la cuota gratuita de
-- Hugging Face). INSERT/UPDATE/DELETE: sin política ni GRANT — solo el
-- cliente admin (service role, que bypasea RLS) escribe, desde
-- app/api/v1/reindex y scripts/index-all.ts (Fase 4.3).

create policy knowledge_embeddings_select on public.knowledge_embeddings
  for select
  using ((select auth.uid()) is not null);

grant select on public.knowledge_embeddings to authenticated;

-- match_knowledge es SECURITY INVOKER: igual que la tabla, solo
-- authenticated puede ejecutarlo (anon nunca tendría filas visibles de
-- todos modos, pero se restringe también el EXECUTE por claridad y para no
-- gastar cuota de Hugging Face generando el embedding de una consulta que
-- de entrada no vería resultados).
revoke execute on function public.match_knowledge(extensions.vector, text, int, float) from public;
revoke execute on function public.match_knowledge(extensions.vector, text, int, float) from anon;
grant execute on function public.match_knowledge(extensions.vector, text, int, float) to authenticated;
