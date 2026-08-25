-- Buckets de Storage y sus políticas.
-- Convención de rutas: el primer segmento del path es el uuid del propietario
-- ({seller_id}/{product_id}/{n}.{ext} en product-images, {user_id}/... en avatars).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  );

-- ---------------------------------------------------------------------------
-- product-images: lectura pública; escritura/borrado solo del vendedor
-- autenticado dentro de su propia carpeta ({seller_id}/...).
-- ---------------------------------------------------------------------------

create policy product_images_storage_read on storage.objects
  for select
  using (bucket_id = 'product-images');

create policy product_images_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy product_images_storage_update on storage.objects
  for update
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy product_images_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- avatars: lectura pública; escritura/borrado solo del dueño ({user_id}/...).
-- ---------------------------------------------------------------------------

create policy avatars_storage_read on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy avatars_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_storage_update on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
