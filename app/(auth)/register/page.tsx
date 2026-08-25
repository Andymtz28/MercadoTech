"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import type { RegisterInput } from "@/lib/validators/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit(input: RegisterInput) {
    const data = await register(input);
    if (!data.session) {
      // El proyecto exige confirmación de correo: signUp no abre sesión.
      setPendingConfirmation(true);
      return;
    }
    toast.success("Cuenta creada");
    router.push("/");
  }

  if (pendingConfirmation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            title="Revisa tu correo"
            description="Te enviamos un enlace para confirmar tu cuenta antes de iniciar sesión."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Compra o vende productos tecnológicos en MercadoTech.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegisterForm onSubmit={handleSubmit} />
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
