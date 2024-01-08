-- CreateTable
CREATE TABLE "fio_contact_person" (
    "id" SERIAL NOT NULL,
    "fc_num" TEXT NOT NULL,
    "gender" TEXT,
    "race" TEXT,
    "recnum" INTEGER,
    "build" TEXT,
    "hair_style" TEXT,
    "otherclothing" TEXT,
    "age" DOUBLE PRECISION,
    "ethnicity" TEXT,
    "skin_tone" TEXT,
    "license_state" TEXT,
    "person_frisked_or_searched" BOOLEAN NOT NULL,
    "license_type" TEXT,
    "was_frisked" BOOLEAN,

    CONSTRAINT "fio_contact_person_pkey" PRIMARY KEY ("id")
);
