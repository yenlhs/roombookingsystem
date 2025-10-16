-- ============================================
-- Database Health Check Script
-- Run this periodically to monitor database performance
-- ============================================

\echo ''
\echo '=========================================='
\echo 'DATABASE HEALTH CHECK'
\echo '=========================================='
\echo ''

-- Table Statistics
\echo '1. TABLE HEALTH:'
\echo '   - Check for dead tuples and vacuum needs'
\echo ''
SELECT * FROM public.check_table_health();

\echo ''
\echo '=========================================='
\echo ''

-- Index Usage
\echo '2. INDEX USAGE:'
\echo '   - Identify unused or rarely used indexes'
\echo ''
SELECT *
FROM public.check_index_usage()
WHERE index_scans < 100
ORDER BY index_scans ASC;

\echo ''
\echo '=========================================='
\echo ''

-- Slow Queries (requires pg_stat_statements)
\echo '3. SLOW QUERIES (avg > 50ms):'
\echo '   - Requires pg_stat_statements extension'
\echo ''
SELECT * FROM public.analyze_slow_queries(50);

\echo ''
\echo '=========================================='
\echo ''

-- Database Size
\echo '4. DATABASE SIZE:'
\echo ''
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_size_pretty(sum(pg_total_relation_size(schemaname || '.' || tablename))) as tables_size,
  pg_size_pretty(sum(pg_indexes_size(schemaname || '.' || tablename))) as indexes_size
FROM pg_tables
WHERE schemaname = 'public';

\echo ''
\echo '=========================================='
\echo ''

-- Active Connections
\echo '5. ACTIVE CONNECTIONS:'
\echo ''
SELECT
  state,
  COUNT(*) as connection_count,
  MAX(now() - state_change) as longest_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

\echo ''
\echo '=========================================='
\echo ''

-- Cache Hit Ratio
\echo '6. CACHE HIT RATIO (should be > 99%):'
\echo ''
SELECT
  'index hit rate' as metric,
  ROUND(
    (sum(idx_blks_hit)) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) * 100,
    2
  ) as ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT
  'table hit rate' as metric,
  ROUND(
    (sum(heap_blks_hit)) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) * 100,
    2
  ) as ratio
FROM pg_statio_user_tables;

\echo ''
\echo '=========================================='
\echo ''

-- Table Row Counts
\echo '7. TABLE ROW COUNTS:'
\echo ''
SELECT
  schemaname || '.' || relname as table_name,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup, 0), 2) as dead_row_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

\echo ''
\echo '=========================================='
\echo 'HEALTH CHECK COMPLETE'
\echo '=========================================='
\echo ''
\echo 'RECOMMENDATIONS:'
\echo '- If dead_row_percent > 10%, run VACUUM ANALYZE'
\echo '- If cache hit ratio < 99%, consider increasing shared_buffers'
\echo '- If unused indexes found, consider dropping them'
\echo '- If slow queries found, analyze and add indexes'
\echo ''
