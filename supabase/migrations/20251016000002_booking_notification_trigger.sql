-- ============================================
-- Booking Notification Trigger
-- Migration: 20251016000002_booking_notification_trigger
-- Description: Automatically trigger notifications when bookings are created or updated
-- ============================================

-- Function to trigger booking notifications via Edge Function
CREATE OR REPLACE FUNCTION public.trigger_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  should_notify BOOLEAN := false;
BEGIN
  -- Determine notification type based on operation and status change
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') THEN
    notification_type := 'booking_confirmed';
    should_notify := true;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Booking was cancelled
    IF (OLD.status = 'confirmed' AND NEW.status = 'cancelled') THEN
      notification_type := 'booking_cancelled';
      should_notify := true;
    -- Booking was updated (time/date changed)
    ELSIF (
      NEW.status = 'confirmed' AND (
        OLD.booking_date != NEW.booking_date OR
        OLD.start_time != NEW.start_time OR
        OLD.end_time != NEW.end_time OR
        OLD.room_id != NEW.room_id
      )
    ) THEN
      notification_type := 'booking_updated';
      should_notify := true;
    END IF;
  END IF;

  -- Trigger notification if needed
  IF should_notify THEN
    -- Call the edge function asynchronously using pg_net
    -- Note: This requires the pg_net extension
    -- For now, we'll insert into a queue table instead
    INSERT INTO public.notification_queue (
      booking_id,
      notification_type,
      status,
      created_at
    ) VALUES (
      NEW.id,
      notification_type,
      'pending',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification queue table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'booking_confirmed',
      'booking_cancelled',
      'booking_reminder',
      'booking_updated'
    )
  ),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
  ON public.notification_queue(status, created_at)
  WHERE status = 'pending';

-- RLS for notification queue (service role only)
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage notification queue"
  ON public.notification_queue
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_booking_notification_on_insert ON public.bookings;
DROP TRIGGER IF EXISTS trigger_booking_notification_on_update ON public.bookings;

-- Create triggers for bookings table
CREATE TRIGGER trigger_booking_notification_on_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_notification();

CREATE TRIGGER trigger_booking_notification_on_update
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_notification();

-- Function to process notification queue (can be called periodically)
CREATE OR REPLACE FUNCTION public.process_notification_queue(batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
  processed INTEGER,
  succeeded INTEGER,
  failed INTEGER
) AS $$
DECLARE
  v_processed INTEGER := 0;
  v_succeeded INTEGER := 0;
  v_failed INTEGER := 0;
  v_queue_item RECORD;
BEGIN
  -- Get pending notifications
  FOR v_queue_item IN
    SELECT id, booking_id, notification_type
    FROM public.notification_queue
    WHERE status = 'pending'
    ORDER BY created_at
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      -- Mark as processing
      UPDATE public.notification_queue
      SET status = 'processing', last_attempt_at = NOW()
      WHERE id = v_queue_item.id;

      -- Here you would call the edge function
      -- For now, we'll just mark it as completed
      -- In production, you'd use Supabase client to invoke the edge function

      UPDATE public.notification_queue
      SET
        status = 'completed',
        processed_at = NOW()
      WHERE id = v_queue_item.id;

      v_processed := v_processed + 1;
      v_succeeded := v_succeeded + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed
      UPDATE public.notification_queue
      SET
        status = 'failed',
        attempts = attempts + 1,
        error_message = SQLERRM
      WHERE id = v_queue_item.id;

      v_processed := v_processed + 1;
      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_succeeded, v_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.notification_queue IS 'Queue for processing booking notifications asynchronously';
COMMENT ON FUNCTION public.trigger_booking_notification IS 'Trigger function to queue booking notifications';
COMMENT ON FUNCTION public.process_notification_queue IS 'Process pending notification queue items';
