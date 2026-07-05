import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated";

const DEFAULT_ADMIN_ROLE = "admin";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be configured");
  }

  const email = normalizeEmail(getRequiredEnv("SEED_ADMIN_EMAIL"));
  const password = getRequiredEnv("SEED_ADMIN_PASSWORD");
  const role = process.env.SEED_ADMIN_ROLE?.trim() || DEFAULT_ADMIN_ROLE;
  const overwriteExisting = isEnabled(process.env.SEED_ADMIN_OVERWRITE);

  if (password.length < 8 || password.length > 72) {
    throw new Error("SEED_ADMIN_PASSWORD must be 8-72 characters");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const existingUser = await prisma.user.findUnique({
      select: { id: true },
      where: { email },
    });

    if (existingUser && !overwriteExisting) {
      console.log(`Seed user ${email} already exists; skipping update`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (existingUser) {
      await prisma.user.update({
        data: {
          passwordHash,
          role,
        },
        where: { email },
      });

      console.log(`Updated seed user ${email} with role ${role}`);
      return;
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
      },
    });

    console.log(`Created seed user ${email} with role ${role}`);
  } finally {
    await prisma.$disconnect();
  }
}

function getRequiredEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} must be configured for seeding`);
  }

  return value;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEnabled(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
