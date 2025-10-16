import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// Email template types
interface BookingEmailData {
  userName: string;
  roomName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  bookingId: string;
}

// Notification request types
interface BookingNotificationRequest {
  bookingId: string;
  notificationType: 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'booking_updated';
}

interface BookingDetails {
  id: string;
  user_id: string;
  room_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: string;
  cancellation_reason?: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  room: {
    id: string;
    name: string;
  };
}

// Email template functions (inlined from _shared/email-templates.ts)
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
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Room Booking System</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
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

function bookingConfirmedEmail(data: BookingEmailData): { subject: string; html: string } {
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
      </table>
    </div>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      We look forward to seeing you, ${data.userName}!
    </p>
  `;

  return {
    subject: `Booking Confirmed: ${data.roomName} on ${data.bookingDate}`,
    html: baseTemplate(content),
  };
}

function bookingConfirmedText(data: BookingEmailData): string {
  return `Booking Confirmed!\n\nHi ${data.userName},\n\nYour room has been successfully booked.\n\nBooking Details:\n- Room: ${data.roomName}\n- Date: ${data.bookingDate}\n- Time: ${data.startTime} - ${data.endTime}`;
}

function bookingCancelledEmail(data: BookingEmailData & { cancellationReason?: string }): { subject: string; html: string } {
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
      </table>
    </div>
  `;

  return {
    subject: `Booking Cancelled: ${data.roomName} on ${data.bookingDate}`,
    html: baseTemplate(content),
  };
}

function bookingCancelledText(data: BookingEmailData & { cancellationReason?: string }): string {
  return `Booking Cancelled\n\nHi ${data.userName},\n\nYour room booking has been cancelled.\n\nCancelled Booking Details:\n- Room: ${data.roomName}\n- Date: ${data.bookingDate}\n- Time: ${data.startTime} - ${data.endTime}`;
}

function bookingReminderEmail(data: BookingEmailData & { minutesUntilStart: number }): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #dbeafe; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 40px;">🔔</span>
      </div>
      <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px; font-weight: 600;">Booking Reminder</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your booking starts in ${data.minutesUntilStart} minutes!</p>
    </div>
  `;

  return {
    subject: `Reminder: ${data.roomName} booking starts in ${data.minutesUntilStart} minutes`,
    html: baseTemplate(content),
  };
}

function bookingReminderText(data: BookingEmailData & { minutesUntilStart: number }): string {
  return `Booking Reminder\n\nHi ${data.userName},\n\nYour booking starts in ${data.minutesUntilStart} minutes!\n\nBooking Details:\n- Room: ${data.roomName}\n- Date: ${data.bookingDate}\n- Time: ${data.startTime} - ${data.endTime}`;
}

// Main handler
serve(async (req) => {
  try {
    const { bookingId, notificationType }: BookingNotificationRequest = await req.json();

    if (!bookingId || !notificationType) {
      return new Response(
        JSON.stringify({ error: 'bookingId and notificationType are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users!bookings_user_id_fkey(id, email, full_name),
        room:rooms!bookings_room_id_fkey(id, name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Failed to fetch booking:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bookingDetails = booking as unknown as BookingDetails;

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', bookingDetails.user_id)
      .single();

    const prefs = preferences || {
      email_enabled: true,
      push_enabled: true,
    };

    const results = {
      email: null as any,
      push: null as any,
    };

    // Send email notification
    if (prefs.email_enabled && RESEND_API_KEY) {
      try {
        const formattedDate = new Date(bookingDetails.booking_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const [hours, minutes] = bookingDetails.start_time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const formattedTime = `${displayHour}:${minutes} ${ampm}`;

        const emailData = {
          userName: bookingDetails.user.full_name || 'User',
          roomName: bookingDetails.room.name,
          bookingDate: formattedDate,
          startTime: formattedTime,
          endTime: formattedTime,
          bookingId: bookingDetails.id,
        };

        let emailTemplate: { subject: string; html: string };
        let textContent: string;

        switch (notificationType) {
          case 'booking_confirmed':
            emailTemplate = bookingConfirmedEmail(emailData);
            textContent = bookingConfirmedText(emailData);
            break;
          case 'booking_cancelled':
            emailTemplate = bookingCancelledEmail(emailData);
            textContent = bookingCancelledText(emailData);
            break;
          case 'booking_reminder':
            emailTemplate = bookingReminderEmail({ ...emailData, minutesUntilStart: 15 });
            textContent = bookingReminderText({ ...emailData, minutesUntilStart: 15 });
            break;
          case 'booking_updated':
            emailTemplate = bookingConfirmedEmail(emailData);
            textContent = bookingConfirmedText(emailData);
            emailTemplate.subject = `Booking Updated: ${emailData.roomName} on ${emailData.bookingDate}`;
            break;
          default:
            throw new Error(`Unknown notification type: ${notificationType}`);
        }

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Room Booking System <onboarding@resend.dev>',
            to: bookingDetails.user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: textContent,
          }),
        });

        const result = await response.json();
        results.email = { success: response.ok, ...result };

        await supabase.from('notification_log').insert({
          user_id: bookingDetails.user_id,
          booking_id: bookingDetails.id,
          notification_type: notificationType,
          channel: 'email',
          status: response.ok ? 'sent' : 'failed',
          recipient: bookingDetails.user.email,
          subject: emailTemplate.subject,
          body: textContent,
          error_message: response.ok ? null : JSON.stringify(result),
          metadata: result,
          sent_at: response.ok ? new Date().toISOString() : null,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
        results.email = { success: false, error: String(error) };
      }
    }

    // Send push notification
    if (prefs.push_enabled) {
      try {
        const { data: tokens } = await supabase
          .from('push_tokens')
          .select('token, token_type, platform')
          .eq('user_id', bookingDetails.user_id)
          .eq('is_active', true);

        if (tokens && tokens.length > 0) {
          const pushResults = [];
          for (const tokenData of tokens) {
            if (tokenData.token_type === 'expo') {
              const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: tokenData.token,
                  title: notificationType === 'booking_confirmed' ? 'Booking Confirmed!' : 'Booking Cancelled',
                  body: `Your booking for ${bookingDetails.room.name} has been ${notificationType === 'booking_confirmed' ? 'confirmed' : 'cancelled'}`,
                  data: { bookingId: bookingDetails.id, roomName: bookingDetails.room.name },
                  sound: 'default',
                  priority: 'high',
                }),
              });

              const result = await response.json();
              pushResults.push({ success: response.ok, ...result });
            }
          }
          results.push = { success: pushResults.some((r) => r.success), results: pushResults };
        }
      } catch (error) {
        console.error('Failed to send push:', error);
        results.push = { success: false, error: String(error) };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId,
        notificationType,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-booking-notification:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
