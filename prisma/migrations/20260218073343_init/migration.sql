-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cameraId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "videoPath" TEXT NOT NULL,
    "thumbnailPath" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL
);
