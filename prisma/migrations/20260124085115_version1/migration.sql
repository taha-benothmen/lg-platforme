/*
  Warnings:

  - You are about to drop the column `userId` on the `etablissements` table. All the data in the column will be lost.
  - Added the required column `etablissementId` to the `devis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `devis_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `etablissements` DROP FOREIGN KEY `etablissements_userId_fkey`;

-- DropIndex
DROP INDEX `etablissements_userId_key` ON `etablissements`;

-- AlterTable
ALTER TABLE `devis` ADD COLUMN `etablissementId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `devis_items` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `etablissements` DROP COLUMN `userId`,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `etablissementId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_etablissementId_fkey` FOREIGN KEY (`etablissementId`) REFERENCES `etablissements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devis` ADD CONSTRAINT `devis_etablissementId_fkey` FOREIGN KEY (`etablissementId`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devis_items` ADD CONSTRAINT `devis_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
