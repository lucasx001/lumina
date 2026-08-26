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
CREATE TABLE "wallpaper" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "device_id" TEXT,
    "user_id" TEXT,
    "preset_id" TEXT,
    "mode" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "source_image_url" TEXT,
    "result_image_url" TEXT,
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
CREATE INDEX "wallpaper_user_id_idx" ON "wallpaper"("user_id");

-- CreateIndex
CREATE INDEX "wallpaper_device_id_idx" ON "wallpaper"("device_id");

-- CreateIndex
CREATE INDEX "wallpaper_device_id_category_idx" ON "wallpaper"("device_id", "category");

-- CreateIndex
CREATE INDEX "wallpaper_preset_id_idx" ON "wallpaper"("preset_id");

-- CreateIndex
CREATE INDEX "wallpaper_device_id_favorite_idx" ON "wallpaper"("device_id", "favorite");

-- AddForeignKey
ALTER TABLE "preset" ADD CONSTRAINT "preset_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallpaper" ADD CONSTRAINT "wallpaper_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallpaper" ADD CONSTRAINT "wallpaper_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "preset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
