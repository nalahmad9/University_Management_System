// Uses Resend's HTTPS API instead of raw SMTP. Render's free tier blocks
// outbound traffic on SMTP ports (25/465/587), so nodemailer + Gmail SMTP
// times out there — this sends over HTTPS instead, which isn't blocked.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const hasEmailConfig = !!RESEND_API_KEY;

// onboarding@resend.dev works out of the box with no domain setup, but only
// delivers to the email address you signed up to Resend with. Once you verify
// your own domain in the Resend dashboard, set EMAIL_FROM to an address on it
// (e.g. "UniHub <noreply@yourdomain.com>") to send to any recipient.
const SENDER = process.env.EMAIL_FROM || 'UniHub <onboarding@resend.dev>';

async function maybeSendMail(opts) {
  if (!hasEmailConfig) {
    console.log('--- EMAIL (not sent — configure RESEND_API_KEY env var) ---');
    console.log('To:', opts.to);
    console.log('Subject:', opts.subject);
    console.log('----------------------------------------------------------------');
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SENDER,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || `Resend API error (${res.status})`);
    console.log('--- EMAIL SENT SUCCESSFULLY ---', data.id);
  } catch (error) {
    console.error('--- DETAILED EMAIL ERROR ---', error);
  }
}

export async function sendCredentialsEmail({ to, firstName, universityEmail, password, role }) {
  await maybeSendMail({
    to,
    subject: 'Your UniHub account is ready',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome to UniHub, ${firstName}!</h2>
        <p>Your ${role} account has been created. Use the credentials below to sign in:</p>
        <table style="margin: 16px 0; border-collapse: collapse;">
          <tr><td style="padding:4px 8px;"><strong>University email</strong></td><td style="padding:4px 8px;">${universityEmail}</td></tr>
          <tr><td style="padding:4px 8px;"><strong>Password</strong></td><td style="padding:4px 8px;">${password}</td></tr>
        </table>
        <p>Please log in and change your password as soon as possible.</p>
        <p><a href="${process.env.CLIENT_URL}/login">Go to login</a></p>
      </div>
    `,
  });
}

export async function sendResetEmail({ to, resetLink }) {
  await maybeSendMail({
    to,
    subject: 'Reset your UniHub password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Password reset requested</h2>
        <p>Click the link below to set a new password. This link expires in 30 minutes.</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendNotificationEmail({ to, subject, body, link }) {
  await maybeSendMail({
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <p style="font-size: 15px; line-height: 1.5;">${body}</p>
        ${link ? `<p><a href="${process.env.CLIENT_URL}${link}" style="display:inline-block;padding:10px 20px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:6px;">View on UniHub</a></p>` : ''}
        <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;" />
        <p style="font-size:12px;color:#9ca3af;">UniHub — University Management System</p>
      </div>
    `,
  });
}