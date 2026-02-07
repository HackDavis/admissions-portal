import nodemailer from 'nodemailer';

const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_PWD = process.env.SENDER_PWD;

// Validate environment variables
if (!SENDER_EMAIL || !SENDER_PWD) {
  const missingVars: string[] = [];
  if (!SENDER_EMAIL) missingVars.push('SENDER_EMAIL');
  if (!SENDER_PWD) missingVars.push('SENDER_PWD');
  console.error('Missing Environment Variable(s): ' + missingVars.join(', '));
}

// Create transporter with Gmail SMTP
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // to reuse connections for multiple emails
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PWD,
  },
});

export const DEFAULT_SENDER = SENDER_EMAIL;
