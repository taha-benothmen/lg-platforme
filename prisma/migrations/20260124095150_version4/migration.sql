/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `devis` DROP FOREIGN KEY `devis_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `devis` DROP FOREIGN KEY `devis_validatedById_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_etablissementId_fkey`;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `lg_dbusers` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'ETABLISSEMENT', 'RESPONSABLE') NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `etablissementId` VARCHAR(191) NULL,

    UNIQUE INDEX `lg_dbusers_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lg_dbusers` ADD CONSTRAINT `lg_dbusers_etablissementId_fkey` FOREIGN KEY (`etablissementId`) REFERENCES `etablissements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devis` ADD CONSTRAINT `devis_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `lg_dbusers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devis` ADD CONSTRAINT `devis_validatedById_fkey` FOREIGN KEY (`validatedById`) REFERENCES `lg_dbusers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
