'use strict';

const nodemailer = require('nodemailer');
const env = require('../../config/env');

// MailHog (or any dev SMTP catcher) accepts any connection with no auth and no TLS, so the
// transport is intentionally bare; a real provider would need auth/TLS options added here.
const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false,
});

const sendMail = ({ to, subject, html }) => transporter.sendMail({ from: env.mailFrom, to, subject, html });

module.exports = { sendMail };
