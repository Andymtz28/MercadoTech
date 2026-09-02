import { describe, expect, it, vi } from "vitest";
import { getCurrentUser, login, logout, register, subscribeToAuthChanges } from "./auth.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";

describe("register / login / logout", () => {
  it("register: caso feliz devuelve data", async () => {
    const supabase = createSupabaseMock({ auth: { signUp: { data: { user: { id: "u1" }, session: null }, error: null } } });
    const data = await register(
      { email: "nuevo@mercadotech.test", password: "MercadoTech123!", displayName: "Ana", role: "buyer" },
      supabase,
    );
    expect(data.user).toEqual({ id: "u1" });
  });

  it("register: propaga el error", async () => {
    const supabase = createSupabaseMock({
      auth: { signUp: { data: { user: null, session: null }, error: { message: "correo ya registrado" } } },
    });
    await expect(
      register({ email: "a@a.com", password: "MercadoTech123!", displayName: "Ana", role: "buyer" }, supabase),
    ).rejects.toEqual({ message: "correo ya registrado" });
  });

  it("login: caso feliz devuelve data", async () => {
    const supabase = createSupabaseMock({
      auth: { signInWithPassword: { data: { user: { id: "u1" }, session: { access_token: "t" } }, error: null } },
    });
    const data = await login({ email: "buyer1@mercadotech.test", password: "MercadoTech123!" }, supabase);
    expect(data.session).toEqual({ access_token: "t" });
  });

  it("login: propaga el error de credenciales inválidas", async () => {
    const supabase = createSupabaseMock({
      auth: { signInWithPassword: { data: { user: null, session: null }, error: { message: "credenciales inválidas" } } },
    });
    await expect(login({ email: "a@a.com", password: "mala" }, supabase)).rejects.toEqual({
      message: "credenciales inválidas",
    });
  });

  it("logout: caso feliz, no lanza", async () => {
    const supabase = createSupabaseMock({ auth: { signOut: { error: null } } });
    await expect(logout(supabase)).resolves.toBeUndefined();
  });

  it("logout: propaga el error", async () => {
    const supabase = createSupabaseMock({ auth: { signOut: { error: { message: "sin sesión" } } } });
    await expect(logout(supabase)).rejects.toEqual({ message: "sin sesión" });
  });
});

describe("getCurrentUser", () => {
  it("null si no hay usuario autenticado", async () => {
    const supabase = createSupabaseMock({ auth: { getUser: { data: { user: null }, error: null } } });
    expect(await getCurrentUser(supabase)).toBeNull();
  });

  it("combina el profile de la tabla con el email de auth", async () => {
    const supabase = createSupabaseMock({
      auth: { getUser: { data: { user: { id: "u1", email: "buyer1@mercadotech.test" } }, error: null } },
      tables: { profiles: { data: { id: "u1", display_name: "Ana Buyer", role: "buyer" } } },
    });

    const profile = await getCurrentUser(supabase);

    expect(profile).toEqual({ id: "u1", display_name: "Ana Buyer", role: "buyer", email: "buyer1@mercadotech.test" });
  });

  it("propaga el error de la consulta del profile", async () => {
    const supabase = createSupabaseMock({
      auth: { getUser: { data: { user: { id: "u1", email: "a@a.com" } }, error: null } },
      tables: { profiles: { data: null, error: { message: "no encontrado" } } },
    });
    await expect(getCurrentUser(supabase)).rejects.toEqual({ message: "no encontrado" });
  });
});

describe("subscribeToAuthChanges", () => {
  it("devuelve una función de limpieza que llama a unsubscribe", () => {
    const unsubscribe = vi.fn();
    const supabase = createSupabaseMock();
    supabase.auth.onAuthStateChange.mockReturnValueOnce({ data: { subscription: { unsubscribe } } });

    const cleanup = subscribeToAuthChanges(() => {}, supabase);
    cleanup();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("invoca onChange cuando el listener dispara un evento", () => {
    const onChange = vi.fn();
    const supabase = createSupabaseMock();

    subscribeToAuthChanges(onChange, supabase);
    const registeredCallback = supabase.auth.onAuthStateChange.mock.calls[0][0];
    registeredCallback("SIGNED_IN", null);

    expect(onChange).toHaveBeenCalledOnce();
  });
});
