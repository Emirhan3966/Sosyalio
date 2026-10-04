-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "checkoutReference" TEXT NOT NULL,
    "checkoutUrl" TEXT NOT NULL,
    "mockTokenHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "orderId" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "PaymentEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "targetUrlOrUsername" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentProvider" TEXT,
    "providerOrderId" TEXT,
    "paidAt" DATETIME,
    "paymentAmount" DECIMAL,
    "paymentCurrency" TEXT NOT NULL DEFAULT 'TRY',
    "platformId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "ServicePlatform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerEmail", "id", "orderNumber", "packageId", "platform", "platformId", "price", "quantity", "service", "serviceId", "status", "targetUrlOrUsername", "updatedAt") SELECT "createdAt", "customerEmail", "id", "orderNumber", "packageId", "platform", "platformId", "price", "quantity", "service", "serviceId", "status", "targetUrlOrUsername", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_providerOrderId_key" ON "Order"("providerOrderId");
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_orderId_key" ON "PaymentAttempt"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_checkoutReference_key" ON "PaymentAttempt"("checkoutReference");

-- CreateIndex
CREATE INDEX "PaymentEvent_providerOrderId_idx" ON "PaymentEvent"("providerOrderId");

-- CreateIndex
CREATE INDEX "PaymentEvent_orderId_idx" ON "PaymentEvent"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_eventId_key" ON "PaymentEvent"("provider", "eventId");
