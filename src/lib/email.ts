import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'LeaveLedger <onboarding@resend.dev>';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendInviteEmail(to: string, name: string, inviteUrl: string) {
  const subject = "You've been added to LeaveLedger";
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1e1b4b;">Welcome to LeaveLedger, ${name}</h2>
      <p style="color: #475569;">An account has been created for you. Click below to verify your email and set your password.</p>
      <a href="${inviteUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Activate your account
      </a>
      <p style="color: #94a3b8; font-size: 12px;">This link expires in 48 hours. If you didn't expect this, you can ignore this email.</p>
    </div>
  `;

  if (!resend) {
    // No RESEND_API_KEY configured yet — log instead of failing, so the
    // rest of the flow (account creation, invite token generation) can
    // still be developed and tested end-to-end before a real key exists.
    console.warn(
      `[email:not-configured] Would send invite to ${to}\nSubject: ${subject}\nLink: ${inviteUrl}\n` +
      'Set RESEND_API_KEY in .env to actually send this email.'
    );
    return { success: true, simulated: true };
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    return { success: true, simulated: false };
  } catch (error) {
    console.error('Failed to send invite email:', error);
    return { success: false, simulated: false };
  }
}
