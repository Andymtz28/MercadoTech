import { Badge } from "@/components/ui/badge";
import type { ProductCondition } from "@/lib/constants/roles";

const LABELS: Record<ProductCondition, string> = {
  nuevo: "Nuevo",
  usado: "Usado",
  reacondicionado: "Reacondicionado",
};

const VARIANTS: Record<ProductCondition, "default" | "secondary" | "outline"> = {
  nuevo: "default",
  usado: "outline",
  reacondicionado: "secondary",
};

interface ConditionBadgeProps {
  condition: ProductCondition;
}

export function ConditionBadge({ condition }: ConditionBadgeProps) {
  return <Badge variant={VARIANTS[condition]}>{LABELS[condition]}</Badge>;
}
