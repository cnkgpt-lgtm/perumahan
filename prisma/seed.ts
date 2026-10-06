// Seed awal SISTER: admin dari env + pengaturan default.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "password";
  const name = process.env.ADMIN_NAME || "Pengurus";

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      isActive: true,
    },
  });

  const defaults: Record<string, string> = {
    site_name: "SISTER",
    site_tagline: "Sistem Informasi Cluster",
    address: "",
    treasurer_contact: "",
    payment_info: "",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log(`Seed selesai. Admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
