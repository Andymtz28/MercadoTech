import { MonogramBadge } from "@/components/shared/MonogramBadge";

const TRUST_CARDS = [
  {
    code: "FT",
    title: "Ficha técnica normalizada",
    body: "Los mismos campos en todas las publicaciones de una categoría, para comparar sin traducir jerga de cada vendedor.",
  },
  {
    code: "VV",
    title: "Vendedor verificado",
    body: "Identidad fiscal, historial de entregas y garantía técnica revisados antes de habilitar la cuenta.",
  },
  {
    code: "HP",
    title: "Historial de precios",
    body: "Noventa días de seguimiento por publicación y alertas cuando el precio baja de tu objetivo.",
  },
  {
    code: "BP",
    title: "Banco de pruebas",
    body: "El equipo editorial mide rendimiento, batería y térmica en los modelos de mayor rotación.",
  },
];

export function TrustCards() {
  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
      {TRUST_CARDS.map((card) => (
        <div key={card.code} className="space-y-2 rounded-xl border border-border bg-card p-5">
          <MonogramBadge text={card.code} size={32} />
          <p className="font-heading text-[14.5px] font-bold text-text-strong">{card.title}</p>
          <p className="text-[13px] leading-[1.55] text-text-quiet">{card.body}</p>
        </div>
      ))}
    </section>
  );
}
