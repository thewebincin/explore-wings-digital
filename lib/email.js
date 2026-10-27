'use strict';
/**
 * Nodemailer wrapper for enquiry alerts, visitor auto-replies,
 * uptime downtime notifications, and weekly summary emails.
 */
const nodemailer = require('nodemailer');
const config = require('./config');
const { Settings } = require('../db/queries');

function getTransporter() {
  const host = Settings.get('smtp_host', config.smtp.host);
  const port = parseInt(Settings.get('smtp_port', String(config.smtp.port)), 10);
  const secure = Settings.get('smtp_secure', String(config.smtp.secure)) === 'true';
  const user = Settings.get('smtp_user', config.smtp.user);
  const pass = Settings.get('smtp_pass', config.smtp.pass);

  if (!host || !user) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  const from = Settings.get('smtp_from', config.smtp.from) || 'Explore Wings <hello@explorewings.com>';

  if (!transporter) {
    console.log(`[email:simulated] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[email:error]', err.message);
    return { success: false, error: err.message };
  }
}

async function notifyNewEnquiry(enquiry) {
  const adminEmail = Settings.get('notification_email', config.adminEmail) || 'hello@explorewings.com';
  const siteName = Settings.get('site_name', 'Explore Wings Digital Technologies');

  const subject = `[New Lead] ${enquiry.name} - ${enquiry.service || 'General Enquiry'}`;
  const text = `
New Project Enquiry received on ${siteName}

Name: ${enquiry.name}
Contact: ${enquiry.contact}
Email: ${enquiry.email || 'N/A'}
Phone: ${enquiry.phone || 'N/A'}
Business: ${enquiry.business_name || 'N/A'}
Service: ${enquiry.service || 'N/A'}
Source: ${enquiry.source} (${enquiry.source_page || '/'})
Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Message / Project Goals:
${enquiry.message || 'No additional notes provided.'}

View and manage this enquiry in the admin panel:
${config.siteUrl}/admin/enquiries/${enquiry.id || ''}
  `.trim();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2ddd5; border-radius: 8px; background: #ffffff;">
      <h2 style="color: #0b3d2e; margin-top: 0;">New Project Enquiry</h2>
      <p style="font-size: 14px; color: #52606d;">A visitor submitted an enquiry via <strong>${enquiry.source}</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #52606d; width: 120px;"><strong>Name:</strong></td><td>${enquiry.name}</td></tr>
        <tr><td style="padding: 8px 0; color: #52606d;"><strong>Contact:</strong></td><td>${enquiry.contact}</td></tr>
        <tr><td style="padding: 8px 0; color: #52606d;"><strong>Business:</strong></td><td>${enquiry.business_name || 'N/A'}</td></tr>
        <tr><td style="padding: 8px 0; color: #52606d;"><strong>Service:</strong></td><td>${enquiry.service || 'General'}</td></tr>
      </table>

      <div style="background: #fbf9f4; padding: 16px; border-radius: 6px; border-left: 3px solid #00a36c; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #14171a;">${(enquiry.message || '').replace(/\n/g, '<br>')}</p>
      </div>

      <a href="${config.siteUrl}/admin/enquiries/${enquiry.id || ''}" style="display: inline-block; background: #00a36c; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">Open Enquiry in Admin</a>
    </div>
  `;

  await sendMail({ to: adminEmail, subject, text, html });

  // Optional visitor auto-reply if email is provided
  if (enquiry.email && Settings.get('auto_reply_enabled', '1') === '1') {
    const autoReplySubject = `Thank you for contacting ${siteName}`;
    const autoReplyText = `
Hello ${enquiry.name},

Thank you for reaching out to Explore Wings Digital Technologies in Trivandrum.

We have received your project details and our team will review your requirements. You will receive a direct response from us within 24 hours.

If your requirement is urgent, you can also reach us directly via WhatsApp at ${Settings.get('whatsapp', '+91 94460 12345')}.

Best regards,
Explore Wings Digital Technologies
Trivandrum, Kerala, India
    `.trim();

    await sendMail({
      to: enquiry.email,
      subject: autoReplySubject,
      text: autoReplyText
    });
  }
}

module.exports = {
  sendMail,
  notifyNewEnquiry,
  getTransporter
};
