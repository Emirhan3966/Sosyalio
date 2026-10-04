import "dotenv/config";

const baseUrl = "http://localhost:3000";

class VerificationError extends Error {}

function required(name) {
  const value = process.env[name];
  if (!value) throw new VerificationError(`${name} doğrulama için tanımlı değil.`);
  return value;
}

async function login(email, password) {
  return fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({ email, password }),
  });
}

async function main() {
  const oldEmail = required("ADMIN_EMAIL");
  const oldPassword = required("ADMIN_PASSWORD");
  const newEmail = required("NEW_ADMIN_EMAIL");
  const newPassword = required("NEW_ADMIN_PASSWORD");

  const oldLogin = await login(oldEmail, oldPassword);
  if (oldLogin.status !== 401) throw new VerificationError(`Eski admin credential beklenen şekilde reddedilmedi (HTTP ${oldLogin.status}).`);

  const newLogin = await login(newEmail, newPassword);
  if (!newLogin.ok) throw new VerificationError(`Yeni admin credential ile login başarısız oldu (HTTP ${newLogin.status}).`);
  const setCookie = newLogin.headers.get("set-cookie") ?? "";
  const sessionCookie = setCookie.split(";", 1)[0];
  if (!sessionCookie.startsWith("sosyalio_admin_session=") || sessionCookie.endsWith("=")) {
    throw new VerificationError("Yeni login session cookie oluşturmadı.");
  }

  const authenticatedHeaders = { Cookie: sessionCookie };
  const adminPage = await fetch(`${baseUrl}/admin`, { redirect: "manual", headers: authenticatedHeaders });
  if (!adminPage.ok) throw new VerificationError("Admin paneli yeni session ile açılamadı.");

  const supportPage = await fetch(`${baseUrl}/admin/destek`, { redirect: "manual", headers: authenticatedHeaders });
  if (!supportPage.ok) throw new VerificationError("Admin destek sayfası yeni session ile açılamadı.");

  const logout = await fetch(`${baseUrl}/api/admin/auth/logout`, {
    method: "POST",
    redirect: "manual",
    headers: { ...authenticatedHeaders, Origin: baseUrl },
  });
  if (!logout.ok) throw new VerificationError("Doğrulama session'ı kapatılamadı.");

  const revokedPage = await fetch(`${baseUrl}/admin`, { redirect: "manual", headers: authenticatedHeaders });
  if (revokedPage.status !== 307 || revokedPage.headers.get("location") !== "/admin/login") {
    throw new VerificationError("Kapatılan doğrulama session'ı geçersiz hale gelmedi.");
  }

  console.log("Eski admin credential reddedildi.");
  console.log("Yeni admin login başarılı.");
  console.log("Admin paneli erişimi başarılı.");
  console.log("Admin destek erişimi başarılı.");
  console.log("Doğrulama session'ı kapatıldı ve geçersizliği doğrulandı.");
}

main().catch((error) => {
  if (error instanceof VerificationError) console.error(error.message);
  else console.error("Admin credential doğrulaması çalıştırılamadı.");
  process.exitCode = 1;
});
