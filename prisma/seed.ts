import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const products = [
  { code: "red", name: "Red set", price: 50 },
  { code: "green", name: "Green set", price: 40 },
  { code: "blue", name: "Blue set", price: 30 },
  { code: "yellow", name: "Yellow set", price: 50 },
  { code: "pink", name: "Pink set", price: 80 },
  { code: "purple", name: "Purple set", price: 90 },
  { code: "orange", name: "Orange set", price: 120 },
];

const members = [
  { cardNumber: "MEMBER001", name: "Alice Johnson", isActive: true },
  { cardNumber: "MEMBER002", name: "Bob Smith", isActive: true },
  { cardNumber: "MEMBER003", name: "Charlie Brown", isActive: false },
];

async function main() {
  console.log("Seeding database...");

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products`);

  for (const member of members) {
    await prisma.member.upsert({
      where: { cardNumber: member.cardNumber },
      update: member,
      create: member,
    });
  }
  console.log(`Seeded ${members.length} members`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
