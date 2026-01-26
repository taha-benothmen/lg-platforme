-- AlterTable
ALTER TABLE `devis` ADD COLUMN `adminValidatedById` VARCHAR(191) NULL,
    MODIFY `status` ENUM('EN_ATTENTE', 'ENVOYE', 'APPROUVE', 'ADMIN', 'SUSPENDU', 'REJETE', 'ACCEPTE') NOT NULL DEFAULT 'EN_ATTENTE';

-- AddForeignKey
ALTER TABLE `devis` ADD CONSTRAINT `devis_adminValidatedById_fkey` FOREIGN KEY (`adminValidatedById`) REFERENCES `lg_dbusers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
