import Link from "next/link";
import { Price } from "@/components/shared/Price";
import type { ChatSource } from "@/types/chat";

interface SourcesListProps {
  sources: ChatSource[];
}

// Puro: recibe las fuentes ya hidratadas por el servicio (título,
// precio/imagen o categoría) — no conoce el endpoint ni lib/ai/.
export function SourcesList({ sources }: SourcesListProps) {
  if (sources.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1.5">
      {sources.map((source, index) => (
        <li key={`${source.sourceType}-${source.sourceId}`}>
          {source.sourceType === "producto" ? (
            <Link
              href={`/producto/${source.sourceId}`}
              className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-1.5 text-xs hover:border-primary/50"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                {index + 1}
              </span>
              <span className="line-clamp-1 flex-1">{source.title}</span>
              {source.price !== undefined && <Price value={source.price} className="shrink-0 text-xs" />}
            </Link>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-1.5 text-xs">
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                {index + 1}
              </span>
              <span className="line-clamp-1 flex-1">{source.title}</span>
              {source.category && <span className="shrink-0 text-muted-foreground">{source.category}</span>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
