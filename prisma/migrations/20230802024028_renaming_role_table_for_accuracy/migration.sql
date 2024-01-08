/*
  Warnings:

  - You are about to drop the `police_officer_role` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "police_officer_role";

-- CreateTable
CREATE TABLE "police_officer_role_earnings" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "yearly_earnings" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "police_officer_role_earnings_pkey" PRIMARY KEY ("id")
);
