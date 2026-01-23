"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const serialized = products.map(p => ({
      ...p,
      price: parseFloat(p.price.toString()),
    }));

    return { success: true, products: serialized };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  stock: number;
  image?: string;
  categoryId: number;
}) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency || "TND",
        stock: data.stock,
        image: data.image,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/admin/produits");
    revalidatePath("/etablissement/produits");
    revalidatePath("/responsable/produits");

    return { success: true, product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}
