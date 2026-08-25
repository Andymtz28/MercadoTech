"use client";

import Link from "next/link";
import { LogOut, Heart, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/lib/constants/roles";

export interface NavUser {
  displayName: string | null;
  email: string;
  role: UserRole;
}

interface UserMenuProps {
  user: NavUser | null;
  onLogout?: () => void;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  if (!user) {
    return <Button size="sm" nativeButton={false} render={<Link href="/login">Iniciar sesión</Link>} />;
  }

  const label = user.displayName || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="gap-2 px-2" aria-label={`Menú de ${label}`}>
            <Avatar className="size-7">
              <AvatarFallback>{initials(label)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{label}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/pedidos" />}>
          <Package /> Mis pedidos
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/favoritos" />}>
          <Heart /> Favoritos
        </DropdownMenuItem>
        {(user.role === "seller" || user.role === "admin") && (
          <DropdownMenuItem render={<Link href="/vendedor/productos" />}>
            <Store /> Panel de vendedor
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} variant="destructive">
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
