-- CreateTable
CREATE TABLE "crm_integrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_integrations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "crm_integrations" ADD CONSTRAINT "crm_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
