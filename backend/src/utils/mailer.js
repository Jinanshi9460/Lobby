const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();
  if (!tx || !to) return false;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await tx.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
  return true;
};

module.exports = { sendEmail };
