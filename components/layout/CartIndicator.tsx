import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CartIndicatorProps {
  count: number;
}

export function CartIndicator({ count }: CartIndicatorProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      nativeButton={false}
      render={
        <Link href="/carrito" aria-label={`Carrito, ${count} ${count === 1 ? "producto" : "productos"}`}>
          <ShoppingCart className="size-5" aria-hidden="true" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-xs"
              aria-hidden="true"
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Link>
      }
    />
  );
}
