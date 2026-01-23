import 'dotenv/config'
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const etabPassword = await bcrypt.hash("etab123", 10);
  const respPassword = await bcrypt.hash("resp123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: adminPassword,
      role: UserRole.ADMIN,
      firstName: "Admin",
      lastName: "User",
    },
  });

  const etabUser = await prisma.user.upsert({
    where: { email: "etablissement@example.com" },
    update: {},
    create: {
      email: "etablissement@example.com",
      password: etabPassword,
      role: UserRole.ETABLISSEMENT,
      firstName: "Etab",
      lastName: "User",
    },
  });

  await prisma.etablissement.upsert({
    where: { userId: etabUser.id },
    update: {},
    create: {
      name: "Etablissement Tunis",
      userId: etabUser.id,
      address: "Tunis, Tunisia",
    },
  });

  await prisma.user.upsert({
    where: { email: "responsable@example.com" },
    update: {},
    create: {
      email: "responsable@example.com",
      password: respPassword,
      role: UserRole.RESPONSABLE,
      firstName: "Resp",
      lastName: "User",
    },
  });

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
