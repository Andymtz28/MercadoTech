// Todos los tunables del sistema RAG. Cada valor documenta su porqué —
// vienen calibrados de la experiencia real de ReadHub (el proyecto anterior
// del curso) integrando el mismo proveedor.

// La dimensión queda fijada en la columna SQL (vector(384)) — cambiarla
// exige migración (ver comentario en la migración de knowledge_embeddings),
// no solo esta constante.
export const EMBEDDING_DIMENSIONS = 384;

export const EMBEDDING_MODEL_DEFAULT = "sentence-transformers/all-MiniLM-L6-v2";

// all-MiniLM-L6-v2 acepta máximo 256 tokens (~1000 caracteres) y trunca en
// SILENCIO lo que sobra. Por eso el texto a vectorizar arma las señales más
// valiosas primero (título, marca, categoría) y el contenido largo al
// final: si algo se corta, se corta lo menos importante.
export const MAX_EMBEDDING_INPUT_CHARS = 1000;

// Cuántas fichas trae la búsqueda semántica por defecto / como máximo
// permitido por request (evita que un query abra una consulta enorme).
export const VECTOR_SEARCH_DEFAULT_TOP_K = 5;
export const VECTOR_SEARCH_MAX_TOP_K = 20;

// Similitud mínima para considerar un resultado relevante. Provisional:
// pares de texto NO relacionados ya rondan 0.1–0.2 (comparten idioma); los
// relacionados suelen superar 0.4. Se calibra con datos reales en la Fase 4.8.
export const VECTOR_SEARCH_DEFAULT_SIMILARITY_THRESHOLD = 0.3;

// Cuántas fuentes entran como máximo al contexto del LLM, y el mismo piso
// de similitud que la búsqueda (una fuente ya recuperada pero poco
// relevante tampoco debería colarse al contexto).
export const CONTEXT_BUILDER_DEFAULT_MAX_SOURCES = 5;
export const CONTEXT_BUILDER_DEFAULT_MIN_SIMILARITY = 0.3;

// Fuentes con menos de esto de contenido (ej. un título suelto sin cuerpo)
// no aportan nada al redactor — se descartan antes de gastar presupuesto.
export const CONTEXT_BUILDER_MIN_CONTENT_LENGTH = 20;

// Presupuesto total de caracteres que se le pasan al modelo de chat como
// contexto (control de costo/latencia, no de calidad).
export const CONTEXT_BUILDER_DEFAULT_MAX_CONTEXT_CHARS = 8000;

// Si a la última fuente que cabría le quedan menos de esto, se descarta
// ENTERA en vez de truncarla — media frase confunde más de lo que aporta.
export const CONTEXT_BUILDER_MIN_TRUNCATED_SOURCE_CHARS = 200;

// La disponibilidad de modelos gratuitos de Hugging Face rota sin aviso —
// por eso el modelo real se lee de HUGGINGFACE_CHAT_MODEL, con este valor
// solo como fallback si la variable no está configurada.
export const HUGGINGFACE_CHAT_MODEL_DEFAULT = "meta-llama/Llama-3.1-8B-Instruct";
export const HUGGINGFACE_CHAT_MAX_TOKENS = 1024;

// Límite de longitud de la consulta del usuario (compras/soporte), tanto
// para UX (nadie escribe una pregunta de 4000+ caracteres de buena fe) como
// para no gastar cuota de la API en abusos.
export const CHAT_QUERY_MAX_CHARS = 4000;
