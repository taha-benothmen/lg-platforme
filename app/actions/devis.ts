"use server"

import { prisma } from "@/lib/prisma";
import { DevisStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createDevis(data: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddr?: string;
  createdById: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}) {
  try {
    const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const devis = await prisma.devis.create({
      data: {
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientAddr: data.clientAddr,
        createdById: data.createdById,
        total,
        status: DevisStatus.EN_ATTENTE,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    revalidatePath("/admin/devis");
    revalidatePath("/etablissement/devis");
    revalidatePath("/responsable/devis");

    return { success: true, devis };
  } catch (error) {
    console.error("Error creating devis:", error);
    return { success: false, error: "Failed to create devis" };
  }
}

export async function updateDevisStatus(devisId: string, status: DevisStatus, validatedById?: string) {
  try {
    const devis = await prisma.devis.update({
      where: { id: devisId },
      data: {
        status,
        validatedById,
      },
      include: {
        items: true,
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        validatedBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    revalidatePath("/admin/devis");
    revalidatePath("/etablissement/devis");
    revalidatePath("/responsable/devis");

    return { success: true, devis };
  } catch (error) {
    console.error("Error updating devis status:", error);
    return { success: false, error: "Failed to update devis status" };
  }
}

export async function deleteDevis(devisId: string) {
  try {
    await prisma.devisItem.deleteMany({
      where: { devisId },
    });

    await prisma.devis.delete({
      where: { id: devisId },
    });

    revalidatePath("/admin/devis");
    revalidatePath("/etablissement/devis");
    revalidatePath("/responsable/devis");

    return { success: true };
  } catch (error) {
    console.error("Error deleting devis:", error);
    return { success: false, error: "Failed to delete devis" };
  }
}

export async function getDevisList(role: string, userId?: string) {
  try {
    let where = {};

    if (role === "ETABLISSEMENT" && userId) {
      where = { createdById: userId };
    }

    const devisList = await prisma.devis.findMany({
      where,
      include: {
        items: true,
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        validatedBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, devis: devisList };
  } catch (error) {
    console.error("Error fetching devis:", error);
    return { success: false, error: "Failed to fetch devis" };
  }
}
