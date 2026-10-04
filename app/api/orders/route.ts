import { Prisma } from "@prisma/client";
import { createUniqueOrderNumber, isValidEmail } from "@/lib/order";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, RATE_LIMIT_SCOPES, rateLimitResponse } from "@/lib/rate-limit";

type CreateOrderBody = {
  packageId?: unknown;
  customerEmail?: unknown;
  targetUrlOrUsername?: unknown;
};

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit(request, {
    scope: RATE_LIMIT_SCOPES.orderCreate,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse("Çok fazla sipariş oluşturma isteği yapıldı. Lütfen daha sonra tekrar deneyin.", rateLimit.retryAfterSeconds);
  }

  let body: CreateOrderBody;

  try {
    body = await request.json() as CreateOrderBody;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const packageId = Number(body.packageId);
  const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim().toLowerCase() : "";
  const targetUrlOrUsername = typeof body.targetUrlOrUsername === "string" ? body.targetUrlOrUsername.trim() : "";

  if (!Number.isInteger(packageId) || packageId <= 0) {
    return Response.json({ error: "Lütfen geçerli bir paket seçin." }, { status: 400 });
  }
  if (!isValidEmail(customerEmail)) {
    return Response.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  if (targetUrlOrUsername.length < 3 || targetUrlOrUsername.length > 500) {
    return Response.json({ error: "Geçerli bir kullanıcı adı veya profil bağlantısı girin." }, { status: 400 });
  }

  const selectedPackage = await prisma.package.findFirst({
    where: { id: packageId, isActive: true, service: { isActive: true, platform: { isActive: true } } },
    include: { service: { include: { platform: true } } },
  });

  if (!selectedPackage) {
    return Response.json({ error: "Seçilen paket artık kullanılamıyor." }, { status: 404 });
  }

  try {
    const orderNumber = await createUniqueOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerEmail,
        targetUrlOrUsername,
        platform: selectedPackage.service.platform.name,
        service: selectedPackage.service.name,
        quantity: selectedPackage.quantity,
        price: selectedPackage.price,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentCurrency: "TRY",
        platformId: selectedPackage.service.platform.id,
        serviceId: selectedPackage.service.id,
        packageId: selectedPackage.id,
      },
      select: { orderNumber: true },
    });

    return Response.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Sipariş numarası oluşturulamadı. Lütfen tekrar deneyin." }, { status: 409 });
    }
    console.error("Sipariş oluşturma işlemi başarısız oldu.");
    return Response.json({ error: "Sipariş oluşturulurken bir sorun oluştu." }, { status: 500 });
  }
}
