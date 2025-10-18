-- Add is_exclusive column to rooms table
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false NOT NULL;

-- Create index for querying exclusive rooms
CREATE INDEX idx_rooms_exclusive ON rooms(is_exclusive) WHERE is_exclusive = true;

-- Create index for active exclusive rooms (most common query)
CREATE INDEX idx_rooms_active_exclusive ON rooms(status, is_exclusive) WHERE status = 'active' AND is_exclusive = true;

-- Comment on column
COMMENT ON COLUMN rooms.is_exclusive IS 'Indicates if room requires premium subscription to book';
