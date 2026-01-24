-- AlterTable
ALTER TABLE `etablissements` ADD COLUMN `parentId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `etablissements` ADD CONSTRAINT `etablissements_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `etablissements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
