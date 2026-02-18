import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send an email using the configured SMTP transport.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    ...(text && { text }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Email error: ${err.message}`);
    throw err;
  }
};

export default transporter;
