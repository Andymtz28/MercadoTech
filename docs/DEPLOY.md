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

*(Esta sección se completa durante la Fase 7.4 — requiere acciones humanas
en los dashboards de Supabase y Vercel que Claude no puede ejecutar por sí
mismo: crear el proyecto Supabase de producción, importar el repo en
Vercel, cargar las variables, y activar branch protection en GitHub.)*

---

## 3. Rollback

*(Se completa en la Fase 7.5, junto con el resto de la documentación final.)*
