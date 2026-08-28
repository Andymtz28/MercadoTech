// One-shot: ficha TODOS los productos activos y artículos de soporte
// publicados. Corre fuera del navegador con el cliente admin:
//
//   npx tsx scripts/index-all.ts
//
// También es la vía de reindexación manual si un admin edita
// support_articles directamente por SQL — el trigger automático de la Fase
// 4.3 (triggerReindex) solo se dispara desde la UI del vendedor al
// publicar/editar/borrar un producto, no desde cambios directos en la base.
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { indexSource } from "../services/embedding.service";

async function main() {
  const supabase = createAdminClient();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("is_active", true);
  if (productsError) throw productsError;

  const { data: articles, error: articlesError } = await supabase
    .from("support_articles")
    .select("id")
    .eq("is_published", true);
  if (articlesError) throw articlesError;

  let productCount = 0;
  for (const product of products ?? []) {
    await indexSource("producto", product.id, supabase);
    productCount += 1;
  }

  let articleCount = 0;
  for (const article of articles ?? []) {
    await indexSource("articulo_soporte", article.id, supabase);
    articleCount += 1;
  }

  console.log(`Productos indexados: ${productCount}`);
  console.log(`Artículos indexados: ${articleCount}`);
  console.log(`Total de fichas: ${productCount + articleCount}`);
}

main().catch((error) => {
  console.error("Error al indexar:", error instanceof Error ? error.message : error);
  process.exit(1);
});
