-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "nomor" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "headName" TEXT NOT NULL,
    "phone" TEXT,
    "kkNumber" TEXT,
    "occupancyStatus" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "kkImage" BYTEA,
    "kkImageType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "nik" TEXT,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "birthPlace" TEXT,
    "birthDate" TIMESTAMP(3),
    "religion" TEXT,
    "education" TEXT,
    "job" TEXT,
    "maritalStatus" TEXT,
    "familyRelation" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuesType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'bulanan',
    "startsOn" TIMESTAMP(3),
    "dueOn" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuesType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "nomor" SERIAL NOT NULL,
    "householdId" TEXT NOT NULL,
    "duesTypeId" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL,
    "paidOn" DATE NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'tunai',
    "note" TEXT,
    "recordedById" TEXT,
    "submissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "spentOn" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'pengumuman',
    "body" TEXT NOT NULL,
    "image" BYTEA,
    "imageType" TEXT,
    "eventStartsAt" TIMESTAMP(3),
    "eventLocation" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPopup" BOOLEAN NOT NULL DEFAULT false,
    "popupImage" BYTEA,
    "popupImageType" TEXT,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "qrisImage" BYTEA,
    "qrisImageType" TEXT,
    "qrisPayload" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSubmission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "duesTypeId" TEXT NOT NULL,
    "periods" JSONB NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "uniqueCode" INTEGER NOT NULL DEFAULT 0,
    "bankAccountId" TEXT,
    "payerName" TEXT,
    "phone" TEXT,
    "note" TEXT,
    "proofImage" BYTEA NOT NULL,
    "proofType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "status" TEXT NOT NULL DEFAULT 'menunggu',
    "approvedPeriods" JSONB,
    "rejectReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Household_nomor_key" ON "Household"("nomor");

-- CreateIndex
CREATE UNIQUE INDEX "Household_number_key" ON "Household"("number");

-- CreateIndex
CREATE INDEX "HouseholdMember_householdId_familyRelation_idx" ON "HouseholdMember"("householdId", "familyRelation");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_nomor_key" ON "Payment"("nomor");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_submissionId_key" ON "Payment"("submissionId");

-- CreateIndex
CREATE INDEX "Payment_paidOn_idx" ON "Payment"("paidOn");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_householdId_duesTypeId_period_key" ON "Payment"("householdId", "duesTypeId", "period");

-- CreateIndex
CREATE INDEX "Expense_spentOn_idx" ON "Expense"("spentOn");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_publishedAt_category_idx" ON "Post"("publishedAt", "category");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSubmission_code_key" ON "PaymentSubmission"("code");

-- CreateIndex
CREATE INDEX "PaymentSubmission_status_createdAt_idx" ON "PaymentSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentSubmission_householdId_duesTypeId_status_idx" ON "PaymentSubmission"("householdId", "duesTypeId", "status");

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_duesTypeId_fkey" FOREIGN KEY ("duesTypeId") REFERENCES "DuesType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PaymentSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_duesTypeId_fkey" FOREIGN KEY ("duesTypeId") REFERENCES "DuesType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
