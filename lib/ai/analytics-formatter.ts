import type { SellerAnalyticsSummary } from "@/services/analytics.service";
import { ORDER_STATUS_LABELS } from "@/lib/constants/orders";
import { formatPrice } from "@/lib/utils";

// Convierte el resumen ya calculado (services/analytics.service.ts) en el
// texto plano que se le pasa al modelo como contexto — separado del
// cálculo para que el texto se pueda ajustar sin tocar la agregación.
export function formatAnalyticsSummary(summary: SellerAnalyticsSummary): string {
  const lines: string[] = [];

  lines.push(`Productos: ${summary.totalProducts} en total, ${summary.activeProducts} activos.`);

  if (summary.lowStockProducts.length > 0) {
    const items = summary.lowStockProducts.map((p) => `${p.title} (${p.stock} en stock)`).join(", ");
    lines.push(`Productos activos con poco stock: ${items}.`);
  } else {
    lines.push("Ningún producto activo con stock bajo.");
  }

  const statusLine = Object.entries(summary.ordersByStatus)
    .map(([status, count]) => `${ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}: ${count}`)
    .join(", ");
  lines.push(`Pedidos por estado: ${statusLine}.`);

  lines.push(
    `Ventas totales (GMV, sin contar cancelados): ${formatPrice(summary.gmv)}. Ticket promedio: ${formatPrice(summary.averageOrderValue)}.`,
  );

  if (summary.topProductsByRevenue.length > 0) {
    const ranking = summary.topProductsByRevenue
      .map((p, i) => `${i + 1}. ${p.title} — ${p.units} unidades, ${formatPrice(p.revenue)}`)
      .join("; ");
    lines.push(`Productos más vendidos por ingreso: ${ranking}.`);
  } else {
    lines.push("Todavía no hay ventas registradas.");
  }

  lines.push(
    summary.averageRating !== null
      ? `Calificación promedio de sus productos: ${summary.averageRating.toFixed(1)} de 5.`
      : "Sus productos todavía no tienen reseñas.",
  );

  return lines.join("\n");
}
