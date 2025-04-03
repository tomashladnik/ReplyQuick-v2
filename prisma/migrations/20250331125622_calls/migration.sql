-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "transcriptText" TEXT,
    "summary" TEXT,
    "qualification" TEXT,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "category" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calls_userId_idx" ON "calls"("userId");

-- CreateIndex
CREATE INDEX "calls_contactId_idx" ON "calls"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_userId_idx" ON "contacts"("userId");

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
