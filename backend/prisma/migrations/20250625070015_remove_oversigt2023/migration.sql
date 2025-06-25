/*
  Warnings:

  - You are about to drop the column `oversigt2023` on the `StudentStat` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "oplæring" INTEGER NOT NULL,
    "skole" INTEGER NOT NULL,
    "vfo" INTEGER NOT NULL,
    "delaftale" INTEGER NOT NULL,
    "iAlt" INTEGER NOT NULL,
    "muligePåVej" INTEGER NOT NULL,
    "uploadedFileId" INTEGER NOT NULL,
    CONSTRAINT "StudentStat_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudentStat" ("delaftale", "iAlt", "id", "muligePåVej", "name", "oplæring", "skole", "uploadedFileId", "vfo") SELECT "delaftale", "iAlt", "id", "muligePåVej", "name", "oplæring", "skole", "uploadedFileId", "vfo" FROM "StudentStat";
DROP TABLE "StudentStat";
ALTER TABLE "new_StudentStat" RENAME TO "StudentStat";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
