/*
  Warnings:

  - You are about to alter the column `adminStatus` on the `devis` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `devis` MODIFY `adminStatus` ENUM('EN_COURS_DE_FACTURATION', 'EN_COURS_DE_LIVRAISON', 'LIVREE', 'REJETE') NOT NULL DEFAULT 'EN_COURS_DE_FACTURATION';
