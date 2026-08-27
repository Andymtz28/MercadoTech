import { Button } from "@/components/ui/button";
import { Price } from "@/components/shared/Price";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
  checkingOut: boolean;
}

export function CartSummary({ subtotal, itemCount, onCheckout, checkingOut }: CartSummaryProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Subtotal ({itemCount} {itemCount === 1 ? "producto" : "productos"})
        </span>
        <Price value={subtotal} className="text-lg" />
      </div>
      <Button className="w-full" disabled={itemCount === 0 || checkingOut} onClick={onCheckout}>
        {checkingOut ? "Procesando…" : "Comprar"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Pago simulado para el laboratorio — no se realiza ningún cobro.
      </p>
    </div>
  );
}
