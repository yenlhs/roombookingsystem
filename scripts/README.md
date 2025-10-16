# Database Scripts

Utility scripts for database management and monitoring.

## Available Scripts

### check-db-health.sql

Comprehensive database health check that analyzes:
- Table statistics and vacuum needs
- Index usage and efficiency
- Slow query identification
- Database and table sizes
- Connection pool status
- Cache hit ratios
- Table row counts and dead tuples

**Usage:**

Via Supabase SQL Editor:
```sql
-- Copy and paste the contents of check-db-health.sql
```

Via psql (if direct database access):
```bash
psql "postgresql://..." -f scripts/check-db-health.sql
```

**Frequency:** Run weekly or when investigating performance issues

**What to Look For:**
- Dead row percentage > 10% (needs VACUUM)
- Cache hit ratio < 99% (may need more memory)
- Unused indexes (candidates for removal)
- Slow queries > 100ms average

## Database Optimization

For comprehensive database optimization guidelines, see:
- [DATABASE_OPTIMIZATION.md](../docs/DATABASE_OPTIMIZATION.md)

## Migrations

Database migrations are located in:
- `supabase/migrations/`

Latest optimization migration:
- `20251016000000_optimize_indexes.sql` - Performance indexes and monitoring functions

## Troubleshooting

### High Query Times
1. Run `check-db-health.sql` to identify slow queries
2. Use `EXPLAIN ANALYZE` on problematic queries
3. Check if appropriate indexes exist
4. Review query patterns in application code

### High Dead Tuple Count
```sql
-- Run VACUUM ANALYZE on affected tables
VACUUM ANALYZE public.bookings;
VACUUM ANALYZE public.rooms;
VACUUM ANALYZE public.users;
```

### Connection Pool Exhaustion
1. Check active connections in health report
2. Verify application properly closes connections
3. Consider increasing connection limit in Supabase
4. Review long-running queries

### Low Cache Hit Ratio
1. Check if queries use indexes (EXPLAIN ANALYZE)
2. Verify sufficient RAM allocated
3. Consider read replicas for heavy read workloads

## Monitoring Functions

These functions are available after running the optimization migration:

### analyze_slow_queries(min_exec_time_ms)
```sql
-- Find queries averaging > 100ms
SELECT * FROM public.analyze_slow_queries(100);
```

### check_table_health()
```sql
-- Review table statistics
SELECT * FROM public.check_table_health();
```

### check_index_usage()
```sql
-- Identify unused indexes
SELECT * FROM public.check_index_usage() WHERE index_scans < 10;
```

## Best Practices

1. **Regular Monitoring**
   - Run health checks weekly
   - Monitor query performance in Supabase Dashboard
   - Set up alerts for critical metrics

2. **Index Management**
   - Review index usage quarterly
   - Drop unused indexes
   - Add indexes for common query patterns

3. **Maintenance**
   - ANALYZE tables after bulk data loads
   - VACUUM if dead tuple percentage > 10%
   - Keep Postgres version updated

4. **Query Optimization**
   - Use prepared statements
   - Add LIMIT clauses for pagination
   - Avoid SELECT * when possible
   - Test queries with EXPLAIN ANALYZE

## Resources

- [Supabase Performance Guide](https://supabase.com/docs/guides/platform/performance)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Project Database Optimization Guide](../docs/DATABASE_OPTIMIZATION.md)
