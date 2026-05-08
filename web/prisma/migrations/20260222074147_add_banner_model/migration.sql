/*
  Warnings:

  - You are about to drop the column `subcategoryId` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `subcategoryId` on the `subcategoryitem` table. All the data in the column will be lost.
  - You are about to drop the `subcategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `groupId` to the `SubcategoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_subcategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `subcategory` DROP FOREIGN KEY `Subcategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `subcategoryitem` DROP FOREIGN KEY `SubcategoryItem_subcategoryId_fkey`;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `subcategoryId`,
    ADD COLUMN `subcategoryGroupId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `subcategoryitem` DROP COLUMN `subcategoryId`,
    ADD COLUMN `groupId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `subcategory`;

-- CreateTable
CREATE TABLE `SubcategoryGroup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubcategoryGroup_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blacklist` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `blockedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Blacklist_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AffiliateProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `totalEarnings` INTEGER NOT NULL DEFAULT 0,
    `pendingEarnings` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AffiliateProfile_userId_key`(`userId`),
    UNIQUE INDEX `AffiliateProfile_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AffiliateTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `commissionAmount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AffiliateTransaction_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_subcategoryGroupId_fkey` FOREIGN KEY (`subcategoryGroupId`) REFERENCES `SubcategoryGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubcategoryGroup` ADD CONSTRAINT `SubcategoryGroup_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubcategoryItem` ADD CONSTRAINT `SubcategoryItem_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `SubcategoryGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliateProfile` ADD CONSTRAINT `AffiliateProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliateTransaction` ADD CONSTRAINT `AffiliateTransaction_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `AffiliateProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliateTransaction` ADD CONSTRAINT `AffiliateTransaction_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
