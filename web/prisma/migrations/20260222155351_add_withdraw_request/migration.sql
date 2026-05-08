-- CreateTable
CREATE TABLE `WithdrawRequest` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `paymentNumber` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `adminNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WithdrawRequest` ADD CONSTRAINT `WithdrawRequest_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `AffiliateProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
