-- AlterTable
ALTER TABLE "app"."user_favorite_locations" RENAME CONSTRAINT "user_favorites_pkey" TO "user_favorite_locations_pkey";

-- AlterTable
ALTER TABLE "app"."user_location_permissions" RENAME CONSTRAINT "location_permissions_pkey" TO "user_location_permissions_pkey";

-- AlterTable
ALTER TABLE "app"."users" ADD COLUMN     "last_streak_week" INTEGER,
ADD COLUMN     "last_streak_year" INTEGER;

-- CreateTable
CREATE TABLE "app"."user_weekly_checkins" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "week_num" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_weekly_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_weekly_checkins_user_id_week_num_year_key" ON "app"."user_weekly_checkins"("user_id", "week_num", "year");

-- RenameForeignKey
ALTER TABLE "app"."user_location_permissions" RENAME CONSTRAINT "location_permissions_owner_id_fkey" TO "user_location_permissions_owner_id_fkey";

-- RenameForeignKey
ALTER TABLE "app"."user_location_permissions" RENAME CONSTRAINT "location_permissions_viewer_id_fkey" TO "user_location_permissions_viewer_id_fkey";

-- AddForeignKey
ALTER TABLE "app"."user_weekly_checkins" ADD CONSTRAINT "user_weekly_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."user_weekly_checkins" ADD CONSTRAINT "user_weekly_checkins_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
