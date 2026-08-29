import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { HomeStats } from "@/services/home.service";

interface HeroProps {
  stats: HomeStats | null;
}

const STATIC_STATS = [
  { value: "90 días", label: "Historial de precios" },
  { value: "24 h", label: "Entrega en zonas metro" },
];

export function Hero({ stats }: HeroProps) {
  const dynamicStats = [
    { value: stats ? String(stats.activeProductCount) : "—", label: "Publicaciones con ficha técnica" },
    { value: stats ? String(stats.verifiedSellerCount) : "—", label: "Vendedores verificados" },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10"
      style={{ backgroundImage: "radial-gradient(120% 140% at 88% 8%, rgba(152,202,63,.20) 0%, rgba(152,202,63,0) 55%)" }}
    >
      <div className="flex flex-wrap gap-8">
        <div className="min-w-[260px] flex-1 space-y-4">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Hot Sale Tech · Hasta 40% off</p>
          <h1 className="text-4xl leading-[1.12] font-extrabold tracking-tight text-text-strong">
            Tecnología comparable, vendedores verificados
          </h1>
          <p className="max-w-[520px] text-[15px] leading-relaxed text-text-tertiary">
            Cada publicación incluye ficha técnica normalizada, historial de precios y garantía revisada por
            MercadoTech.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button size="lg" nativeButton={false} render={<Link href="/buscar">Ver ofertas</Link>} />
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/vendedor/publicar">Quiero vender</Link>} />
          </div>
        </div>

        <div className="grid min-w-[240px] grid-cols-2 gap-3">
          {[...dynamicStats, ...STATIC_STATS].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border-strong bg-surface-raised px-4 py-3.5">
              <p className="font-heading text-[22px] font-extrabold text-primary">{stat.value}</p>
              <p className="text-[11.5px] text-text-quiet">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
