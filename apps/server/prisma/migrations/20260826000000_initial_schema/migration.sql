-- Final development initialization schema. No released data migration is required.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "google_subject" TEXT,
    "email" TEXT,
    "nickname" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "prompt_template" TEXT NOT NULL,
    "negative_prompt" TEXT,
    "style_ref_url" TEXT,
    "params" JSONB,
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "owner_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "user_clerk_user_id_key" ON "user"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_google_subject_key" ON "user"("google_subject");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "preset_owner_user_id_idx" ON "preset"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_user_id_normalized_name_key"
    ON "category"("user_id", "normalized_name");

-- CreateIndex
CREATE INDEX "category_user_id_idx" ON "category"("user_id");

-- CreateIndex
CREATE INDEX "wallpaper_user_id_created_at_idx"
    ON "wallpaper"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "wallpaper_user_id_category_id_created_at_idx"
    ON "wallpaper"("user_id", "category_id", "created_at");

-- CreateIndex
CREATE INDEX "wallpaper_user_id_favorite_idx"
    ON "wallpaper"("user_id", "favorite");

-- CreateIndex
CREATE INDEX "wallpaper_preset_id_idx" ON "wallpaper"("preset_id");

-- AddForeignKey
ALTER TABLE "preset"
    ADD CONSTRAINT "preset_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "user"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category"
    ADD CONSTRAINT "category_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallpaper"
    ADD CONSTRAINT "wallpaper_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "category"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallpaper"
    ADD CONSTRAINT "wallpaper_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallpaper"
    ADD CONSTRAINT "wallpaper_preset_id_fkey"
    FOREIGN KEY ("preset_id") REFERENCES "preset"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
