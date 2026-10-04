CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitEntry_scope_keyHash_key" ON "RateLimitEntry"("scope", "keyHash");
CREATE INDEX "RateLimitEntry_expiresAt_idx" ON "RateLimitEntry"("expiresAt");
