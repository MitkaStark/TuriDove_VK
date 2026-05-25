-- AlterTable
ALTER TABLE "actividades" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "hospedajes" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "transfers" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "vehiculos" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;
