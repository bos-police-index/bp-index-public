/*
  Warnings:

  - You are about to drop the column `title_rank__snap_` on the `officermisconduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "officermisconduct" DROP COLUMN "title_rank__snap_",
ADD COLUMN     "title_rank_snap" TEXT;
