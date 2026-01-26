/*
  Warnings:

  - The values [VALIDE] on the enum `devis_adminStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `devis` MODIFY `adminStatus` ENUM('EN_ATTENTE', 'REJETE', 'APPROUVE') NOT NULL DEFAULT 'EN_ATTENTE';
