"use client";

import { Container } from "@/components/shared/Container";
import { Price } from "@/components/shared/Price";
import { RatingStars } from "@/components/shared/RatingStars";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { ProductImage } from "@/components/shared/ProductImage";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

// Página de muestra para revisar los tokens de tema y los componentes base
// de components/shared/ (Fase 3.1). Se elimina en la Fase 3.8.
export default function DevUiPage() {
  return (
    <Container className="space-y-12 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Sistema visual — MercadoTech</h1>
        <p className="text-muted-foreground">
          Vista de desarrollo de components/shared/. Alterna el modo claro/oscuro del sistema para revisar ambos temas.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Botones y color primario</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructivo</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Price</h2>
        <div className="flex flex-wrap gap-6">
          <Price value={1299.9} />
          <Price value={"219.00"} />
          <Price value={18999} className="text-xl" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">RatingStars</h2>
        <div className="flex flex-col gap-2">
          <RatingStars rating={5} reviewCount={12} />
          <RatingStars rating={3.6} reviewCount={7} />
          <RatingStars rating={0} reviewCount={0} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">ConditionBadge</h2>
        <div className="flex gap-3">
          <ConditionBadge condition="nuevo" />
          <ConditionBadge condition="usado" />
          <ConditionBadge condition="reacondicionado" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">ProductImage (con y sin error)</h2>
        <div className="flex gap-4">
          <div className="relative size-32 overflow-hidden rounded-md border">
            <ProductImage src={null} alt="Producto sin imagen" />
          </div>
          <div className="relative size-32 overflow-hidden rounded-md border">
            {/* Dominio permitido en next.config.ts pero archivo inexistente:
                dispara el onError real de ProductImage, a diferencia de un
                dominio no configurado (que next/image rechaza antes de intentar
                cargarlo, sin llegar a onError). */}
            <ProductImage
              src="https://uuvgafxscvukrlzirmao.supabase.co/storage/v1/object/public/product-images/no-existe.jpg"
              alt="Producto con imagen inexistente"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Card (shadcn) + Badge</h2>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Laptop Dell XPS 13
              <Heart className="size-5 text-muted-foreground" aria-hidden="true" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge>Envío gratis</Badge>
            <Price value={18999} className="block text-lg" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">EmptyState</h2>
        <EmptyState
          title="Todavía no tienes favoritos"
          description="Los productos que marques con el corazón aparecerán aquí."
          actionLabel="Ver catálogo"
          onAction={() => {}}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">ErrorState</h2>
        <ErrorState message="No se pudo cargar el catálogo." onRetry={() => {}} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">LoadingState</h2>
        <LoadingState />
      </section>
    </Container>
  );
}
