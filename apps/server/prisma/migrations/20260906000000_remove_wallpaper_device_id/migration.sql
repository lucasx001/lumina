-- Development-stage schema reset: wallpaper ownership is account-based and category-backed.
DROP TABLE IF EXISTS "wallpaper";

CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallpaper" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preset_id" TEXT,
    "mode" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "source_image_key" TEXT,
    "result_image_key" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "quality" TEXT NOT NULL DEFAULT 'hd',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "provider_task" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallpaper_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "category_user_id_normalized_name_key"
    ON "category"("user_id", "normalized_name");
CREATE INDEX "category_user_id_idx" ON "category"("user_id");
CREATE INDEX "wallpaper_user_id_created_at_idx" ON "wallpaper"("user_id", "created_at");
CREATE INDEX "wallpaper_user_id_category_id_created_at_idx"
    ON "wallpaper"("user_id", "category_id", "created_at");
CREATE INDEX "wallpaper_user_id_favorite_idx" ON "wallpaper"("user_id", "favorite");
CREATE INDEX "wallpaper_preset_id_idx" ON "wallpaper"("preset_id");

ALTER TABLE "category"
    ADD CONSTRAINT "category_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallpaper"
    ADD CONSTRAINT "wallpaper_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallpaper"
    ADD CONSTRAINT "wallpaper_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallpaper"
    ADD CONSTRAINT "wallpaper_preset_id_fkey"
    FOREIGN KEY ("preset_id") REFERENCES "preset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
