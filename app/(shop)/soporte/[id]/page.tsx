"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSupportArticle } from "@/hooks/useSupportArticle";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";

export default function SupportArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { article, loading, error } = useSupportArticle(id);

  return (
    <Container className="max-w-2xl space-y-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a la tienda
      </Link>

      {loading ? (
        <LoadingState message="Cargando artículo…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : !article ? (
        <EmptyState title="No encontramos este artículo" description="Puede que ya no esté disponible." />
      ) : (
        <article className="space-y-3">
          {article.category && <Badge variant="secondary">{article.category}</Badge>}
          <h1 className="text-2xl font-bold text-text-strong">{article.title}</h1>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">{article.content}</p>
        </article>
      )}
    </Container>
  );
}
