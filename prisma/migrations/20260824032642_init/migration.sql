-- CreateTable
CREATE TABLE "School" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyScore" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "R" DOUBLE PRECISION NOT NULL,
    "A" DOUBLE PRECISION NOT NULL,
    "C" DOUBLE PRECISION NOT NULL,
    "S" DOUBLE PRECISION NOT NULL,
    "I" DOUBLE PRECISION NOT NULL,
    "P" DOUBLE PRECISION NOT NULL,
    "M" DOUBLE PRECISION NOT NULL,
    "rcsi" DOUBLE PRECISION NOT NULL,
    "milestone" INTEGER NOT NULL,

    CONSTRAINT "SurveyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchRecord" (
    "id" SERIAL NOT NULL,
    "uploadDate" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "publicationLink" TEXT,
    "utilizedBySchool" BOOLEAN NOT NULL DEFAULT false,
    "utilizationDate" TEXT,
    "yearUndertaken" INTEGER NOT NULL,
    "yearsOfService" INTEGER NOT NULL,
    "teacherRank" TEXT NOT NULL,
    "educationalAttainment" TEXT NOT NULL,
    "batchId" TEXT,

    CONSTRAINT "ResearchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "detectedKind" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "inserted" INTEGER NOT NULL,
    "updated" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurveyScore_schoolId_month_key" ON "SurveyScore"("schoolId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchRecord_teacherName_title_yearUndertaken_key" ON "ResearchRecord"("teacherName", "title", "yearUndertaken");

-- AddForeignKey
ALTER TABLE "SurveyScore" ADD CONSTRAINT "SurveyScore_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchRecord" ADD CONSTRAINT "ResearchRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
