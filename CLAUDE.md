@AGENTS.md

# MercadoTech

Plataforma de compra/venta de productos tecnológicos con centro de soporte
operado por agentes de voz. Ver `MercadoTech_sesion2.md` (y sesiones
siguientes conforme se agreguen) para la especificación completa por fases.

## Comandos

```bash
npm run dev        # levanta el servidor de desarrollo (Turbopack)
npm run build       # build de producción
npm run start        # sirve el build de producción
npm run lint          # ESLint
npx tsc --noEmit       # chequeo de tipos sin emitir archivos
```

Base de datos (requiere Supabase CLI instalado y Docker corriendo):

```bash
supabase start           # levanta Supabase local
supabase db reset          # aplica migraciones + supabase/seed.sql desde cero
supabase gen types typescript --local > types/database.ts
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar con los valores del
proyecto Supabase (local o remoto).

## Arquitectura y reglas de capas

Ver `MercadoTech.md` (plan maestro) sección "Principio rector". Resumen:

```
components/       Presentación pura. No fetching, no Supabase.
hooks/             Estado de cliente. Llaman a services.
services/          Lógica de negocio. SupabaseClient inyectable.
lib/supabase/      client.ts (browser) · server.ts (RLS) · admin.ts (service role, solo servidor) · middleware.ts
lib/ai/            Único lugar que conoce la API del proveedor de IA (sesión 4).
lib/voice/         Único lugar que conoce la API de voz (sesión 8).
lib/validators/    Validación framework-agnóstica.
lib/constants/     Tunables centralizados.
types/             Tipos de dominio + database.ts (generado).
app/api/v1/        Route Handlers delgados, solo lo que no corre en el navegador.
```

Reglas: un archivo una responsabilidad · sin barrels · la UI nunca importa
`lib/ai/`, `lib/voice/` ni `lib/supabase/admin.ts` · un solo camino de datos
(hooks → services → Supabase/RLS, sin API REST paralela) · todo tunable en
`lib/constants/`.
