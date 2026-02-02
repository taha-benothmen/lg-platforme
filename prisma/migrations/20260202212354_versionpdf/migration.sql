-- AlterTable
ALTER TABLE `devis` ADD COLUMN `invoicePdf` LONGBLOB NULL,
    ADD COLUMN `invoicePdfName` VARCHAR(255) NULL,
    ADD COLUMN `invoicePdfType` VARCHAR(50) NULL,
    ADD COLUMN `invoicePdfUploadedAt` DATETIME(3) NULL;
