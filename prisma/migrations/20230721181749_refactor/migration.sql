-- CreateTable
CREATE TABLE "arrest_info" (
    "id" SERIAL NOT NULL,
    "incident_number" INTEGER NOT NULL,
    "offense_code" INTEGER,
    "offense_description" TEXT,
    "district" TEXT,
    "reporting_area" TEXT,
    "shooting" INTEGER,
    "occurred_on_date" TIMESTAMP(3),
    "year" INTEGER,
    "month" INTEGER,
    "day_of_week" TEXT,
    "hour" INTEGER,
    "ucr_part" TEXT,
    "street" TEXT,
    "location" TEXT,

    CONSTRAINT "arrest_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forfeiture_data" (
    "id" SERIAL NOT NULL,
    "url" TEXT,
    "case_number" TEXT NOT NULL,
    "court_name" TEXT,
    "date" TEXT,
    "amount" DOUBLE PRECISION,
    "motor_vehicle" TEXT,
    "cases_incidents" TEXT,

    CONSTRAINT "forfeiture_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "officermisconduct" (
    "id" SERIAL NOT NULL,
    "column1" INTEGER,
    "ia_no" TEXT NOT NULL,
    "incident_type" TEXT,
    "received_date" TIMESTAMP(3),
    "title_rank__snap_" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "allegation" TEXT,
    "disposition" TEXT,
    "completed_date" TIMESTAMP(3),

    CONSTRAINT "officermisconduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "police_financial" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "name" TEXT,
    "department_name" TEXT,
    "title" TEXT,
    "regular" TEXT,
    "retro" TEXT,
    "other" TEXT,
    "overtime" TEXT,
    "injured" TEXT,
    "detail" TEXT,
    "quinn" TEXT,
    "total_earnings" TEXT,
    "postal" TEXT,
    "filename" TEXT,
    "year" INTEGER,

    CONSTRAINT "police_financial_pkey" PRIMARY KEY ("id")
);
