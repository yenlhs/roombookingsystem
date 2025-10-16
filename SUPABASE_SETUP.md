# Supabase Setup Guide

**Task 1.2.1: Create Supabase Project**
**Date:** October 15, 2025

---

## Step-by-Step Instructions

### 1. Create Supabase Account & Project

#### A. Sign Up for Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign in"**
3. Sign up using one of these methods:
   - **GitHub** (recommended for developers)
   - **Email/Password**
4. Verify your email if using email/password method

#### B. Create New Project
1. After logging in, click **"New Project"**
2. Fill in the project details:
   - **Name:** `room-booking-system` (or your preferred name)
   - **Database Password:** Create a strong password (SAVE THIS!)
     - Use a password manager or save it securely
     - You'll need this for database migrations
   - **Region:** Choose the region closest to your users
     - Suggestions: `us-east-1` (US East), `eu-west-1` (Europe), `ap-southeast-1` (Asia)
   - **Pricing Plan:** Free (perfect for MVP)
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to provision

---

### 2. Gather Your Credentials

Once your project is ready, you'll need to copy these values:

#### A. Project URL
1. Go to **Settings** → **API** in the left sidebar
2. Find **"Project URL"**
   - Example: `https://abcdefghijklmn.supabase.co`
3. **Copy this URL** - you'll need it for your apps

#### B. Anon/Public Key
1. Still in **Settings** → **API**
2. Find **"Project API keys"** section
3. Copy the **"anon" / "public"** key
   - This is safe to use in your frontend apps
   - It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. **Copy this key** - you'll need it for your apps

#### C. Service Role Key (Optional - for admin operations)
1. In the same section, find **"service_role"** key
2. **⚠️ IMPORTANT:** This key has admin access - NEVER expose it in frontend code
3. Copy it only if you need server-side admin operations

---

### 3. Save Your Credentials Securely

**Create a secure note with:**
```
Project Name: room-booking-system
Project URL: https://your-project.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Database Password: [your-strong-password]
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
```

---

### 4. Configure Environment Variables

Once you have your credentials, we'll configure both apps:

#### Web App (.env.local)
```bash
# In apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Mobile App (.env)
```bash
# In apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Quick Checklist

- [ ] Supabase account created
- [ ] New project created (name: room-booking-system)
- [ ] Project fully provisioned (no longer "setting up")
- [ ] Project URL copied
- [ ] Anon/public key copied
- [ ] Database password saved securely
- [ ] Credentials saved in password manager or secure location

---

## What's Next?

After completing this task, we'll move to:
- **Task 1.2.2:** Design Database Schema
- **Task 1.2.3:** Implement Row Level Security (RLS)
- **Task 1.2.4:** Create Database Functions
- **Task 1.2.5:** Configure Supabase Client in Apps

---

## Troubleshooting

### Project Creation Taking Too Long?
- Refresh the page after 3-5 minutes
- Check your internet connection
- Try a different region if issues persist

### Can't Find API Settings?
- Look for **Settings** (gear icon) in the left sidebar
- Click **API** under the Project Settings section

### Forgot Database Password?
- Go to **Settings** → **Database**
- Click **"Reset database password"**
- ⚠️ This will disconnect all current connections

---

## Security Notes

### ✅ SAFE to Expose (Frontend)
- Project URL
- Anon/Public key (this is designed for client-side use)

### ⚠️ NEVER Expose (Keep Secret)
- Database password
- Service role key
- JWT secret

### Best Practices
- Use environment variables (never hardcode)
- Add `.env*` to `.gitignore` (already done ✅)
- Use different projects for development and production
- Rotate keys if accidentally exposed

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Database Settings](https://supabase.com/dashboard/project/_/settings/database)

---

**Status:** ⏳ Waiting for user to complete Supabase project creation

**Next:** Once you have your credentials, let me know and I'll help you configure the environment variables in both apps.
