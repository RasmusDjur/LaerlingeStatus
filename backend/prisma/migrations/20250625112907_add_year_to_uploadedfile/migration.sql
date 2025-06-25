/*
  Warnings:

  - Added the required column `year` to the `UploadedFile` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UploadedFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL
);
INSERT INTO "new_UploadedFile" ("id", "name") SELECT "id", "name" FROM "UploadedFile";
DROP TABLE "UploadedFile";
ALTER TABLE "new_UploadedFile" RENAME TO "UploadedFile";
CREATE UNIQUE INDEX "UploadedFile_name_key" ON "UploadedFile"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
