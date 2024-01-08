-- CreateTable
CREATE TABLE "police_dept_yearly" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "infl_adj_total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "police_dept_yearly_pkey" PRIMARY KEY ("id")
);
