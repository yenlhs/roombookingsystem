# Database Optimization Guide

## Overview

This document outlines the database optimization strategies, indexes, and best practices for the Room Booking System.

## Index Strategy

### Current Optimizations

#### Bookings Table

- **`idx_bookings_user_date_status`**: Composite index for user booking history queries with date and status filters
- **`idx_bookings_room_date_time`**: Optimizes room availability checks for specific dates and times
- **`idx_bookings_active`**: Partial index for confirmed bookings on/after current date (reduces index size)
- **`idx_bookings_date_status_created`**: Supports admin dashboard statistics queries
- **`idx_bookings_time_overlap`**: GiST index for efficient time range overlap detection

#### Rooms Table

- **`idx_rooms_amenities_gin`**: GIN index for JSONB amenities searching (`WHERE amenities @> '{"wifi": true}'`)
- **`idx_rooms_active`**: Partial index for active rooms with name and capacity
- **`idx_rooms_capacity`**: Supports capacity-based searches for active rooms

#### Users Table

- **`idx_users_role_status_created`**: Composite index for admin user management queries
- **`idx_users_active`**: Partial index for active users with name and email

## Query Optimization Guidelines

### 1. Booking Availability Checks

**Optimized Query:**

```sql
-- Check if room is available for a specific time slot
SELECT EXISTS (
  SELECT 1
  FROM bookings
  WHERE room_id = $1
    AND booking_date = $2
    AND status = 'confirmed'
    AND (
      (start_time, end_time) OVERLAPS ($3::time, $4::time)
    )
) as is_booked;
```

**Index Used:** `idx_bookings_room_date_time`, `idx_bookings_time_overlap`

### 2. User Booking History

**Optimized Query:**

```sql
-- Get user's upcoming bookings
SELECT *
FROM bookings
WHERE user_id = $1
  AND booking_date >= CURRENT_DATE
  AND status != 'cancelled'
ORDER BY booking_date ASC, start_time ASC
LIMIT 50;
```

**Index Used:** `idx_bookings_user_date_status`

### 3. Room Search with Amenities

**Optimized Query:**

```sql
-- Find rooms with specific amenities
SELECT *
FROM rooms
WHERE status = 'active'
  AND capacity >= $1
  AND amenities @> '{"wifi": true, "projector": true}'::jsonb
ORDER BY capacity ASC;
```

**Index Used:** `idx_rooms_active`, `idx_rooms_amenities_gin`

### 4. Admin Dashboard Statistics

**Optimized Query:**

```sql
-- Get booking statistics for date range
SELECT
  booking_date,
  status,
  COUNT(*) as booking_count
FROM bookings
WHERE booking_date BETWEEN $1 AND $2
GROUP BY booking_date, status
ORDER BY booking_date DESC;
```

**Index Used:** `idx_bookings_date_status_created`

## Performance Monitoring

### Built-in Functions

#### 1. Analyze Slow Queries

```sql
-- Find queries taking longer than 100ms on average
SELECT * FROM public.analyze_slow_queries(100);
```

**Requirements:** Enable `pg_stat_statements` extension in Supabase Dashboard → Database → Extensions

#### 2. Check Table Health

```sql
-- Review table statistics and identify maintenance needs
SELECT * FROM public.check_table_health();
```

**What to Look For:**

- High `dead_tuples` count (indicates need for VACUUM)
- `last_vacuum` or `last_analyze` is NULL or old (run ANALYZE)
- Disproportionate index size vs table size

#### 3. Check Index Usage

```sql
-- Identify unused or rarely used indexes
SELECT * FROM public.check_index_usage();
```

**What to Look For:**

- Indexes with `index_scans` = 0 (unused indexes consuming space)
- Large indexes with low scan counts (candidates for removal)

### Manual Performance Analysis

#### Explain Query Plans

```sql
-- Always use EXPLAIN ANALYZE for query optimization
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM bookings
WHERE room_id = 'uuid-here'
  AND booking_date = '2025-10-16'
  AND status = 'confirmed';
```

**Key Metrics to Monitor:**

- **Execution Time**: Should be < 10ms for simple queries, < 100ms for complex
- **Index Scan vs Seq Scan**: Index scans are faster for selective queries
- **Rows Returned vs Rows Scanned**: Should be similar (indicates good index selectivity)

## Best Practices

### 1. Query Patterns

✅ **DO:**

- Use prepared statements to enable query plan caching
- Add `LIMIT` clauses to paginated queries
- Use partial indexes for frequently filtered columns
- Leverage covering indexes to avoid table lookups

❌ **DON'T:**

- Use `SELECT *` when you only need specific columns
- Filter on computed columns without function indexes
- Use `OR` conditions that span multiple indexes (use UNION instead)
- Fetch all records without pagination

### 2. JSONB Usage

✅ **DO:**

```sql
-- Efficient JSONB containment query
WHERE amenities @> '{"wifi": true}'

-- Use jsonb_path_query for complex extraction
WHERE jsonb_path_exists(amenities, '$.features[*] ? (@ == "parking")')
```

❌ **DON'T:**

```sql
-- Inefficient: casting and string operations
WHERE amenities::text LIKE '%wifi%'

-- Inefficient: extracting and comparing
WHERE (amenities->>'wifi')::boolean = true
```

### 3. Date and Time Queries

✅ **DO:**

```sql
-- Use date comparisons directly
WHERE booking_date >= CURRENT_DATE

-- Use time range checks with OVERLAPS
WHERE (start_time, end_time) OVERLAPS ($1::time, $2::time)
```

❌ **DON'T:**

```sql
-- Avoid date/time conversions that prevent index usage
WHERE DATE(created_at) = CURRENT_DATE

-- Avoid timestamp math without indexes
WHERE created_at > NOW() - INTERVAL '7 days'
```

### 4. Connection Pooling

The application uses Supabase's built-in connection pooling, but keep in mind:

- **Transaction Mode**: Best for short queries (< 100ms)
- **Session Mode**: Use for transactions and prepared statements
- **Statement Timeout**: Set timeouts to prevent long-running queries

## Maintenance Schedule

### Daily (Automated by Supabase)

- Auto-vacuum runs when 20% of rows are dead tuples
- Statistics updated on INSERT/UPDATE operations

### Weekly (Recommended)

```sql
-- Update query planner statistics
ANALYZE public.users;
ANALYZE public.rooms;
ANALYZE public.bookings;
```

### Monthly (Recommended)

```sql
-- Check for unused indexes
SELECT * FROM public.check_index_usage() WHERE index_scans < 10;

-- Review slow queries
SELECT * FROM public.analyze_slow_queries(50);

-- Check table health
SELECT * FROM public.check_table_health();
```

### Quarterly (As Needed)

```sql
-- Full vacuum (requires maintenance window)
VACUUM FULL ANALYZE public.bookings;
```

## Caching Strategy

### Application-Level Caching

1. **Static Data** (rooms, user profiles):
   - Cache TTL: 5-10 minutes
   - Invalidate on updates

2. **Dashboard Statistics**:
   - Cache TTL: 1-5 minutes
   - Acceptable staleness for analytics

3. **Room Availability**:
   - Do NOT cache (real-time data)
   - Use optimized queries instead

### Supabase Caching

Supabase automatically caches:

- Query results for authenticated requests (short TTL)
- Static assets and schemas
- Realtime subscriptions use WebSocket connections

## Scaling Considerations

### When to Consider Scaling

Monitor these metrics in Supabase Dashboard:

1. **Query Performance**
   - Average query time > 100ms
   - P95 query time > 500ms

2. **Connection Pool**
   - Connection pool exhaustion (503 errors)
   - Waiting connections > 10

3. **Database Size**
   - Database > 80% of allocated storage
   - Index size > 50% of table size

### Vertical Scaling Options

1. **Supabase Pro Plan**
   - Dedicated database instance
   - More CPU and memory
   - Custom connection limits

2. **Read Replicas**
   - Offload read-heavy queries
   - Separate analytics workload

### Horizontal Scaling Strategies

1. **Sharding** (Future Consideration)
   - Shard by tenant/organization
   - Shard by date range (archive old bookings)

2. **Materialized Views**
   - Pre-compute dashboard statistics
   - Refresh periodically

## Monitoring Alerts

Set up alerts in Supabase Dashboard for:

- Query time > 1 second (99th percentile)
- Connection pool utilization > 80%
- Database size > 80% capacity
- Failed queries > 5% of total
- Dead tuples > 100,000

## Resources

- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Supabase Performance Documentation](https://supabase.com/docs/guides/platform/performance)
- [PostgreSQL Explain Visualizer](https://explain.dalibo.com/)
- [Index Advisor Tools](https://github.com/supabase/index_advisor)

## Questions?

For database optimization questions or performance issues, refer to this guide and run the monitoring functions to identify bottlenecks.
