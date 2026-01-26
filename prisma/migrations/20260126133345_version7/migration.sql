/*
  Warnings:

  - You are about to drop the column `status` on the `devis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `devis` DROP COLUMN `status`,
    ADD COLUMN `adminStatus` ENUM('EN_ATTENTE', 'VALIDE', 'REJETE', 'APPROUVE') NOT NULL DEFAULT 'EN_ATTENTE',
    ADD COLUMN `responsableStatus` ENUM('EN_ATTENTE', 'APPROUVE', 'SUSPENDU', 'REJETE') NOT NULL DEFAULT 'EN_ATTENTE';
