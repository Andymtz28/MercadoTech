"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateRegister, type FieldErrors, type RegisterInput } from "@/lib/validators/auth";
import { getErrorMessage } from "@/lib/utils";

interface RegisterFormProps {
  onSubmit: (input: RegisterInput) => Promise<void>;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterInput["role"]>("buyer");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const input: RegisterInput = { displayName, email, password, role };
    const errors = validateRegister(input);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setFormError(getErrorMessage(error, "No se pudo crear la cuenta."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Nombre</Label>
        <Input
          id="displayName"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          aria-invalid={!!fieldErrors.displayName}
        />
        {fieldErrors.displayName && <p className="text-sm text-destructive">{fieldErrors.displayName}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!fieldErrors.email}
        />
        {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!fieldErrors.password}
        />
        {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Tipo de cuenta</Label>
        <Select value={role} onValueChange={(value) => setRole(value as RegisterInput["role"])}>
          <SelectTrigger id="role" className="w-full">
            <SelectValue placeholder="Selecciona un tipo de cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buyer">Comprador</SelectItem>
            <SelectItem value="seller">Vendedor</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors.role && <p className="text-sm text-destructive">{fieldErrors.role}</p>}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
