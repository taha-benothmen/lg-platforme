-- DropIndex
DROP INDEX `devis_items_productId_idx` ON `devis_items`;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `imageType` VARCHAR(50) NULL,
    MODIFY `image` LONGBLOB NULL;
