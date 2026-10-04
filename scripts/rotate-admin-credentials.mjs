import "dotenv/config";
import { compare, getRounds, hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const bcryptCost = 12;

class RotationError extends Error {}

function requireRotationInputs() {
  const email = process.env.NEW_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.NEW_ADMIN_PASSWORD;

  if (!email) throw new RotationError("NEW_ADMIN_EMAIL tanımlı değil.");
  if (!password) throw new RotationError("NEW_ADMIN_PASSWORD tanımlı değil.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new RotationError("NEW_ADMIN_EMAIL geçerli bir e-posta adresi olmalı.");
  }
  if (password.length < 14) throw new RotationError("NEW_ADMIN_PASSWORD en az 14 karakter olmalı.");
  if (password.length > 200) throw new RotationError("NEW_ADMIN_PASSWORD en fazla 200 karakter olabilir.");

  return { email, password };
}

async function main() {
  const adminCount = await prisma.adminUser.count();
  if (adminCount !== 1) throw new RotationError(`Credential rotation için tam olarak 1 admin gerekli; bulunan kayıt sayısı: ${adminCount}.`);
  const { email, password } = requireRotationInputs();

  const currentAdmin = await prisma.adminUser.findFirst({
    select: { id: true, passwordHash: true },
  });
  if (!currentAdmin) throw new RotationError("Mevcut admin hesabı bulunamadı.");
  if (await compare(password, currentAdmin.passwordHash)) {
    throw new RotationError("Yeni parola mevcut paroladan farklı olmalı.");
  }

  const passwordHash = await hash(password, bcryptCost);
  const result = await prisma.$transaction(async (tx) => {
    const updatedAdmin = await tx.adminUser.update({
      where: { id: currentAdmin.id },
      data: { email, passwordHash },
      select: { id: true },
    });
    await tx.adminSession.deleteMany({});
    return updatedAdmin;
  });

  const [verifiedAdmin, remainingSessions, verifiedAdminCount] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: currentAdmin.id },
      select: { id: true, email: true, passwordHash: true },
    }),
    prisma.adminSession.count(),
    prisma.adminUser.count(),
  ]);

  if (!verifiedAdmin || verifiedAdminCount !== 1) throw new RotationError("Admin kayıt sayısı güncelleme sonrasında doğrulanamadı.");
  if (result.id !== currentAdmin.id || verifiedAdmin.id !== currentAdmin.id) throw new RotationError("Admin ID korunamadı.");
  if (verifiedAdmin.email !== email) throw new RotationError("Yeni admin e-postası doğrulanamadı.");
  if (verifiedAdmin.passwordHash === password || !await compare(password, verifiedAdmin.passwordHash)) {
    throw new RotationError("Yeni parola hash'i doğrulanamadı.");
  }
  if (getRounds(verifiedAdmin.passwordHash) !== bcryptCost) throw new RotationError("Bcrypt cost doğrulanamadı.");
  if (remainingSessions !== 0) throw new RotationError("Admin session kayıtları tamamen revoke edilemedi.");

  console.log("Admin sayısı doğrulandı: 1.");
  console.log("Admin credential güncellendi.");
  console.log("Admin ID korundu.");
  console.log("Password bcrypt cost doğrulandı: 12.");
  console.log("Session'lar revoke edildi.");
}

main()
  .catch((error) => {
    if (error instanceof RotationError) console.error(error.message);
    else console.error("Admin credential rotation başarısız oldu.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
