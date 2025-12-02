-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateTable
CREATE TABLE "app"."deals" (
    "id" INTEGER NOT NULL,
    "repeating" BOOLEAN,
    "date" DATE,
    "start_time" VARCHAR,
    "end_time" VARCHAR,
    "name" VARCHAR,
    "location_id" INTEGER,
    "weekday_id" INTEGER,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."events" (
    "id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "repeating" BOOLEAN,
    "date" DATE,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "weekday_id" INTEGER,
    "description" VARCHAR(255),

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
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("user_id_1","user_id_2")
);

-- CreateTable
CREATE TABLE "app"."location_hours" (
    "id" SERIAL NOT NULL,
    "is_open" BOOLEAN NOT NULL,
    "open_time " TIMESTAMP(6) NOT NULL,
    "close_time" TIMESTAMP(6) NOT NULL,
    "weekday_id" INTEGER,
    "location_id" INTEGER,

    CONSTRAINT "barHours_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "bars_pkey" PRIMARY KEY ("id")
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
    "uid" INTEGER,
    "role_id" INTEGER,
    "username" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."weekdays" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "weekday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friendship_statuses_name_key" ON "app"."friendship_statuses"("name");

-- AddForeignKey
ALTER TABLE "app"."deals" ADD CONSTRAINT "fk_bars" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."deals" ADD CONSTRAINT "fk_weekday" FOREIGN KEY ("weekday_id") REFERENCES "app"."weekdays"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."events" ADD CONSTRAINT "events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."events" ADD CONSTRAINT "events_weekday_id_fkey" FOREIGN KEY ("weekday_id") REFERENCES "app"."weekdays"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

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
ALTER TABLE "app"."user_favorites" ADD CONSTRAINT "user_favorites_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "app"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "app"."users" ADD CONSTRAINT "fk_role_id" FOREIGN KEY ("role_id") REFERENCES "app"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
