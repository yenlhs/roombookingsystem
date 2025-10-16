/**
 * Email Templates for Room Booking System
 * HTML email templates with inline styles for better compatibility
 */

interface BookingEmailData {
  userName: string;
  roomName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  bookingId: string;
}

/**
 * Base email template with consistent styling
 */
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Room Booking Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Room Booking System</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                This is an automated notification from the Room Booking System.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Room Booking System. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Booking Confirmed Email
 */
export function bookingConfirmedEmail(data: BookingEmailData): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #dcfce7; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 40px;">✓</span>
      </div>
      <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px; font-weight: 600;">Booking Confirmed!</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your room has been successfully booked.</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 6px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">Booking Details</h3>

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Room:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.roomName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.bookingDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.startTime} - ${data.endTime}</td>
        </tr>
        ${
          data.notes
            ? `
        <tr>
          <td colspan="2" style="padding: 12px 0 0; color: #6b7280; font-size: 14px;">
            <strong>Notes:</strong><br/>
            <span style="color: #111827;">${data.notes}</span>
          </td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
        <strong>📅 Add to Calendar:</strong> Don't forget to add this booking to your calendar so you don't miss it!
      </p>
    </div>

    <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
      We look forward to seeing you, ${data.userName}! If you need to make any changes or cancel this booking, please do so through the Room Booking System.
    </p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="#" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500; font-size: 14px;">
        View Booking
      </a>
    </div>
  `;

  return {
    subject: `Booking Confirmed: ${data.roomName} on ${data.bookingDate}`,
    html: baseTemplate(content),
  };
}

/**
 * Booking Cancelled Email
 */
export function bookingCancelledEmail(
  data: BookingEmailData & { cancellationReason?: string }
): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #fee2e2; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 40px;">✕</span>
      </div>
      <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px; font-weight: 600;">Booking Cancelled</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your room booking has been cancelled.</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 6px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">Cancelled Booking Details</h3>

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Room:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.roomName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.bookingDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.startTime} - ${data.endTime}</td>
        </tr>
        ${
          data.cancellationReason
            ? `
        <tr>
          <td colspan="2" style="padding: 12px 0 0; color: #6b7280; font-size: 14px;">
            <strong>Cancellation Reason:</strong><br/>
            <span style="color: #111827;">${data.cancellationReason}</span>
          </td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Hi ${data.userName}, this booking has been cancelled. If you didn't request this cancellation or have any questions, please contact support.
    </p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="#" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500; font-size: 14px;">
        Browse Available Rooms
      </a>
    </div>
  `;

  return {
    subject: `Booking Cancelled: ${data.roomName} on ${data.bookingDate}`,
    html: baseTemplate(content),
  };
}

/**
 * Booking Reminder Email
 */
export function bookingReminderEmail(
  data: BookingEmailData & { minutesUntilStart: number }
): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #dbeafe; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 40px;">🔔</span>
      </div>
      <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px; font-weight: 600;">Booking Reminder</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your booking starts in ${data.minutesUntilStart} minutes!</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 6px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">Booking Details</h3>

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Room:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.roomName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.bookingDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${data.startTime} - ${data.endTime}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
        <strong>⏰ Don't be late!</strong> Your booking is coming up soon. Make sure you're ready to start on time.
      </p>
    </div>

    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      See you soon, ${data.userName}!
    </p>
  `;

  return {
    subject: `Reminder: ${data.roomName} booking starts in ${data.minutesUntilStart} minutes`,
    html: baseTemplate(content),
  };
}

/**
 * Plain text versions for email clients that don't support HTML
 */

export function bookingConfirmedText(data: BookingEmailData): string {
  return `
Booking Confirmed!

Hi ${data.userName},

Your room has been successfully booked.

Booking Details:
- Room: ${data.roomName}
- Date: ${data.bookingDate}
- Time: ${data.startTime} - ${data.endTime}
${data.notes ? `- Notes: ${data.notes}` : ''}

We look forward to seeing you! If you need to make any changes or cancel this booking, please do so through the Room Booking System.

---
Room Booking System
© ${new Date().getFullYear()} All rights reserved.
  `.trim();
}

export function bookingCancelledText(data: BookingEmailData & { cancellationReason?: string }): string {
  return `
Booking Cancelled

Hi ${data.userName},

Your room booking has been cancelled.

Cancelled Booking Details:
- Room: ${data.roomName}
- Date: ${data.bookingDate}
- Time: ${data.startTime} - ${data.endTime}
${data.cancellationReason ? `- Cancellation Reason: ${data.cancellationReason}` : ''}

If you didn't request this cancellation or have any questions, please contact support.

---
Room Booking System
© ${new Date().getFullYear()} All rights reserved.
  `.trim();
}

export function bookingReminderText(data: BookingEmailData & { minutesUntilStart: number }): string {
  return `
Booking Reminder

Hi ${data.userName},

Your booking starts in ${data.minutesUntilStart} minutes!

Booking Details:
- Room: ${data.roomName}
- Date: ${data.bookingDate}
- Time: ${data.startTime} - ${data.endTime}

Don't be late! See you soon.

---
Room Booking System
© ${new Date().getFullYear()} All rights reserved.
  `.trim();
}
