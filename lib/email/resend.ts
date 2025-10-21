import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email via Resend
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * Send inquiry approval email to client
 */
export async function sendInquiryApprovalEmail({
  clientName,
  clientEmail,
  venueName,
  eventDate,
  eventTime,
  spaceNames,
  guestCount,
  venueNotes,
  confirmationToken,
}: {
  clientName: string;
  clientEmail: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  spaceNames: string[];
  guestCount: number;
  venueNotes?: string;
  confirmationToken: string;
}) {
  const confirmationUrl = `${APP_URL}/auth/client/confirm/${confirmationToken}`;
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your booking is confirmed!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Booking Confirmed!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${clientName},
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.5;">
                Great news! <strong>${venueName}</strong> has confirmed your booking request.
              </p>

              <!-- Event Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">Event Details</h2>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${eventTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Space:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${spaceNames.join(', ')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Guests:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${guestCount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${venueNotes ? `
                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
                  <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">Message from ${venueName}:</p>
                  <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.5;">${venueNotes}</p>
                </div>
              ` : ''}

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">
                To secure your booking and start planning, please create your account within the next <strong>48 hours</strong>:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Create Account & Confirm Booking
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #374151; font-size: 14px; line-height: 1.5;">
                After confirming, you'll be able to:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 24px; color: #374151; font-size: 14px; line-height: 1.8;">
                <li>Chat with your AI event assistant</li>
                <li>Customize your event details</li>
                <li>Manage your guest list</li>
                <li>Review and approve vendors</li>
                <li>Track your budget</li>
              </ul>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                If you don't confirm within 48 hours, this booking may be offered to another client.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                Looking forward to hosting your event!<br>
                <strong>${venueName}</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                If you have any questions, please reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Your booking at ${venueName} is confirmed! 🎉`,
    html,
  });
}

/**
 * Send inquiry decline email to client
 */
export async function sendInquiryDeclineEmail({
  clientName,
  clientEmail,
  venueName,
  eventDate,
  declineReason,
  alternativeDates,
}: {
  clientName: string;
  clientEmail: string;
  venueName: string;
  eventDate: string;
  declineReason: string;
  alternativeDates?: Array<{ date: string; time: string; notes?: string }>;
}) {
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const alternativeDatesHTML = alternativeDates && alternativeDates.length > 0 ? `
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px; color: #065f46; font-size: 14px; font-weight: 600;">We'd love to host you on an alternative date:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${alternativeDates.map(alt => {
          const altDate = new Date(alt.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          return `
            <tr>
              <td style="padding: 8px 0; color: #047857; font-size: 14px;">
                📅 ${altDate} at ${alt.time}
                ${alt.notes ? `<br><span style="color: #059669; font-size: 13px;">${alt.notes}</span>` : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </table>
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Request Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #6b7280; padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Booking Request Update</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${clientName},
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.5;">
                Thank you for your interest in <strong>${venueName}</strong>. We've reviewed your booking request for ${formattedDate}.
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">Unfortunately, we're unable to accommodate this request:</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">${declineReason}</p>
              </div>

              ${alternativeDatesHTML}

              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">
                We appreciate your understanding and hope to have the opportunity to host your event in the future.
              </p>

              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.5;">
                If you have any questions or would like to discuss alternative options, please don't hesitate to reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                Best regards,<br>
                <strong>${venueName}</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Update on your booking request at ${venueName}`,
    html,
  });
}

/**
 * Send new inquiry notification to venue
 */
export async function sendNewInquiryNotification({
  venueName,
  venueEmail,
  clientName,
  eventDate,
  eventTime,
  guestCount,
  referenceNumber,
}: {
  venueName: string;
  venueEmail: string;
  clientName: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  referenceNumber: string;
}) {
  const tasksUrl = `${APP_URL}/venue/tasks`;
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Inquiry</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">📬 New Booking Inquiry</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${venueName} team,
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.5;">
                You have a new booking inquiry waiting for your review.
              </p>

              <!-- Inquiry Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Client:</td>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 600; text-align: right;">${clientName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Event Date:</td>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate} at ${eventTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Guest Count:</td>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 600; text-align: right;">${guestCount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Reference:</td>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 600; text-align: right;">${referenceNumber}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${tasksUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Review Inquiry
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                Please review and respond within 24 hours for the best client experience.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                This is an automated notification from your event management system.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: venueEmail,
    subject: `🔔 New booking inquiry from ${clientName}`,
    html,
  });
}
