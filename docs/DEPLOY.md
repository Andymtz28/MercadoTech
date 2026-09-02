# Despliegue — variables, secretos y flujo (Fase 7.3 / 7.4 / 7.5)

## 1. Variables y secretos

**Regla de oro: ningún valor de clave pasa por el repo ni por el chat con
Claude.** Esta tabla dice DÓNDE vive cada variable y QUIÉN la lee — los
valores se pegan a mano en la interfaz de Vercel.

| Variable | Dónde vive | Quién la lee | Pública/Secreta |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (Production + Preview), a mano | navegador y servidor | Pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (ambos entornos), a mano | navegador y servidor (RLS gobierna el acceso real) | Pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (ambos), a mano — solo se lee en runtime de servidor | `lib/supabase/admin.ts`, usado únicamente desde Route Handlers (`app/api/v1/*`) | **Secreta** |
| `HUGGINGFACEHUB_API_TOKEN` | Vercel (ambos), a mano | `lib/ai/embeddings.ts` y `lib/ai/completion.ts`, llamados solo desde Route Handlers | **Secreta** |
| `NEXT_PUBLIC_SITE_URL` | Vercel, por entorno (Production = URL real; Preview = la que Vercel genera) | redirects de `supabase.auth` (confirmación de email, etc.) | Pública |
| `HUGGINGFACE_EMBEDDING_MODEL` / `HUGGINGFACE_CHAT_MODEL` (opcionales) | Vercel, solo si hay que rotar el modelo gratuito | `lib/ai/` | Pública (nombre de modelo, no una clave) |
| — | **GitHub Actions** | — | **Ninguna variable, ningún secreto** — el CI (`.github/workflows/ci.yml`) corre contra un stack de Supabase efímero (`supabase start` en el runner) cuyas claves son las estándar de cualquier instancia local, iguales en cualquier máquina — no protegen nada real, así que no son secretos y no hace falta guardarlas como GitHub Secret |

`.env.example` ya tiene las 6 variables documentadas con su propósito
(revisado en esta fase, no reescrito — seguía correcto).

### Reglas

* **Nunca commitear `.env*.local`.** Verificado: `.gitignore` tiene `.env*`
  con excepción explícita `!.env.example`, y `git log --all --oneline --
  .env.local` no devuelve ningún commit — nunca se subió.
* **Rotación inmediata si una clave se expone**: Supabase → Project Settings
  → API → regenerar; Hugging Face → Settings → Access Tokens → revocar y
  crear uno nuevo. Actualizar el valor en Vercel y hacer redeploy.
* **Los previews de Vercel comparten el proyecto Supabase de producción**
  (un solo proyecto por alumno, plan free) — un preview de un PR puede
  escribir sobre datos reales de producción. Riesgo aceptado para este
  laboratorio; en un producto real se usaría un proyecto de staging aparte.
* **Cambiar una variable en Vercel NO afecta a los deploys ya hechos** —
  hay que disparar un redeploy explícito (Deployments → ⋯ → Redeploy) para
  que el cambio tome efecto.

### Greps anti-fuga (corridos contra el repo completo, resultado real)

```bash
# Tokens de Hugging Face
grep -rn "hf_[A-Za-z0-9]{10,}" .          # → vacío

# Claves "secret" del nuevo formato de Supabase
grep -rn "sb_secret" .                    # → solo aparece DENTRO de las specs
                                           #   (MercadoTech_sesion7.md, PROMPTS_sesion7.md)
                                           #   como parte de las instrucciones de este
                                           #   mismo grep — no es una clave real

# JWT legacy (empiezan con eyJ)
grep -rln "eyJ[A-Za-z0-9_-]{20,}" .       # → un falso positivo en package-lock.json:
                                           #   un hash sha512 de integridad de npm que
                                           #   por casualidad contiene la substring "eyJ",
                                           #   no un token

# Referencia del proyecto Supabase hosted
grep -rln "uuvgafxscvukrlzirmao" .        # → package.json (script db:types, es un
                                           #   identificador público, no una clave),
                                           #   docs/BITACORA.md (prosa) y supabase/.temp/*
```

**Hallazgo real de esta auditoría (corregido):** `supabase/.temp/` estaba
commiteado al repo — caché local del CLI de Supabase (versión del CLI,
`project-ref`, `pooler-url` sin contraseña, versiones de servicios). Ninguno
de esos archivos contiene una clave o contraseña real, pero es estado de
ESTA máquina, no del proyecto, y no debería versionarse (mismo principio que
`.next/` o `node_modules/`). Corregido: `git rm -r --cached supabase/.temp`
+ entrada nueva en `.gitignore`.

---

## 2. Flujo de despliegue (Fase 7.4)

### Desviación consciente de la spec original

La Fase 7.4 de `MercadoTech_sesion7.md` asume que el despliegue arranca de
cero: sin Vercel conectado todavía, y con un proyecto Supabase de
**producción separado** (`mercadotech-prod`), sembrado con un
`seed.prod.sql` mínimo (solo categorías + FAQ, sin usuarios ni productos de
prueba) — el catálogo de producción nacería vacío a propósito.

En este repo esa asunción ya no aplicaba al llegar a esta fase: el usuario
ya había desplegado manualmente a Vercel en una sesión anterior, apuntando
al MISMO proyecto Supabase que usa en desarrollo (`uuvgafxscvukrlzirmao`,
con los 6 usuarios y 16 productos de `seed.sql`). Decisión tomada con el
usuario: **mantener esa arquitectura tal cual** en vez de migrar a un
proyecto separado — ahorra la creación de una cuenta/proyecto Supabase
nueva y el re-seed, a costa de que "producción" y "desarrollo" comparten
base de datos (aceptable para este laboratorio; en un producto real serían
proyectos distintos). Por esta decisión:

* Los pasos 1-5 de la tabla original de la spec (`seed.prod.sql`, `supabase
  db push` a un proyecto nuevo, sembrar producción, indexar la FAQ de
  producción, desactivar "Confirm email") **no aplican**: la base ya está
  migrada, sembrada e indexada desde la Sesión 4, y "Confirm email" ya
  estaba resuelto para los usuarios de prueba (insertados por SQL directo,
  sin pasar por la API de Auth — Fase 3.3).
* Los pasos 6-10 (Vercel conectado por interfaz, branch protection, PR de
  prueba, smoke test) sí se ejecutaron tal cual pedía la spec — ver abajo.

### Estado real de Vercel

Se encontraron **5 proyectos de Vercel** apuntando a este mismo repositorio
de GitHub (restos de los intentos de conexión de la sesión de deploy
anterior: `mercado-tech`, `mercadotech`, `mercadotech-andres-2026`,
`mercadotech-app`, `mercadotech2`). El dominio de producción real en uso es
**`https://mercadotech-kohl.vercel.app`**. El proyecto `mercado-tech`
(guion en vez de junto) quedó en estado de error de un intento fallido
anterior — no bloquea nada (no es el dominio real) pero conviene borrarlo
desde el dashboard de Vercel para no confundirlo con el real.

### Branch protection (activo)

GitHub → Settings → Rulesets → regla `main`, Enforcement **Active**:

* ✅ Require a pull request before merging
* ✅ Require status checks to pass: **`checks`** y **`e2e`** (los 2 jobs de
  `.github/workflows/ci.yml`), ambos marcados como *Required*
* ✅ Restrict deletions

### Prueba de fuego (PR → CI → preview → merge → producción)

Ejecutada de punta a punta con la rama `deploy-smoke` (cambio trivial y
visible: año dinámico en el footer):

1. Push de la rama → GitHub ofrece el link para abrir el PR.
2. PR #1 abierto → Vercel comenta automáticamente con las URLs de preview
   de cada proyecto conectado; GitHub Actions dispara `checks` (38 s) y
   `e2e` (11 min), ambos en verde y marcados **Required**.
3. Con el ruleset activo, el botón "Merge pull request" solo se habilita
   cuando los 2 checks requeridos están en verde ("No conflicts with base
   branch", checks pasados) — validado visualmente en la propia UI del PR.
4. Merge a `main` (commit `703c9ff`) → Vercel redepliega producción
   automáticamente.
5. Verificado en vivo contra `https://mercadotech-kohl.vercel.app/`: el
   footer pasó de "MercadoTech — laboratorio..." a
   "MercadoTech © 2026 — laboratorio..." sin ninguna acción manual de
   despliegue.

### Smoke test post-deploy (ejecutado contra la URL real de producción)

| Paso | Resultado |
|---|---|
| Home carga, catálogo con productos reales | ✅ 15 publicaciones (14 del seed + 1 del smoke test) |
| Favicon | ✅ `GET /favicon.ico` → `200 image/x-icon` |
| Login (`seller1@mercadotech.test`) | ✅ |
| Publicar 1 producto demo ("Producto Demo Smoke Test", categoría Audio, $999, stock 5) | ✅ publicado — **sin imagen**: la herramienta de automatización de navegador de este agente no puede adjuntar archivos a un `<input type="file">` (limitación de la herramienta, no del código — la subida de imágenes real ya está cubierta por el E2E `seller-flow.spec.ts`, que sí sube un archivo de verdad contra Supabase local en CI) |
| Aparece en `/categoria/audio` | ✅ |
| Detalle del producto abre, guard "Es tu propio producto" correcto | ✅ |
| `/asistente` (widget flotante) → pestaña Soporte → pregunta real de la FAQ | ✅ responde citando la fuente real (`[1]`, categoría "devoluciones") — confirma que `HUGGINGFACEHUB_API_TOKEN` y el pipeline de RAG funcionan en producción |
| Logout desde el menú de usuario | ✅ vuelve a "Iniciar sesión" — **esta es la verificación en vivo de que los bugs de producción de la Fase 6.7 (crash de `MenuGroupContext`, `onSelect` vs `onClick`) siguen arreglados en el deploy real** |
| Registro de un vendedor nuevo real | **No ejecutado** — por la decisión de mantener la base compartida con desarrollo, crear un usuario nuevo real no aporta evidencia adicional a la ya cubierta por el login/registro de la suite E2E (Fase 6.5) contra el mismo código |

---

## 3. Rollback

Vercel guarda cada deploy numerado; volver atrás no requiere revertir el
commit en git:

1. Dashboard de Vercel → proyecto → pestaña **Deployments**.
2. Ubicar el último deploy bueno conocido (anterior al que falló).
3. Menú **⋯** → **Promote to Production** (o **Redeploy**, según la
   versión de la UI) → confirmar.
4. La URL de producción vuelve a servir ese build en segundos — sin
   rehacer el build ni tocar GitHub.

**Qué SÍ revierte:** el código y los assets servidos (JS, HTML, imágenes
del build).

**Qué NO revierte:** la base de datos. Las migraciones de Supabase
(`supabase db push`) son un camino de un solo sentido — un rollback de
Vercel no deshace un `alter table` ni restaura filas borradas. Si un
deploy malo incluyó una migración destructiva, el rollback de código no
alcanza: hay que escribir y aplicar una migración de reversión aparte, o
restaurar desde un backup de Supabase (Project Settings → Database →
Backups, según el plan).

**Cuándo usarlo:** un deploy nuevo rompe algo visible en producción
(error 500 generalizado, build que no compila, una regresión funcional
grave) y no hay tiempo de diagnosticar antes de que los usuarios lo noten.
Para bugs menores, es preferible el ciclo normal (fix → PR → CI verde →
merge) antes que un rollback.
