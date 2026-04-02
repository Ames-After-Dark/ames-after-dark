-- 1. Create the new SharingPreference Enum
CREATE TYPE "app"."SharingPreference" AS ENUM ('PRIVATE', 'SELECTIVE', 'PUBLIC');

-- 2. Update the user_settings and users tables
ALTER TABLE "app"."user_settings" ADD COLUMN "ghost_mode_expires_at" TIMESTAMPTZ(6);
ALTER TABLE "app"."user_settings" ADD COLUMN "location_sharing_preference" "app"."SharingPreference" NOT NULL DEFAULT 'SELECTIVE';
ALTER TABLE "app"."users" ADD COLUMN "streak" INTEGER DEFAULT 0;

-- 3. RENAME the permissions table (Preserves your 16 rows)
-- Note: We use the current name "location_permissions" and move it to "user_location_permissions"
ALTER TABLE "location_permissions" RENAME TO "user_location_permissions";

-- 4. RENAME the favorites table (Preserves your 6 rows)
-- Note: You renamed 'user_favorites' to 'user_favorite_locations' in your schema
ALTER TABLE "user_favorites" RENAME TO "user_favorite_locations";

-- 5. Fix the Schemas (Ensuring they are in the 'app' schema if they weren't already)
ALTER TABLE "user_location_permissions" SET SCHEMA "app";
ALTER TABLE "user_favorite_locations" SET SCHEMA "app";

-- 6. Add/Update Foreign Keys
-- Since we renamed the tables, we just need to make sure the constraints are named correctly 
-- Prisma usually handles the internal logic, but we'll re-apply the clean FKs here:

ALTER TABLE "app"."user_favorite_locations" ADD CONSTRAINT "user_favorite_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "app"."user_favorite_locations" ADD CONSTRAINT "user_favorite_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "app"."user_location_permissions" ADD CONSTRAINT "user_location_permissions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "app"."user_location_permissions" ADD CONSTRAINT "user_location_permissions_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;