-- CreateTable
CREATE TABLE "app"."deals" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "location_id" INTEGER NOT NULL,
    "views" INTEGER DEFAULT 0,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."events" (
    "id" SERIAL NOT NULL,
    "location_id" INTEGER,
    "description" TEXT,
    "views" INTEGER DEFAULT 0,
    "name" VARCHAR,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."friendship_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "friendship_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."friendships" (
    "user_id_1" INTEGER NOT NULL,
    "user_id_2" INTEGER NOT NULL,
    "friendship_status_id" INTEGER NOT NULL DEFAULT 1,
    "created_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("user_id_1","user_id_2")
);

-- CreateTable
CREATE TABLE "app"."location_hours" (
    "id" SERIAL NOT NULL,
    "weekday_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "open_time" VARCHAR(5) NOT NULL,
    "close_time" VARCHAR(5) NOT NULL,

    CONSTRAINT "pkey_location_hours" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."location_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "location_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."locations" (
    "name" VARCHAR NOT NULL,
    "id" SERIAL NOT NULL,
    "address" VARCHAR,
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    "description" VARCHAR,
    "open" BOOLEAN,
    "tags" VARCHAR[],
    "views" INTEGER DEFAULT 0,
    "nickname" VARCHAR,
    "location_type_id" INTEGER,
    "zone_id" INTEGER,
    "timezone" VARCHAR(50) DEFAULT 'UTC',

    CONSTRAINT "pkey_locations" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."user_favorites" (
    "user_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "favorited_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("user_id","location_id")
);

-- CreateTable
CREATE TABLE "app"."users" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "role_id" INTEGER,
    "username" VARCHAR(255),
    "bio" TEXT,
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "birthday" DATE,
    "favorite_profile_location_id" INTEGER,
    "favorite_profile_drink" TEXT,
    "phone_number" VARCHAR(25),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."weekdays" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "weekday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."menu_items" (
    "id" SERIAL NOT NULL,
    "menu_item_type_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_available" BOOLEAN,
    "price" DECIMAL(10,2),

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."cities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100),
    "country" VARCHAR(100),

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."zones" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "city_id" INTEGER,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."location_admins" (
    "location_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "location_admins_pkey" PRIMARY KEY ("location_id","user_id")
);

-- CreateTable
CREATE TABLE "app"."location_permissions" (
    "owner_id" INTEGER NOT NULL,
    "viewer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_permissions_pkey" PRIMARY KEY ("owner_id","viewer_id")
);

-- CreateTable
CREATE TABLE "app"."user_locations" (
    "user_id" INTEGER NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "app"."user_settings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sms_notifications" BOOLEAN DEFAULT false,
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."menu_item_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "menu_item_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."deal_occurrences" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "start_time_utc" TIMESTAMPTZ(6) NOT NULL,
    "end_time_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deal_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."event_occurrences" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "start_time_utc" TIMESTAMPTZ(6) NOT NULL,
    "end_time_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."location_hours_overrides" (
    "id" SERIAL NOT NULL,
    "location_id" INTEGER NOT NULL,
    "start_time_utc" TIMESTAMPTZ(6) NOT NULL,
    "end_time_utc" TIMESTAMPTZ(6) NOT NULL,
    "reason" VARCHAR(255),
    "is_open" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "location_hours_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friendship_statuses_name_key" ON "app"."friendship_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_uid_unique" ON "app"."users"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "app"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "app"."user_settings"("user_id");

-- CreateIndex
CREATE INDEX "idx_deal_occurrences_time" ON "app"."deal_occurrences"("start_time_utc", "end_time_utc");

-- CreateIndex
CREATE UNIQUE INDEX "deal_occurrences_deal_id_start_time_utc_end_time_utc_key" ON "app"."deal_occurrences"("deal_id", "start_time_utc", "end_time_utc");

-- CreateIndex
CREATE INDEX "idx_event_occurrences_time" ON "app"."event_occurrences"("start_time_utc", "end_time_utc");

-- CreateIndex
CREATE UNIQUE INDEX "event_occurrences_event_id_start_time_utc_end_time_utc_key" ON "app"."event_occurrences"("event_id", "start_time_utc", "end_time_utc");

-- AddForeignKey
ALTER TABLE "app"."deals" ADD CONSTRAINT "fk_locations" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."events" ADD CONSTRAINT "events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."friendships" ADD CONSTRAINT "friendships_friendship_status_id_fkey" FOREIGN KEY ("friendship_status_id") REFERENCES "app"."friendship_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."friendships" ADD CONSTRAINT "friendships_user_id_1_fkey" FOREIGN KEY ("user_id_1") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."friendships" ADD CONSTRAINT "friendships_user_id_2_fkey" FOREIGN KEY ("user_id_2") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."location_hours" ADD CONSTRAINT "bar_fk" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."location_hours" ADD CONSTRAINT "fk_weekday" FOREIGN KEY ("weekday_id") REFERENCES "app"."weekdays"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."locations" ADD CONSTRAINT "fk_location_type" FOREIGN KEY ("location_type_id") REFERENCES "app"."location_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."locations" ADD CONSTRAINT "locations_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "app"."zones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."user_favorites" ADD CONSTRAINT "user_favorites_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."users" ADD CONSTRAINT "fk_role_id" FOREIGN KEY ("role_id") REFERENCES "app"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."users" ADD CONSTRAINT "users_favorite_profile_location_id_fkey" FOREIGN KEY ("favorite_profile_location_id") REFERENCES "app"."locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."menu_items" ADD CONSTRAINT "fk_location" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."menu_items" ADD CONSTRAINT "fk_menu_item_type" FOREIGN KEY ("menu_item_type_id") REFERENCES "app"."menu_item_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."zones" ADD CONSTRAINT "zones_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "app"."cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."location_admins" ADD CONSTRAINT "location_admins_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."location_admins" ADD CONSTRAINT "location_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."location_permissions" ADD CONSTRAINT "location_permissions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."location_permissions" ADD CONSTRAINT "location_permissions_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."user_locations" ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."user_settings" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."deal_occurrences" ADD CONSTRAINT "deal_occurrences_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "app"."deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."event_occurrences" ADD CONSTRAINT "event_occurrences_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "app"."events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."location_hours_overrides" ADD CONSTRAINT "location_hours_overrides_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
