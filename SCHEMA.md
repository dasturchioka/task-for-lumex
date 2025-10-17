# Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema for the AI-Powered Job Application Form. The database is hosted on Supabase and uses Row Level Security (RLS) for data isolation.

## Schema Design Principles

1. **Security First**: All sensitive tokens are hashed, RLS enabled on all tables
2. **Flexibility**: JSONB for form data allows schema evolution without migrations
3. **Performance**: Strategic indexes on hot paths (token lookups, user queries)
4. **Auditability**: Timestamps on all tables, IP tracking for sessions
5. **Data Integrity**: Foreign keys with CASCADE delete, UUID primary keys

## Entity Relationship Diagram

```
┌─────────────┐
│   users     │
│ ─────────── │
│ id (PK)     │◄──────┐
│ email       │       │
│ created_at  │       │
│ updated_at  │       │
└─────────────┘       │
                      │
                      │ (FK)
┌─────────────────────┴────┐      ┌──────────────────────┐
│      sessions            │      │ magic_link_tokens    │
│ ──────────────────────── │      │ ───────────────────  │
│ id (PK)                  │      │ id (PK)              │
│ user_id (FK) ────────────┘      │ email                │
│ token                    │      │ token                │
│ expires_at               │      │ expires_at           │
│ last_activity            │      │ used_at              │
│ ip_address               │      │ created_at           │
│ user_agent               │      └──────────────────────┘
│ created_at               │
└──────────────────────────┘
         │
         │ (FK)
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌───────────────────┐
│ form_progress    │   │ form_submissions  │
│ ──────────────── │   │ ─────────────────  │
│ id (PK)          │   │ id (PK)           │
│ user_id (FK)     │   │ user_id (FK)      │
│ form_data (JSONB)│   │ form_data (JSONB) │
│ current_step     │   │ submitted_at      │
│ last_saved_at    │   └───────────────────┘
│ created_at       │
└──────────────────┘
         │
         │ (FK)
         ▼
┌──────────────────┐
│   ai_usage       │
│ ──────────────── │
│ id (PK)          │
│ user_id (FK)     │
│ feature_type     │
│ request_tokens   │
│ response_tokens  │
│ total_tokens     │
│ success          │
│ error_message    │
│ created_at       │
└──────────────────┘
```

## Tables

### 1. users

Stores user accounts. Users are identified by email only (no password).

| Column     | Type         | Constraints           | Description                    |
|------------|--------------|----------------------|--------------------------------|
| id         | UUID         | PRIMARY KEY, DEFAULT | Unique user identifier         |
| email      | TEXT         | UNIQUE, NOT NULL     | User's email address           |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()        | Account creation timestamp     |
| updated_at | TIMESTAMPTZ  | DEFAULT NOW()        | Last update timestamp (auto)   |

**Indexes:**
- Primary key index on `id` (automatic)
- Unique index on `email` (automatic)

**RLS Policies:**
- `users_select_own`: Users can SELECT their own row only

**Triggers:**
- `update_users_updated_at`: Automatically updates `updated_at` on UPDATE

**Design Notes:**
- UUID over INT to prevent user enumeration
- Email-only auth (no password, name, profile)
- Minimal by design, can extend with profile table later

---

### 2. sessions

Active user sessions. Tokens are hashed before storage.

| Column        | Type         | Constraints           | Description                    |
|---------------|--------------|----------------------|--------------------------------|
| id            | UUID         | PRIMARY KEY, DEFAULT | Unique session identifier      |
| user_id       | UUID         | FK → users(id), NOT NULL | Owner of this session       |
| token         | TEXT         | UNIQUE, NOT NULL     | SHA-256 hashed session token   |
| expires_at    | TIMESTAMPTZ  | NOT NULL             | Session expiration (7 days)    |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()        | Session creation time          |
| last_activity | TIMESTAMPTZ  | DEFAULT NOW()        | Last request timestamp         |
| ip_address    | TEXT         | NULL                 | Client IP (for audit trail)    |
| user_agent    | TEXT         | NULL                 | Client browser (for audit)     |

**Indexes:**
- `idx_sessions_token`: Fast lookup by token (authentication on every request)
- `idx_sessions_user_id`: Fast lookup by user (view all user's sessions)
- `idx_sessions_expires_at`: Fast cleanup of expired sessions

**RLS Policies:**
- `sessions_select_own`: Users can SELECT their own sessions only

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Design Notes:**
- Token stored as SHA-256 hash (never raw)
- CASCADE delete removes sessions when user deleted
- IP and user agent for security monitoring
- `last_activity` for sliding window expiration (future enhancement)

---

### 3. magic_link_tokens

Temporary tokens for passwordless authentication. Single-use, short-lived.

| Column     | Type         | Constraints           | Description                    |
|------------|--------------|----------------------|--------------------------------|
| id         | UUID         | PRIMARY KEY, DEFAULT | Unique token identifier        |
| email      | TEXT         | NOT NULL             | Email address for this token   |
| token      | TEXT         | UNIQUE, NOT NULL     | 64-char random token (unhashed)|
| expires_at | TIMESTAMPTZ  | NOT NULL             | Token expiration (15 minutes)  |
| used_at    | TIMESTAMPTZ  | NULL                 | When token was used (NULL = unused) |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()        | Token generation time          |

**Indexes:**
- `idx_magic_link_tokens_token`: Fast lookup by token (on verification)
- `idx_magic_link_tokens_expires_at`: Fast cleanup of expired tokens

**RLS Policies:**
- All operations require service role (no user access)

**Design Notes:**
- NOT linked to users table (user might not exist yet)
- Token stored unhashed (needed to send in email)
- Single-use enforced by `used_at` timestamp
- Short expiration (15 min) limits attack window
- No automatic cleanup (rely on periodic job)

---

### 4. form_progress

Draft form data for incomplete applications. One draft per user.

| Column        | Type         | Constraints           | Description                    |
|---------------|--------------|----------------------|--------------------------------|
| id            | UUID         | PRIMARY KEY, DEFAULT | Unique progress record         |
| user_id       | UUID         | FK → users(id), UNIQUE, NOT NULL | Form owner           |
| form_data     | JSONB        | NOT NULL, DEFAULT {} | Partial form data              |
| current_step  | INTEGER      | NOT NULL, DEFAULT 1  | Current step (1-5)             |
| last_saved_at | TIMESTAMPTZ  | DEFAULT NOW()        | When last saved                |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()        | When draft created             |

**Indexes:**
- `idx_form_progress_user_id`: Fast lookup by user (load draft on login)

**RLS Policies:**
- `form_progress_select_own`: Users can SELECT their own draft
- `form_progress_insert_own`: Users can INSERT for themselves
- `form_progress_update_own`: Users can UPDATE their own draft
- `form_progress_delete_own`: Users can DELETE their own draft

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Design Notes:**
- UNIQUE on `user_id` = one draft per user
- JSONB for flexibility (add/remove fields without migration)
- `current_step` for navigation state
- UPSERT pattern in application code
- Deleted on submission (not kept as history)

**Example `form_data` structure:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "currentPosition": "Senior Engineer",
  "keyAchievements": "Led team of 5...",
  "programmingLanguages": "JavaScript, Python",
  // ... other fields
}
```

---

### 5. form_submissions

Completed and submitted applications. Immutable after submission.

| Column       | Type         | Constraints           | Description                    |
|--------------|--------------|----------------------|--------------------------------|
| id           | UUID         | PRIMARY KEY, DEFAULT | Unique submission identifier   |
| user_id      | UUID         | FK → users(id), NOT NULL | Who submitted             |
| form_data    | JSONB        | NOT NULL             | Complete form data             |
| submitted_at | TIMESTAMPTZ  | DEFAULT NOW()        | Submission timestamp           |

**Indexes:**
- `idx_form_submissions_user_id_submitted_at`: Fast query for user's submissions (DESC order)

**RLS Policies:**
- `form_submissions_select_own`: Users can SELECT their own submissions
- `form_submissions_insert_own`: Users can INSERT for themselves
- No UPDATE or DELETE policies (immutable)

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Design Notes:**
- Multiple submissions per user allowed (no UNIQUE)
- Immutable (no UPDATE RLS policy)
- JSONB snapshot of data at submission time
- Indexed for pagination (newest first)
- CASCADE delete when user account deleted

**Example `form_data` structure:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "location": "San Francisco, CA",
  "currentPosition": "Senior Software Engineer",
  "company": "Tech Corp",
  "yearsExperience": 5,
  "keyAchievements": "Led team of 5, reduced latency by 60%",
  "primarySkills": "System design, API development",
  "programmingLanguages": "JavaScript, Python, Go",
  "frameworks": "React, Node.js, Django",
  "whyInterested": "Excited about the mission...",
  "startDate": "2025-01-15",
  "expectedSalary": "$120,000 - $150,000"
}
```

---

### 6. ai_usage

Tracks AI feature usage for rate limiting and analytics.

| Column          | Type         | Constraints           | Description                    |
|-----------------|--------------|----------------------|--------------------------------|
| id              | UUID         | PRIMARY KEY, DEFAULT | Unique usage record            |
| user_id         | UUID         | FK → users(id), NOT NULL | User who made request      |
| feature_type    | TEXT         | NOT NULL, CHECK      | Type of AI feature used        |
| request_tokens  | INTEGER      | NOT NULL, DEFAULT 0  | Tokens in prompt               |
| response_tokens | INTEGER      | NOT NULL, DEFAULT 0  | Tokens in response             |
| total_tokens    | INTEGER      | NOT NULL, DEFAULT 0  | Sum of above                   |
| success         | BOOLEAN      | NOT NULL, DEFAULT TRUE | Whether request succeeded   |
| error_message   | TEXT         | NULL                 | Error details if failed        |
| created_at      | TIMESTAMPTZ  | DEFAULT NOW()        | Request timestamp              |

**Indexes:**
- `idx_ai_usage_user_id_created_at`: Fast lookup for rate limiting (recent requests DESC)

**RLS Policies:**
- `ai_usage_select_own`: Users can SELECT their own usage
- `ai_usage_insert_own`: Users can INSERT for themselves

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Check Constraints:**
- `feature_type` IN ('autofill', 'improve', 'expand', 'validate')

**Design Notes:**
- Tracks every AI API call
- Token counts for cost monitoring
- Success/error for debugging
- Used for sliding window rate limiting
- No DELETE policy (audit trail)

**Rate Limiting Query:**
```sql
SELECT COUNT(*) 
FROM ai_usage 
WHERE user_id = ? 
  AND created_at >= NOW() - INTERVAL '5 minutes'
  AND success = true;
```

---

## Database Functions

### update_updated_at_column()

Automatically updates `updated_at` timestamp when a row is updated.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Used by:**
- `users` table (via trigger)

---

### cleanup_expired_data()

Removes expired sessions and magic link tokens. Should be run periodically (cron).

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
  DELETE FROM magic_link_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**Usage:**
```sql
-- Run manually
SELECT cleanup_expired_data();

-- Or set up cron (pg_cron extension)
SELECT cron.schedule('cleanup-expired', '0 */6 * * *', 'SELECT cleanup_expired_data()');
```

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies ensure users can only access their own data.

### Policy Pattern

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rows
CREATE POLICY table_select_own ON table_name
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can only insert for themselves
CREATE POLICY table_insert_own ON table_name
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can only update their own rows
CREATE POLICY table_update_own ON table_name
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can only delete their own rows
CREATE POLICY table_delete_own ON table_name
  FOR DELETE USING (auth.uid()::text = user_id::text);
```

### Service Role Bypass

Application server uses service role key to bypass RLS for:
- Creating users (during registration)
- Validating magic links (before user exists)
- System operations (cleanup, analytics)

---

## Indexes Strategy

### Why These Indexes?

1. **Authentication (Hot Path)**
   - `sessions(token)`: Checked on EVERY request
   - `sessions(expires_at)`: Cleanup queries

2. **Rate Limiting (Hot Path)**
   - `ai_usage(user_id, created_at)`: Sliding window calculations

3. **User Queries**
   - `form_progress(user_id)`: Load draft on login
   - `form_submissions(user_id, submitted_at)`: Paginated history

4. **Cleanup Queries**
   - `magic_link_tokens(expires_at)`: Remove old tokens
   - `sessions(expires_at)`: Remove old sessions

### Monitoring Queries

Check index usage:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

Find unused indexes:
```sql
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

---

## Data Types Rationale

### UUID vs INTEGER

**Chose UUID:**
- ✅ No enumeration attacks (can't guess next ID)
- ✅ Distributed generation (no sequence coordination)
- ✅ Merge-friendly (no ID conflicts)
- ❌ Larger storage (16 bytes vs 4 bytes)
- ❌ Slightly slower lookups

### JSONB vs Normalized Tables

**Chose JSONB for form data:**
- ✅ Schema flexibility (add fields without migration)
- ✅ One query to load entire form
- ✅ Easy to merge partial updates
- ❌ Harder to query specific fields
- ❌ No type enforcement at DB level

### TEXT vs VARCHAR(n)

**Chose TEXT:**
- ✅ No arbitrary length limits
- ✅ PostgreSQL optimizes internally
- ✅ Simpler schema
- ❌ Less explicit constraints

### TIMESTAMPTZ vs TIMESTAMP

**Chose TIMESTAMPTZ:**
- ✅ Timezone aware (UTC storage)
- ✅ Correct comparison across timezones
- ✅ Best practice for global apps

---

## Migrations Strategy

### Current: Manual SQL

The schema is deployed by running `supabase-schema.sql` manually in Supabase SQL Editor.

**Pros:**
- ✅ Simple for initial setup
- ✅ No tooling required

**Cons:**
- ❌ No version tracking
- ❌ No rollback capability
- ❌ Manual coordination

### Recommended: Prisma Migrations

For production, use Prisma:

```bash
# Initialize
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy
```

**Benefits:**
- ✅ Version controlled migrations
- ✅ Automatic rollback
- ✅ Type-safe schema changes
- ✅ CI/CD friendly

---

## Backup & Recovery

### Supabase Automatic Backups

**Free Tier:**
- Daily backups (retained 7 days)
- Manual restore via dashboard

**Pro Tier:**
- Point-in-time recovery (PITR)
- Restore to any second within retention

### Manual Backup

```bash
# Dump schema + data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Restore
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

### Disaster Recovery Plan

1. **Immediate:** Restore from Supabase automatic backup
2. **Data Loss:** Check RLS policies (accidental deletion)
3. **Corruption:** Point-in-time recovery (Pro tier)
4. **Catastrophic:** Restore from manual dump

---

## Performance Optimization

### Query Performance

**Slow Query Log:**
```sql
-- Enable logging
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- 1 second

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**EXPLAIN ANALYZE:**
```sql
EXPLAIN ANALYZE
SELECT * FROM form_submissions 
WHERE user_id = '...' 
ORDER BY submitted_at DESC 
LIMIT 10;
```

### Connection Pooling

Supabase uses PgBouncer in transaction mode:
- Max connections: 15-60 (depends on plan)
- Pool size: Configure in Supabase dashboard
- Timeout: 15 seconds default

**Tuning:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check max connections
SHOW max_connections;
```

---

## Security Considerations

### 1. SQL Injection

**Protection:**
- Parameterized queries (via Supabase client)
- RLS policies (second line of defense)

### 2. Token Security

**Protection:**
- Sessions: SHA-256 hashed
- Magic links: Short-lived (15 min)
- Cookies: HTTP-only, Secure, SameSite

### 3. Data Isolation

**Protection:**
- RLS on all tables
- auth.uid() in policies
- Service role for system operations

### 4. Rate Limiting

**Protection:**
- AI usage tracked in DB
- Sliding window algorithm
- Per-user limits

### 5. Audit Trail

**Tracking:**
- IP address in sessions
- User agent in sessions
- Timestamps on all tables
- Success/error in ai_usage

---

## Troubleshooting

### Connection Issues

```sql
-- Check connections
SELECT * FROM pg_stat_activity;

-- Kill hung connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < NOW() - INTERVAL '1 hour';
```

### Lock Issues

```sql
-- Check locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check blocking queries
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_query,
  blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

### Disk Usage

```sql
-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Database size
SELECT pg_size_pretty(pg_database_size('postgres'));
```

---

## Future Enhancements

### 1. Full-Text Search

```sql
-- Add tsvector column
ALTER TABLE form_submissions 
ADD COLUMN search_vector tsvector;

-- Update trigger
CREATE TRIGGER update_search_vector
BEFORE INSERT OR UPDATE ON form_submissions
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', form_data);

-- Index
CREATE INDEX idx_search_vector ON form_submissions USING gin(search_vector);

-- Query
SELECT * FROM form_submissions
WHERE search_vector @@ to_tsquery('engineer & python');
```

### 2. Partitioning

For large datasets:
```sql
-- Partition by submission date
CREATE TABLE form_submissions (
  ...
) PARTITION BY RANGE (submitted_at);

CREATE TABLE form_submissions_2025_01 
  PARTITION OF form_submissions
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 3. Read Replicas

For read-heavy workloads:
- Enable Supabase read replicas
- Route analytics queries to replica
- Write to primary only

---

## Conclusion

This schema is designed for:
- ✅ Security (RLS, hashed tokens, HTTP-only cookies)
- ✅ Flexibility (JSONB for form data)
- ✅ Performance (strategic indexes)
- ✅ Auditability (timestamps, IP tracking)
- ✅ Scalability (UUID, partitioning-ready)

It's production-ready for small to medium scale (0-100k users) with proper monitoring and maintenance.

