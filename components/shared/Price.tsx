import type * as React from "react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceProps extends Omit<React.ComponentProps<"span">, "children"> {
  value: number | string;
}

export function Price({ value, className, ...rest }: PriceProps) {
  return (
    <span className={cn("font-heading font-extrabold tabular-nums text-text-strong", className)} {...rest}>
      {formatPrice(value)}
    </span>
  );
}
