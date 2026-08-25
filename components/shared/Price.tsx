import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceProps {
  value: number | string;
  className?: string;
}

export function Price({ value, className }: PriceProps) {
  return <span className={cn("font-semibold tabular-nums", className)}>{formatPrice(value)}</span>;
}
