import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // Uses STARTTLS for port 587
    family: 4,     // Forces IPv4 on Render
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

async function maybeSendMail(opts) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log('--- EMAIL (not sent — EMAIL_USER or EMAIL_PASS missing at runtime) ---');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'PRESENT' : 'MISSING');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'PRESENT' : 'MISSING');
    console.log('To:', opts.to);
    console.log('Subject:', opts.subject);
    console.log('----------------------------------------------------------------');
    return;
  }

  try {
    const sender = `"UniHub" <${process.env.EMAIL_USER}>`;
    await transporter.sendMail({ from: sender, ...opts });
    console.log('--- EMAIL SENT SUCCESSFULLY ---');
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