# How to Apply Database Migration

**Migration:** `20251015000000_initial_schema.sql`

---

## Method 1: Supabase Dashboard SQL Editor (Recommended)

### Steps:

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `room-booking-system`

2. **Navigate to SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Or go directly to: https://supabase.com/dashboard/project/nladwgkecjkcjsdawzoc/sql

3. **Create New Query**
   - Click **"New Query"** button

4. **Copy Migration SQL**
   - Open `/supabase/migrations/20251015000000_initial_schema.sql`
   - Copy **ALL** the SQL content (it's a long file!)

5. **Paste and Run**
   - Paste the SQL into the editor
   - Click **"Run"** or press `Ctrl/Cmd + Enter`
   - Wait for completion (should take 2-5 seconds)

6. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check the **"Table Editor"** in the sidebar
   - You should see 3 new tables: `users`, `rooms`, `bookings`

---

## Method 2: Supabase CLI (Alternative)

### Prerequisites:

```bash
# Install Supabase CLI
npm install -g supabase

# Or with brew
brew install supabase/tap/supabase
```

### Steps:

1. **Link to Your Project**

   ```bash
   cd /Users/adrian/dev/roombookingsystem
   supabase link --project-ref nladwgkecjkcjsdawzoc
   ```

   - Enter your database password when prompted

2. **Apply Migration**
   ```bash
   supabase db push
   ```

---

## Verification Checklist

After running the migration, verify these exist in your Supabase Dashboard:

### Tables (Table Editor)

- [ ] `public.users` (with 9 columns)
- [ ] `public.rooms` (with 12 columns)
- [ ] `public.bookings` (with 13 columns)

### Indexes (should be created automatically)

- [ ] Multiple indexes on each table
- Check in: Database → Indexes

### RLS Policies

- [ ] `public.users` - 5 policies
- [ ] `public.rooms` - 4 policies
- [ ] `public.bookings` - 7 policies
- Check in: Authentication → Policies

### Functions

- [ ] `handle_updated_at()` - Updates timestamps
- [ ] `handle_new_user()` - Creates user profile on signup
- Check in: Database → Functions

### Triggers

- [ ] `on_auth_user_created` - On auth.users table
- [ ] `set_users_updated_at` - On public.users table
- [ ] `set_rooms_updated_at` - On public.rooms table
- [ ] `set_bookings_updated_at` - On public.bookings table
- Check in: Database → Triggers

---

## What This Migration Creates

### 1. **Users Table**

Extends Supabase auth with profile information:

- Full name, phone, avatar
- Role (user/admin)
- Status (active/inactive)

### 2. **Rooms Table**

Room information and availability:

- Name, description, capacity
- Operating hours (start/end time)
- Slot duration (default 60 minutes)
- Status (active/inactive)
- Images

### 3. **Bookings Table**

Booking records:

- User and room references
- Date and time slots
- Status (confirmed/cancelled/completed)
- Cancellation info

### 4. **Row Level Security (RLS)**

Automatic security policies:

- Users can only see their own bookings
- Admins can see everything
- Users can only book for themselves
- Admins can manage all data

### 5. **Automatic Features**

- Timestamps auto-update on changes
- User profiles auto-create on signup
- Prevent double-booking (same room, date, time)

---

## Troubleshooting

### Error: "relation already exists"

- Tables already created
- Drop them first: `DROP TABLE IF EXISTS bookings, rooms, users CASCADE;`
- Then re-run the migration

### Error: "permission denied"

- Make sure you're logged in to Supabase Dashboard
- Or check database password if using CLI

### Error: "syntax error"

- Make sure you copied the **entire** SQL file
- Check for any missing semicolons

### Can't see tables?

- Refresh the page
- Check you're in the correct project
- Look in "Table Editor" → "public" schema

---

## Next Steps

After successfully applying the migration:

1. **Create an Admin User**
   - Go to Authentication → Users
   - Click "Add User"
   - Add yourself as a user
   - Then run this SQL to make yourself admin:
     ```sql
     UPDATE public.users
     SET role = 'admin'
     WHERE email = 'your-email@example.com';
     ```

2. **Test the Schema**
   - Try inserting a test room
   - Try creating a test booking
   - Verify RLS policies work

3. **Move to Next Task**
   - Task 1.2.3: Implement Row Level Security (✅ already done!)
   - Task 1.2.4: Create Database Functions (✅ already done!)
   - Task 1.2.5: Configure Supabase Client in Apps

---

## SQL Quick Reference

### View All Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Count Records

```sql
SELECT 'users' as table, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'rooms', COUNT(*) FROM public.rooms
UNION ALL
SELECT 'bookings', COUNT(*) FROM public.bookings;
```

### Check RLS Status

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

**Ready?** Go ahead and apply the migration using Method 1 (Dashboard). It should take less than a minute! 🚀
