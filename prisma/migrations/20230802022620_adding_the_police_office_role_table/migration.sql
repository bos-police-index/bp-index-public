-- CreateTable
CREATE TABLE "police_officer_role" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "yearly_earnings" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "police_officer_role_pkey" PRIMARY KEY ("id")
);
