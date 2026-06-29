import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set — cannot send emails");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = "Kartigo <onboarding@resend.dev>";

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kartigo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%); padding: 32px 40px; text-align: center; }
    .logo { display: inline-flex; align-items: center; gap: 6px; }
    .logo-karti { color: #E8890C; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .logo-go { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .body { padding: 40px; }
    .title { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 12px; }
    .text { font-size: 15px; color: #6b7280; line-height: 1.6; margin-bottom: 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #E8890C 0%, #d97706 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; margin: 24px 0; }
    .btn:hover { background: #d97706; }
    .btn-wrap { text-align: center; }
    .link-fallback { font-size: 13px; color: #9ca3af; margin-top: 20px; word-break: break-all; }
    .link-fallback a { color: #2563EB; }
    .divider { border: none; border-top: 1px solid #f3f4f6; margin: 28px 0; }
    .footer { background: #f9fafb; padding: 24px 40px; text-align: center; }
    .footer-text { font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .footer-links { margin-top: 8px; }
    .footer-links a { color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">
        <span class="logo-karti">Karti</span><span class="logo-go">go</span>
      </div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p class="footer-text">You're receiving this email because you signed up for Kartigo.<br />India's favourite shopping destination.</p>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Help Centre</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(to: string, firstName: string | null, verificationUrl: string) {
  const name = firstName ?? "there";
  const html = baseTemplate(`
    <h1 class="title">Verify your email address</h1>
    <p class="text">Hi ${name}! Welcome to Kartigo 🎉</p>
    <p class="text">Click the button below to verify your email address and activate your account. This link expires in <strong>24 hours</strong>.</p>
    <div class="btn-wrap">
      <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    </div>
    <hr class="divider" />
    <p class="link-fallback">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p class="text" style="margin-top: 20px;">If you didn't create an account on Kartigo, you can safely ignore this email.</p>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Verify your Kartigo account",
    html,
  });
}

export async function sendPasswordResetEmail(to: string, firstName: string | null, resetUrl: string) {
  const name = firstName ?? "there";
  const html = baseTemplate(`
    <h1 class="title">Reset your password</h1>
    <p class="text">Hi ${name},</p>
    <p class="text">We received a request to reset the password for your Kartigo account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
    <div class="btn-wrap">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <hr class="divider" />
    <p class="link-fallback">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${resetUrl}">${resetUrl}</a></p>
    <p class="text" style="margin-top: 20px; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Reset your Kartigo password",
    html,
  });
}

export async function sendMagicLinkEmail(to: string, magicUrl: string) {
  const html = baseTemplate(`
    <h1 class="title">Your magic login link ✨</h1>
    <p class="text">Click the button below to log in instantly — no password needed. This link expires in <strong>15 minutes</strong>.</p>
    <div class="btn-wrap">
      <a href="${magicUrl}" class="btn">Click to Login →</a>
    </div>
    <hr class="divider" />
    <p class="link-fallback">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${magicUrl}">${magicUrl}</a></p>
    <p class="text" style="margin-top: 20px; font-size: 13px;">⚠️ This link can only be used once and expires after 15 minutes. If you didn't request this, you can safely ignore this email.</p>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Your Kartigo magic login link",
    html,
  });
}
