/*
  Warnings:

  - You are about to alter the column `stock` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `products` MODIFY `stock` ENUM('DISPONIBLE', 'HORS_STOCK') NOT NULL DEFAULT 'DISPONIBLE';
