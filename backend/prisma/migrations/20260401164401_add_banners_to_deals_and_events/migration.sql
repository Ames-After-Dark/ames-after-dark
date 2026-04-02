-- AlterTable
ALTER TABLE "app"."deals" ADD COLUMN     "banner_id" INTEGER;

-- AlterTable
ALTER TABLE "app"."events" ADD COLUMN     "banner_id" INTEGER;

-- CreateTable
CREATE TABLE "app"."banners" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "image_url" VARCHAR(512) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banners_name_key" ON "app"."banners"("name");

-- AddForeignKey
ALTER TABLE "app"."deals" ADD CONSTRAINT "deals_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "app"."banners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."events" ADD CONSTRAINT "events_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "app"."banners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
