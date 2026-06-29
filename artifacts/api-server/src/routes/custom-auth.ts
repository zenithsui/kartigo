import { Router, type IRouter, type Request, type Response } from "express";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db, usersTable, emailVerificationTokensTable, passwordResetTokensTable, magicLinkTokensTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { signToken, JWT_COOKIE, JWT_COOKIE_TTL } from "../lib/jwt";
import { sendVerificationEmail, sendPasswordResetEmail, sendMagicLinkEmail } from "../lib/email";

const router: IRouter = Router();

const BCRYPT_ROUNDS = 12;

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost";
  return `${proto}://${host}`;
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(JWT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: JWT_COOKIE_TTL,
  });
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

// POST /api/auth/register
router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password } = req.body as Record<string, string>;

  if (!email || !password || !firstName) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const emailLower = email.toLowerCase().trim();

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower));
  if (existing) {
    if (existing.passwordHash) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    // Account exists from Replit Auth – let them set a password
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db.update(usersTable).set({ passwordHash: hash, firstName, lastName }).where(eq(usersTable.id, existing.id));
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(emailVerificationTokensTable).values({ userId: existing.id, token, expiresAt });
    const verificationUrl = `${getOrigin(req)}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(emailLower, firstName, verificationUrl).catch(() => {});
    res.status(201).json({ success: true, message: "Account created. Please check your email to verify." });
    return;
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const referralCode = generateReferralCode();
  const emailServiceEnabled = !!process.env.RESEND_API_KEY;

  const [user] = await db.insert(usersTable).values({
    email: emailLower,
    firstName,
    lastName: lastName ?? null,
    passwordHash: hash,
    emailVerified: !emailServiceEnabled, // auto-verify when no email service
    referralCode,
  }).returning();

  if (emailServiceEnabled) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(emailVerificationTokensTable).values({ userId: user.id, token, expiresAt });
    const verificationUrl = `${getOrigin(req)}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(emailLower, firstName, verificationUrl).catch(() => {});
    res.status(201).json({ success: true, message: "Account created! Please check your email to verify your address." });
  } else {
    // No email service — log the user in immediately
    const jwtToken = signToken({
      id: user.id, email: user.email, firstName: user.firstName,
      lastName: user.lastName, profileImageUrl: user.profileImageUrl, role: user.role,
    });
    setAuthCookie(res, jwtToken);
    res.status(201).json({ success: true, message: "Account created! You are now signed in.", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as Record<string, string>;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.emailVerified) {
    if (!process.env.RESEND_API_KEY) {
      // No email service — auto-verify and sign in
      await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
    } else {
      // Re-send verification email
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.userId, user.id));
      await db.insert(emailVerificationTokensTable).values({ userId: user.id, token, expiresAt });
      const verificationUrl = `${getOrigin(req)}/api/auth/verify-email?token=${token}`;
      await sendVerificationEmail(emailLower, user.firstName, verificationUrl).catch(() => {});
      res.status(403).json({ error: "Please verify your email address. We've resent the verification link." });
      return;
    }
  }

  const jwtToken = signToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
  });

  setAuthCookie(res, jwtToken);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    },
  });
});

// POST /api/auth/logout
router.post("/auth/logout", (req: Request, res: Response): void => {
  res.clearCookie(JWT_COOKIE, { path: "/" });
  res.json({ success: true });
});

// GET /api/auth/verify-email?token=
router.get("/auth/verify-email", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as Record<string, string>;
  const origin = getOrigin(req);

  if (!token) {
    res.redirect(`${origin}/auth/verify-email?error=missing`);
    return;
  }

  const [record] = await db.select().from(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.token, token));

  if (!record) {
    res.redirect(`${origin}/auth/verify-email?error=invalid`);
    return;
  }

  if (new Date() > record.expiresAt) {
    res.redirect(`${origin}/auth/verify-email?error=expired`);
    return;
  }

  const [user] = await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, record.userId)).returning();
  await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.id, record.id));

  if (!user) {
    res.redirect(`${origin}/auth/verify-email?error=invalid`);
    return;
  }

  const jwtToken = signToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
  });

  setAuthCookie(res, jwtToken);
  res.redirect(`${origin}/auth/verify-email?success=true`);
});

// POST /api/auth/resend-verification
router.post("/auth/resend-verification", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as Record<string, string>;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  const emailLower = email.toLowerCase().trim();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower));

  if (user && !user.emailVerified && user.passwordHash) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.userId, user.id));
    await db.insert(emailVerificationTokensTable).values({ userId: user.id, token, expiresAt });
    const verificationUrl = `${getOrigin(req)}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(emailLower, user.firstName, verificationUrl).catch(() => {});
  }

  // Always return success to avoid email enumeration
  res.json({ success: true, message: "If that email exists, we've sent a new verification link." });
});

// POST /api/auth/forgot-password
router.post("/auth/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as Record<string, string>;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  const emailLower = email.toLowerCase().trim();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower));

  if (user && user.passwordHash) {
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, user.id));
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });
    const resetUrl = `${getOrigin(req)}/auth/reset-password?token=${token}`;
    await sendPasswordResetEmail(emailLower, user.firstName, resetUrl).catch(() => {});
  }

  res.json({ success: true, message: "If that email is registered, you'll receive a reset link shortly." });
});

// POST /api/auth/reset-password
router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as Record<string, string>;

  if (!token || !password) {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [record] = await db.select().from(passwordResetTokensTable).where(
    and(eq(passwordResetTokensTable.token, token), eq(passwordResetTokensTable.used, false))
  );

  if (!record) {
    res.status(400).json({ error: "Invalid or expired reset link" });
    return;
  }

  if (new Date() > record.expiresAt) {
    res.status(400).json({ error: "This reset link has expired. Please request a new one." });
    return;
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [user] = await db.update(usersTable).set({ passwordHash: hash, emailVerified: true }).where(eq(usersTable.id, record.userId)).returning();
  await db.update(passwordResetTokensTable).set({ used: true }).where(eq(passwordResetTokensTable.id, record.id));

  if (!user) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  const jwtToken = signToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
  });

  setAuthCookie(res, jwtToken);
  res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

// POST /api/auth/magic-link/send
router.post("/auth/magic-link/send", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as Record<string, string>;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  const emailLower = email.toLowerCase().trim();

  // Clean up old tokens for this email
  await db.delete(magicLinkTokensTable).where(eq(magicLinkTokensTable.email, emailLower));

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await db.insert(magicLinkTokensTable).values({ email: emailLower, token, expiresAt });

  const magicUrl = `${getOrigin(req)}/api/auth/magic-link/verify?token=${token}`;
  await sendMagicLinkEmail(emailLower, magicUrl).catch(() => {});

  res.json({ success: true, message: "Magic link sent! Check your inbox." });
});

// GET /api/auth/magic-link/verify?token=
router.get("/auth/magic-link/verify", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as Record<string, string>;
  const origin = getOrigin(req);

  if (!token) {
    res.redirect(`${origin}/auth/login?error=missing-token`);
    return;
  }

  const [record] = await db.select().from(magicLinkTokensTable).where(
    and(eq(magicLinkTokensTable.token, token), eq(magicLinkTokensTable.used, false))
  );

  if (!record) {
    res.redirect(`${origin}/auth/login?error=invalid-link`);
    return;
  }

  if (new Date() > record.expiresAt) {
    res.redirect(`${origin}/auth/login?error=link-expired`);
    return;
  }

  await db.update(magicLinkTokensTable).set({ used: true }).where(eq(magicLinkTokensTable.id, record.id));

  // Find or create user
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, record.email));

  if (!user) {
    const emailName = record.email.split("@")[0];
    const referralCode = generateReferralCode();
    const [created] = await db.insert(usersTable).values({
      email: record.email,
      firstName: emailName,
      emailVerified: true,
      referralCode,
    }).returning();
    user = created;
  } else if (!user.emailVerified) {
    [user] = await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id)).returning();
  }

  const jwtToken = signToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
  });

  setAuthCookie(res, jwtToken);
  res.redirect(`${origin}/`);
});

export default router;
