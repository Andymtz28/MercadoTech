-- Habilita pgvector (tipo `vector` + operadores de distancia) en el schema
-- extensions, igual convención que pgcrypto (migración 20260101000000):
-- nunca en `public`, para no mezclar objetos de extensión con el esquema
-- de dominio.
create extension if not exists vector with schema extensions;
