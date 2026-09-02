import { describe, expect, it } from "vitest";
import { deleteProductImage, getPublicUrl, saveImageOrder, uploadProductImage, validateProductImageFile } from "./storage.service";
import { createSupabaseMock, findInvokedChain } from "./test-utils/supabase-mock";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/constants/storage";
import type { ProductImage } from "@/types/product";

function makeFile(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], "foto.jpg", { type });
}

describe("validateProductImageFile", () => {
  it("acepta un JPG dentro del límite de tamaño", () => {
    expect(validateProductImageFile(makeFile("image/jpeg", 1024))).toBeNull();
  });

  it("rechaza un formato no soportado", () => {
    expect(validateProductImageFile(makeFile("application/pdf", 1024))).toMatch(/Formato no soportado/);
  });

  it("rechaza un archivo que supera el límite de 5 MB", () => {
    expect(validateProductImageFile(makeFile("image/png", MAX_IMAGE_SIZE_BYTES + 1))).toMatch(/supera el límite/);
  });

  it("acepta exactamente el límite de tamaño", () => {
    expect(validateProductImageFile(makeFile("image/webp", MAX_IMAGE_SIZE_BYTES))).toBeNull();
  });
});

describe("getPublicUrl", () => {
  it("devuelve la publicUrl del bucket product-images", () => {
    const supabase = createSupabaseMock();
    const url = getPublicUrl("s1/p1/1.jpg", supabase);
    expect(url).toContain("s1/p1/1.jpg");
  });
});

describe("uploadProductImage", () => {
  it("rechaza antes de subir si el archivo no pasa la validación", async () => {
    const supabase = createSupabaseMock();
    await expect(uploadProductImage(makeFile("application/pdf", 10), "s1", "p1", 0, supabase)).rejects.toThrow(
      /Formato no soportado/,
    );
  });

  it("arma el path {seller}/{product}/{position}.{ext} desde el MIME real, no el nombre del archivo", async () => {
    const supabase = createSupabaseMock({
      tables: { product_images: { data: { id: "img1", product_id: "p1", image_path: "s1/p1/2.png", position: 2 } } },
    });

    const row = await uploadProductImage(makeFile("image/png", 100), "s1", "p1", 2, supabase);

    const inserted = findInvokedChain(supabase.from, "insert");
    expect(inserted.insert).toHaveBeenCalledWith({ product_id: "p1", image_path: "s1/p1/2.png", position: 2 });
    expect(row.image_path).toBe("s1/p1/2.png");
  });

  it("propaga el error de subida a Storage sin llegar a insertar la fila", async () => {
    const supabase = createSupabaseMock();
    supabase.storage.from.mockReturnValueOnce({
      upload: async () => ({ data: null, error: { message: "bucket lleno" } }),
      remove: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    });

    await expect(uploadProductImage(makeFile("image/jpeg", 10), "s1", "p1", 0, supabase)).rejects.toEqual({
      message: "bucket lleno",
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe("deleteProductImage", () => {
  it("borra del Storage y luego la fila; propaga el error del Storage sin tocar la fila", async () => {
    const supabase = createSupabaseMock();
    supabase.storage.from.mockReturnValueOnce({
      upload: async () => ({ data: null, error: null }),
      remove: async () => ({ data: null, error: { message: "no existe en storage" } }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    });

    await expect(deleteProductImage("img1", "s1/p1/1.jpg", supabase)).rejects.toEqual({
      message: "no existe en storage",
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("caso feliz: no lanza", async () => {
    const supabase = createSupabaseMock({ tables: { product_images: { data: null, error: null } } });
    await expect(deleteProductImage("img1", "s1/p1/1.jpg", supabase)).resolves.toBeUndefined();
  });
});

describe("saveImageOrder", () => {
  it("no llama a Supabase si el arreglo está vacío", async () => {
    const supabase = createSupabaseMock();
    await saveImageOrder([], supabase);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("hace upsert con las filas completas", async () => {
    const supabase = createSupabaseMock({ tables: { product_images: { data: null, error: null } } });
    const images = [{ id: "i1", product_id: "p1", image_path: "a.jpg", position: 0 }] as ProductImage[];

    await saveImageOrder(images, supabase);

    const upserted = findInvokedChain(supabase.from, "upsert");
    expect(upserted.upsert).toHaveBeenCalledWith(images);
  });
});
