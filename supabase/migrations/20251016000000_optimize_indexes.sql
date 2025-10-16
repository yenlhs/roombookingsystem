-- ============================================
-- Database Performance Optimization
-- Migration: 20251016000000_optimize_indexes
-- Description: Add optimized indexes for common query patterns
-- ============================================

-- ============================================
-- BOOKINGS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for user's booking history queries
-- Optimizes: SELECT * FROM bookings WHERE user_id = ? AND booking_date >= ? ORDER BY booking_date
CREATE INDEX IF NOT EXISTS idx_bookings_user_date_status
  ON public.bookings(user_id, booking_date DESC, status)
  WHERE status != 'cancelled';

-- Composite index for checking room availability
-- Optimizes: SELECT * FROM bookings WHERE room_id = ? AND booking_date = ? AND status = 'confirmed'
CREATE INDEX IF NOT EXISTS idx_bookings_room_date_time
  ON public.bookings(room_id, booking_date, start_time, end_time)
  WHERE status = 'confirmed';

-- Partial index for active/upcoming bookings only (most queries)
-- Reduces index size by excluding completed/cancelled bookings
CREATE INDEX IF NOT EXISTS idx_bookings_active
  ON public.bookings(booking_date, start_time)
  WHERE status = 'confirmed' AND booking_date >= CURRENT_DATE;

-- Index for admin dashboard stats (booking counts by date range)
CREATE INDEX IF NOT EXISTS idx_bookings_date_status_created
  ON public.bookings(booking_date, status, created_at);

-- Index for finding bookings by time range (overlap detection)
CREATE INDEX IF NOT EXISTS idx_bookings_time_overlap
  ON public.bookings USING GIST (
    room_id,
    booking_date,
    tsrange(
      (booking_date || ' ' || start_time::text)::timestamp,
      (booking_date || ' ' || end_time::text)::timestamp
    )
  )
  WHERE status = 'confirmed';

-- ============================================
-- ROOMS TABLE OPTIMIZATIONS
-- ============================================

-- GIN index for JSONB amenities search
-- Optimizes: SELECT * FROM rooms WHERE amenities @> '{"wifi": true}'
CREATE INDEX IF NOT EXISTS idx_rooms_amenities_gin
  ON public.rooms USING GIN (amenities)
  WHERE amenities IS NOT NULL;

-- Partial index for active rooms only (most common query)
CREATE INDEX IF NOT EXISTS idx_rooms_active
  ON public.rooms(name, capacity)
  WHERE status = 'active';

-- Index for capacity-based searches
CREATE INDEX IF NOT EXISTS idx_rooms_capacity
  ON public.rooms(capacity, status)
  WHERE capacity IS NOT NULL AND status = 'active';

-- ============================================
-- USERS TABLE OPTIMIZATIONS
-- ============================================

-- Composite index for admin user management queries
CREATE INDEX IF NOT EXISTS idx_users_role_status_created
  ON public.users(role, status, created_at DESC);

-- Partial index for active users only
CREATE INDEX IF NOT EXISTS idx_users_active
  ON public.users(full_name, email)
  WHERE status = 'active';

-- ============================================
-- PERFORMANCE MONITORING
-- ============================================

-- Enable pg_stat_statements extension for query performance tracking
-- Note: This requires superuser privileges, may need to be done via Supabase dashboard
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- QUERY PERFORMANCE ANALYSIS FUNCTIONS
-- ============================================

-- Function to analyze slow queries (requires pg_stat_statements)
CREATE OR REPLACE FUNCTION public.analyze_slow_queries(min_exec_time_ms integer DEFAULT 100)
RETURNS TABLE (
  query text,
  calls bigint,
  total_time_ms numeric,
  avg_time_ms numeric,
  max_time_ms numeric
) AS $$
BEGIN
  -- This function requires pg_stat_statements extension
  -- Enable it in Supabase Dashboard → Database → Extensions
  RETURN QUERY
  SELECT
    LEFT(q.query, 100) as query,
    q.calls,
    ROUND((q.total_exec_time)::numeric, 2) as total_time_ms,
    ROUND((q.mean_exec_time)::numeric, 2) as avg_time_ms,
    ROUND((q.max_exec_time)::numeric, 2) as max_time_ms
  FROM pg_stat_statements q
  WHERE q.mean_exec_time > min_exec_time_ms
  ORDER BY q.mean_exec_time DESC
  LIMIT 20;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'pg_stat_statements extension not enabled. Enable it in Supabase Dashboard.';
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to check table statistics and recommend vacuuming
CREATE OR REPLACE FUNCTION public.check_table_health()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  total_size text,
  index_size text,
  dead_tuples bigint,
  last_vacuum timestamp,
  last_analyze timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || relname as table_name,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) as total_size,
    pg_size_pretty(pg_indexes_size(schemaname || '.' || relname)) as index_size,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_analyze
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname || '.' || relname) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check index usage and identify unused indexes
CREATE OR REPLACE FUNCTION public.check_index_usage()
RETURNS TABLE (
  table_name text,
  index_name text,
  index_size text,
  index_scans bigint,
  tuples_read bigint,
  tuples_fetched bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename as table_name,
    indexrelname as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VACUUM AND ANALYZE RECOMMENDATIONS
-- ============================================

-- Run ANALYZE to update statistics for query planner
-- This should be run after bulk data loads or significant changes
ANALYZE public.users;
ANALYZE public.rooms;
ANALYZE public.bookings;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_bookings_user_date_status IS 'Optimizes user booking history queries with date and status filters';
COMMENT ON INDEX idx_bookings_room_date_time IS 'Optimizes room availability checks for specific dates and times';
COMMENT ON INDEX idx_bookings_active IS 'Partial index for active confirmed bookings only - reduces index size';
COMMENT ON INDEX idx_bookings_time_overlap IS 'GiST index for efficient time range overlap detection';
COMMENT ON INDEX idx_rooms_amenities_gin IS 'GIN index for fast JSONB amenities searching';
COMMENT ON INDEX idx_rooms_active IS 'Partial index for active rooms - most common query pattern';
COMMENT ON INDEX idx_users_active IS 'Partial index for active users only';

COMMENT ON FUNCTION public.analyze_slow_queries IS 'Analyzes and returns slow queries from pg_stat_statements';
COMMENT ON FUNCTION public.check_table_health IS 'Returns table statistics and maintenance recommendations';
COMMENT ON FUNCTION public.check_index_usage IS 'Returns index usage statistics to identify unused indexes';
