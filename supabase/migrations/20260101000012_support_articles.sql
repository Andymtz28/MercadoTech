-- SUPPORT_ARTICLES: base de conocimiento (FAQ) para el RAG de soporte (sesión 4).
create table public.support_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_articles enable row level security;

create trigger support_articles_set_updated_at
  before update on public.support_articles
  for each row execute function public.set_updated_at();
