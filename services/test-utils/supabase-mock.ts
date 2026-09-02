import { vi } from "vitest";

export interface MockResponse {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "upsert",
  "delete",
  "eq",
  "neq",
  "in",
  "not",
  "or",
  "gte",
  "lte",
  "gt",
  "lt",
  "ilike",
  "like",
  "order",
  "range",
  "limit",
] as const;

// Query "thenable" encadenable: cada método de la cadena devuelve el mismo
// objeto (se puede llamar en cualquier orden, como el cliente real);
// awaitarlo en cualquier punto de la cadena resuelve la respuesta
// programada. `single`/`maybeSingle` son terminales y devuelven la promesa
// directo, igual que el SDK real.
function createQueryMock(response: MockResponse) {
  const resolved = { data: response.data ?? null, error: response.error ?? null, count: response.count ?? null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mock: any = {};
  for (const method of CHAIN_METHODS) {
    mock[method] = vi.fn(() => mock);
  }
  mock.single = vi.fn(() => Promise.resolve(resolved));
  mock.maybeSingle = vi.fn(() => Promise.resolve(resolved));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mock.then = (onFulfilled?: (v: typeof resolved) => any, onRejected?: (e: unknown) => any) =>
    Promise.resolve(resolved).then(onFulfilled, onRejected);
  return mock;
}

function nextResponse(
  map: Record<string, MockResponse | MockResponse[]> | undefined,
  key: string,
  counter: Record<string, number>,
): MockResponse {
  const configured = map?.[key];
  if (!configured) return { data: null, error: null };
  if (Array.isArray(configured)) {
    const idx = counter[key] ?? 0;
    counter[key] = idx + 1;
    return configured[Math.min(idx, configured.length - 1)];
  }
  return configured;
}

export interface SupabaseMockConfig {
  // Respuesta por tabla — un objeto para "siempre la misma", o un arreglo
  // para servir una respuesta distinta en cada llamada sucesiva a esa tabla
  // (ej. cart.service.addItem: primero lee, después update O insert).
  tables?: Record<string, MockResponse | MockResponse[]>;
  rpc?: Record<string, MockResponse | MockResponse[]>;
  auth?: Partial<{
    getUser: { data: { user: unknown }; error: unknown };
    signUp: { data: unknown; error: unknown };
    signInWithPassword: { data: unknown; error: unknown };
    signOut: { error: unknown };
  }>;
}

// Fábrica del cliente Supabase mockeado (Sesión 6, decisión 7): SIEMPRE se
// inyecta como último parámetro del service bajo prueba — nunca se hace
// vi.mock de lib/supabase/*.
export function createSupabaseMock(config: SupabaseMockConfig = {}) {
  const tableCallIndex: Record<string, number> = {};
  const rpcCallIndex: Record<string, number> = {};

  const from = vi.fn((table: string) => createQueryMock(nextResponse(config.tables, table, tableCallIndex)));
  const rpc = vi.fn((fn: string) => createQueryMock(nextResponse(config.rpc, fn, rpcCallIndex)));

  const auth = {
    getUser: vi.fn(async () => config.auth?.getUser ?? { data: { user: null }, error: null }),
    signUp: vi.fn(async () => config.auth?.signUp ?? { data: { user: null, session: null }, error: null }),
    signInWithPassword: vi.fn(
      async () => config.auth?.signInWithPassword ?? { data: { user: null, session: null }, error: null },
    ),
    signOut: vi.fn(async () => config.auth?.signOut ?? { error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  };

  const storage = {
    from: vi.fn(() => ({
      upload: vi.fn(async () => ({ data: null, error: null })),
      remove: vi.fn(async () => ({ data: null, error: null })),
      getPublicUrl: vi.fn((path: string) => ({
        data: { publicUrl: `https://mock.supabase.local/storage/v1/object/public/bucket/${path}` },
      })),
    })),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from, rpc, auth, storage } as any;
}

// Todo mock de query tiene TODOS los métodos de la cadena (para poder
// encadenarse en cualquier orden), así que no sirve buscar "el mock que
// tiene .insert" — todos lo tienen. Esto busca, entre las llamadas a
// `from`, la que además INVOCÓ el método dado (ej. distinguir la lectura
// de `.select()` de la escritura `.update()` sobre la misma tabla).
export function findInvokedChain(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromMock: any,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fromMock.mock.results.map((r: any) => r.value).find((v: any) => v[method]?.mock.calls.length > 0);
}
