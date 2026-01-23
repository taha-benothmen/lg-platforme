import 'dotenv/config'
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create categories
  const categories = [
    { name: "Ordinateurs", description: "Ordinateurs portables et de bureau" },
    { name: "Périphériques", description: "Souris, claviers, écrans" },
    { name: "Accessoires", description: "Câbles, sacs, supports" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const computerCategory = await prisma.category.findUnique({ where: { name: "Ordinateurs" } });
  const peripheralCategory = await prisma.category.findUnique({ where: { name: "Périphériques" } });
  const accessoryCategory = await prisma.category.findUnique({ where: { name: "Accessoires" } });

  // Create products
  const products = [
    {
      name: "PC Portable HP Pavilion",
      description: "Intel Core i5, 8GB RAM, 256GB SSD",
      price: 2500,
      stock: 15,
      image: "/pcportablehp.png",
      categoryId: computerCategory!.id,
    },
    {
      name: "Souris Sans Fil Logitech",
      description: "Souris ergonomique sans fil",
      price: 45,
      stock: 50,
      image: "/file.svg",
      categoryId: peripheralCategory!.id,
    },
    {
      name: "Clavier Mécanique",
      description: "Clavier RGB mécanique",
      price: 120,
      stock: 30,
      image: "/file.svg",
      categoryId: peripheralCategory!.id,
    },
    {
      name: "Écran 24 pouces",
      description: "Écran Full HD IPS",
      price: 450,
      stock: 20,
      image: "/file.svg",
      categoryId: peripheralCategory!.id,
    },
    {
      name: "Sacoche Ordinateur",
      description: "Sacoche pour ordinateur 15.6 pouces",
      price: 35,
      stock: 40,
      image: "/file.svg",
      categoryId: accessoryCategory!.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: 0 },
      update: {},
      create: product,
    });
  }

  console.log("Products and categories seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
