import { PrismaClient, CategoryType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance / Business",
  "Investments",
  "Other Income",
];

const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent / Housing",
  "Groceries",
  "Food & Dining",
  "Transport",
  "Utilities",
  "Bills & Subscriptions",
  "Shopping",
  "Healthcare",
  "Education",
  "Travel",
  "Entertainment",
  "Personal Care",
  "Family",
  "Insurance",
  "Taxes",
  "EMI / Loan",
  "Savings",
  "Laundry",
  "Other Expenses",
];

async function main() {
  console.log("Starting database seeding...");

  const email = process.env.INITIAL_USER_EMAIL || "admin@financetracker.local";
  const rawPassword = process.env.INITIAL_USER_PASSWORD || "ChangeMeSecurely123!";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 1. Seed or retrieve single application user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
    },
  });

  console.log(`User initialized: ${user.email} (ID: ${user.id})`);

  // 2. Seed Default Income Categories
  let incomeCount = 0;
  for (const name of DEFAULT_INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name,
        },
      },
      update: { type: CategoryType.INCOME, active: true },
      create: {
        userId: user.id,
        name,
        type: CategoryType.INCOME,
        active: true,
      },
    });
    incomeCount++;
  }

  // 3. Seed Default Expense Categories
  let expenseCount = 0;
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name,
        },
      },
      update: { type: CategoryType.EXPENSE, active: true },
      create: {
        userId: user.id,
        name,
        type: CategoryType.EXPENSE,
        active: true,
      },
    });
    expenseCount++;
  }

  console.log(`Seeded ${incomeCount} income categories and ${expenseCount} expense categories.`);
  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
