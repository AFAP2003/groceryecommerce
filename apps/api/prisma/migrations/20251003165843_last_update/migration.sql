/*
  Warnings:

  - The values [CART] on the enum `VoucherType` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `isDefault` on table `Address` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VoucherType_new" AS ENUM ('PRODUCT_SPECIFIC', 'SHIPPING', 'REFERRAL');
ALTER TABLE "Voucher" ALTER COLUMN "type" TYPE "VoucherType_new" USING ("type"::text::"VoucherType_new");
ALTER TYPE "VoucherType" RENAME TO "VoucherType_old";
ALTER TYPE "VoucherType_new" RENAME TO "VoucherType";
DROP TYPE "VoucherType_old";
COMMIT;

-- DropIndex
DROP INDEX "Address_isDefault_key";

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "isDefault" SET NOT NULL,
ALTER COLUMN "isDefault" SET DEFAULT false;

-- CreateTable
CREATE TABLE "_UserVoucher" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserVoucher_AB_unique" ON "_UserVoucher"("A", "B");

-- CreateIndex
CREATE INDEX "_UserVoucher_B_index" ON "_UserVoucher"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserVoucher" ADD CONSTRAINT "_UserVoucher_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserVoucher" ADD CONSTRAINT "_UserVoucher_B_fkey" FOREIGN KEY ("B") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
