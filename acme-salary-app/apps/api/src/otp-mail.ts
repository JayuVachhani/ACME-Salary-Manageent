import nodemailer from 'nodemailer';
import type { loadConfig } from './config.js';

function createMailSender(config: ReturnType<typeof loadConfig>) {
  const transport = nodemailer.createTransport({ host: config.SMTP_HOST, port: config.SMTP_PORT,
    secure: config.SMTP_SECURE === 'true', requireTLS: config.NODE_ENV === 'production',
    ...(config.SMTP_USER ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } } : {}),
    connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 5000,
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
  return async (email: string, subject: string, text: string) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await transport.sendMail({ from: config.SMTP_FROM, to: email, subject, text });
        return;
      } catch { if (attempt === 1) throw new Error('OTP delivery failed'); }
    }
  };
}

export function createOtpMailer(config: ReturnType<typeof loadConfig>) {
  const send = createMailSender(config);
  return (email: string, code: string) => send(email, 'Your ACME sign-in code',
    `Your ACME sign-in code is ${code}. It expires in ${config.OTP_TTL_MINUTES} minutes. If you did not request it, ignore this email.`);
}

export function createInvitationMailer(config: ReturnType<typeof loadConfig>) {
  const send = createMailSender(config);
  return (email: string) => send(email, 'You are invited to ACME',
    `You have been invited to ACME Salary Management. Sign in at ${config.APP_ORIGIN} with this email address. Your invitation expires in 7 days. Request your one-time sign-in code in the application.`);
}
