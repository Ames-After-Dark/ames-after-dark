-- CreateTable
CREATE TABLE "app"."photo_albums" (
    "id" SERIAL NOT NULL,
    "folder_name" VARCHAR(255) NOT NULL,
    "location_id" INTEGER NOT NULL,
    "photographer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."photographer_links" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "photographer_links_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "app"."users" ADD COLUMN "photographer_photo_url" VARCHAR(512);

-- CreateIndex
CREATE UNIQUE INDEX "photo_albums_folder_name_key" ON "app"."photo_albums"("folder_name");

-- AddForeignKey
ALTER TABLE "app"."photo_albums" ADD CONSTRAINT "photo_albums_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."photo_albums" ADD CONSTRAINT "photo_albums_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."photographer_links" ADD CONSTRAINT "photographer_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
