import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SEED_ACCOUNTS = [
  { email: "owner@kartigo.com", password: "Owner@123", firstName: "Kartigo", lastName: "Owner", role: "OWNER" as const },
  { email: "admin@kartigo.com", password: "Admin@123", firstName: "Kartigo", lastName: "Admin", role: "ADMIN" as const },
];

export async function seedAdminAccounts() {
  for (const account of SEED_ACCOUNTS) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, account.email));
    if (!existing) {
      const hash = await bcrypt.hash(account.password, 12);
      await db.insert(usersTable).values({
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        passwordHash: hash,
        emailVerified: true,
        role: account.role,
      });
    } else if (existing.role !== account.role) {
      await db.update(usersTable).set({ role: account.role, emailVerified: true }).where(eq(usersTable.id, existing.id));
    }
  }
}
