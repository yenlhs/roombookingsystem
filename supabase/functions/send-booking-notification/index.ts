import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  bookingConfirmedEmail,
  bookingCancelledEmail,
  bookingReminderEmail,
  bookingConfirmedText,
  bookingCancelledText,
  bookingReminderText,
} from '../_shared/email-templates.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

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

serve(async (req) => {
  try {
    // Parse request body
    const { bookingId, notificationType }: BookingNotificationRequest = await req.json();

    if (!bookingId || !notificationType) {
      return new Response(
        JSON.stringify({ error: 'bookingId and notificationType are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get booking details with user and room info
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

    // Get user's notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', bookingDetails.user_id)
      .single();

    if (preferencesError) {
      console.warn('Failed to fetch preferences, using defaults:', preferencesError);
    }

    const prefs = preferences || {
      email_enabled: true,
      email_booking_confirmed: true,
      email_booking_cancelled: true,
      email_booking_reminder: true,
      push_enabled: true,
      push_booking_confirmed: true,
      push_booking_cancelled: true,
      push_booking_reminder: true,
    };

    // Determine if we should send email and push
    const shouldSendEmail = prefs.email_enabled && getShouldSendForType(prefs, notificationType, 'email');
    const shouldSendPush = prefs.push_enabled && getShouldSendForType(prefs, notificationType, 'push');

    const results = {
      email: null as any,
      push: null as any,
    };

    // Send email notification
    if (shouldSendEmail && RESEND_API_KEY) {
      try {
        const emailResult = await sendEmailNotification(
          supabase,
          bookingDetails,
          notificationType
        );
        results.email = emailResult;
      } catch (error) {
        console.error('Failed to send email:', error);
        results.email = { success: false, error: String(error) };
      }
    }

    // Send push notification
    if (shouldSendPush && EXPO_ACCESS_TOKEN) {
      try {
        const pushResult = await sendPushNotification(
          supabase,
          bookingDetails,
          notificationType
        );
        results.push = pushResult;
      } catch (error) {
        console.error('Failed to send push notification:', error);
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

function getShouldSendForType(
  prefs: any,
  notificationType: string,
  channel: 'email' | 'push'
): boolean {
  const key = `${channel}_${notificationType}`;
  return prefs[key] !== false; // Default to true if not set
}

async function sendEmailNotification(
  supabase: any,
  booking: BookingDetails,
  notificationType: string
): Promise<any> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

  // Format date and time for email
  const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedStartTime = formatTime(booking.start_time);
  const formattedEndTime = formatTime(booking.end_time);

  const emailData = {
    userName: booking.user.full_name || 'User',
    roomName: booking.room.name,
    bookingDate: formattedDate,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    notes: booking.notes,
    bookingId: booking.id,
  };

  let emailTemplate: { subject: string; html: string };
  let textContent: string;

  switch (notificationType) {
    case 'booking_confirmed':
      emailTemplate = bookingConfirmedEmail(emailData);
      textContent = bookingConfirmedText(emailData);
      break;
    case 'booking_cancelled':
      emailTemplate = bookingCancelledEmail({
        ...emailData,
        cancellationReason: booking.cancellation_reason,
      });
      textContent = bookingCancelledText({
        ...emailData,
        cancellationReason: booking.cancellation_reason,
      });
      break;
    case 'booking_reminder':
      // Calculate minutes until start
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
      const now = new Date();
      const minutesUntilStart = Math.round((bookingDateTime.getTime() - now.getTime()) / 60000);
      emailTemplate = bookingReminderEmail({
        ...emailData,
        minutesUntilStart: Math.max(0, minutesUntilStart),
      });
      textContent = bookingReminderText({
        ...emailData,
        minutesUntilStart: Math.max(0, minutesUntilStart),
      });
      break;
    case 'booking_updated':
      // Reuse confirmed template for updates
      emailTemplate = bookingConfirmedEmail(emailData);
      textContent = bookingConfirmedText(emailData);
      emailTemplate.subject = `Booking Updated: ${emailData.roomName} on ${emailData.bookingDate}`;
      break;
    default:
      throw new Error(`Unknown notification type: ${notificationType}`);
  }

  // Send email via Resend
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Room Booking System <notifications@roombooking.com>',
      to: booking.user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: textContent,
    }),
  });

  const result = await response.json();

  // Log notification
  await supabase.from('notification_log').insert({
    user_id: booking.user_id,
    booking_id: booking.id,
    notification_type: notificationType,
    channel: 'email',
    status: response.ok ? 'sent' : 'failed',
    recipient: booking.user.email,
    subject: emailTemplate.subject,
    body: textContent,
    error_message: response.ok ? null : JSON.stringify(result),
    metadata: result,
    sent_at: response.ok ? new Date().toISOString() : null,
  });

  return {
    success: response.ok,
    ...result,
  };
}

async function sendPushNotification(
  supabase: any,
  booking: BookingDetails,
  notificationType: string
): Promise<any> {
  // Get user's active push tokens
  const { data: tokens, error: tokensError } = await supabase
    .from('push_tokens')
    .select('token, token_type, platform')
    .eq('user_id', booking.user_id)
    .eq('is_active', true);

  if (tokensError || !tokens || tokens.length === 0) {
    console.log('No active push tokens found for user');
    return { success: false, error: 'No push tokens found' };
  }

  // Format notification content
  const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = formatTime(booking.start_time);

  let title: string;
  let body: string;

  switch (notificationType) {
    case 'booking_confirmed':
      title = 'Booking Confirmed!';
      body = `Your booking for ${booking.room.name} on ${formattedDate} at ${formattedTime} has been confirmed`;
      break;
    case 'booking_cancelled':
      title = 'Booking Cancelled';
      body = `Your booking for ${booking.room.name} on ${formattedDate} has been cancelled`;
      break;
    case 'booking_reminder':
      title = 'Booking Reminder';
      body = `Your booking for ${booking.room.name} starts in 15 minutes`;
      break;
    case 'booking_updated':
      title = 'Booking Updated';
      body = `Your booking for ${booking.room.name} has been updated`;
      break;
    default:
      throw new Error(`Unknown notification type: ${notificationType}`);
  }

  // Send to each token
  const results = [];
  for (const tokenData of tokens) {
    try {
      // Only send to Expo tokens
      if (tokenData.token_type !== 'expo') {
        console.log(`Skipping non-Expo token: ${tokenData.token_type}`);
        continue;
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: tokenData.token,
          title,
          body,
          data: {
            bookingId: booking.id,
            roomName: booking.room.name,
            notificationType,
            category: notificationType.includes('reminder') ? 'reminders' : 'bookings',
          },
          sound: 'default',
          priority: 'high',
        }),
      });

      const result = await response.json();

      // Log notification
      await supabase.from('notification_log').insert({
        user_id: booking.user_id,
        booking_id: booking.id,
        notification_type: notificationType,
        channel: 'push',
        status: response.ok ? 'sent' : 'failed',
        recipient: tokenData.token,
        subject: title,
        body: body,
        error_message: response.ok ? null : JSON.stringify(result),
        metadata: result,
        sent_at: response.ok ? new Date().toISOString() : null,
      });

      results.push({
        token: tokenData.token,
        success: response.ok,
        ...result,
      });
    } catch (error) {
      console.error('Failed to send push to token:', error);
      results.push({
        token: tokenData.token,
        success: false,
        error: String(error),
      });
    }
  }

  return {
    success: results.some((r) => r.success),
    tokensSent: results.length,
    results,
  };
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
