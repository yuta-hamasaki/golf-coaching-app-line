import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin1234";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  const coach = await prisma.coach.upsert({
    where: { email: "coach@example.com" },
    update: {},
    create: {
      name: "サンプルコーチ",
      email: "coach@example.com",
      bio: "PGA認定プロ。初心者から上級者まで丁寧に指導します。",
    },
  });

  await prisma.lessonPlan.upsert({
    where: { id: "seed-trial-lesson" },
    update: {},
    create: {
      id: "seed-trial-lesson",
      name: "体験レッスン（60分）",
      description: "初回限定の体験レッスンです",
      durationMin: 60,
      price: 8000,
      billingType: "ONE_TIME",
      isActive: true,
    },
  });

  await prisma.lessonPlan.upsert({
    where: { id: "seed-monthly-plan" },
    update: {},
    create: {
      id: "seed-monthly-plan",
      name: "月4回コーチングプラン",
      description: "月額サブスクリプション（準備中）",
      durationMin: 60,
      price: 28000,
      billingType: "SUBSCRIPTION",
      isActive: true,
    },
  });

  console.log("Seed completed:");
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  Coach: ${coach.name} (${coach.email})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
