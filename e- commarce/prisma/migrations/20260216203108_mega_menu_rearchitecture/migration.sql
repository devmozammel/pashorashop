/*
  Warnings:

  - You are about to drop the column `parentId` on the `category` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `category` DROP FOREIGN KEY `Category_parentId_fkey`;

-- AlterTable
ALTER TABLE `category` DROP COLUMN `parentId`;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `subcategoryItemId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SubcategoryItem` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `subcategoryId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubcategoryItem_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_subcategoryItemId_fkey` FOREIGN KEY (`subcategoryItemId`) REFERENCES `SubcategoryItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubcategoryItem` ADD CONSTRAINT `SubcategoryItem_subcategoryId_fkey` FOREIGN KEY (`subcategoryId`) REFERENCES `Subcategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
