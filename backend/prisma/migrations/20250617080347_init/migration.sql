-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "StudentStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "oplæring" INTEGER NOT NULL,
    "skole" INTEGER NOT NULL,
    "vfo" INTEGER NOT NULL,
    "delaftale" INTEGER NOT NULL,
    "iAlt" INTEGER NOT NULL,
    "muligePåVej" INTEGER NOT NULL,
    "oversigt2023" INTEGER NOT NULL,
    "uploadedFileId" INTEGER NOT NULL,
    CONSTRAINT "StudentStat_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
