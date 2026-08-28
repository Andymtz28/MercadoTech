import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/shared/Price";
import type { Product } from "@/types/product";

interface ProductsTableProps {
  products: Product[];
  onDelete: (productId: string) => void;
}

export function ProductsTable({ products, onDelete }: ProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="max-w-xs truncate">{product.title}</TableCell>
            <TableCell>
              <Badge variant={product.is_active ? "default" : "outline"}>
                {product.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Price value={product.price} />
            </TableCell>
            <TableCell className="text-right">{product.stock}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  nativeButton={false}
                  render={
                    <Link href={`/vendedor/productos/${product.id}/editar`} aria-label="Editar">
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                  }
                />
                <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)} aria-label="Eliminar">
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
