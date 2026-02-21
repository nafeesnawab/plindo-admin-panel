import sgMail from "@sendgrid/mail";

// Configure SendGrid API
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email using SendGrid Web API (no SMTP ports needed).
 */
export const sendEmail = async ({ to, subject, html, text }) => {
	const msg = {
		to,
		from: process.env.EMAIL_FROM || "Plindo <noreply@plindo.app>",
		subject,
		html,
		...(text && { text }),
	};

	try {
		const [response] = await sgMail.send(msg);
		console.log(`📧 Email sent: ${response.statusCode}`);
		return response;
	} catch (err) {
		console.error(`❌ Email error: ${err.message}`);
		if (err.response) {
			console.error(err.response.body);
		}
		throw err;
	}
};

/**
 * Send OTP verification email.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.code - 6-digit OTP code
 * @param {string} options.purpose - 'signup' or 'reset_password'
 */
export const sendOtpEmail = async ({ to, code, purpose }) => {
	const isSignup = purpose === "signup";
	const subject = isSignup
		? "Your Plindo Verification Code"
		: "Reset Your Plindo Password";
	const heading = isSignup ? "Verify Your Account" : "Reset Your Password";
	const bodyText = isSignup
		? "Use the code below to verify your email address and complete your registration."
		: "Use the code below to reset your password. If you did not request this, please ignore this email.";

	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;">PLINDO</h1>
              <p style="margin:6px 0 0;color:#a0aec0;font-size:13px;">Car Wash On Demand</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:600;">${heading}</h2>
              <p style="margin:0 0 28px;color:#4a5568;font-size:15px;line-height:1.6;">${bodyText}</p>
              <!-- OTP Box -->
              <div style="background:#f7f8fc;border:2px dashed #c7d2fe;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your Verification Code</p>
                <p style="margin:0;color:#1a1a2e;font-size:40px;font-weight:700;letter-spacing:10px;">${code}</p>
              </div>
              <p style="margin:0;color:#718096;font-size:13px;line-height:1.6;">
                This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#a0aec0;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} Plindo. All rights reserved.<br />
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

	return sendEmail({
		to,
		subject,
		html,
		text: `${heading}\n\nYour code: ${code}\n\nExpires in 5 minutes.`,
	});
};
