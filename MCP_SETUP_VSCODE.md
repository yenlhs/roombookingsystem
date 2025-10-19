# Supabase MCP Setup for Claude Code (VS Code)

**Note:** You're using Claude Code in VS Code, not Claude Desktop app. The setup is simpler!

---

## 🎯 Quick Setup (3 steps, 3 minutes)

### Step 1: Generate Supabase Access Token

1. Go to: [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. Click **"Generate new token"**
3. Name it: `claude-code-mcp`
4. **COPY THE TOKEN** (starts with `sbp_...`)

---

### Step 2: Create MCP Configuration File

Create a file at: `~/claude_desktop_config.json`

I've already created a template for you at that location! Just update it with your token:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_YOUR_TOKEN_HERE",
        "SUPABASE_PROJECT_ID": "nladwgkecjkcjsdawzoc"
      }
    }
  }
}
```

**To edit the file:**

```bash
open ~/claude_desktop_config.json
```

Or use VS Code:

```bash
code ~/claude_desktop_config.json
```

Replace `REPLACE_WITH_YOUR_TOKEN` with your actual Supabase access token.

---

### Step 3: Reload VS Code

After saving the config file:

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: `Developer: Reload Window`
3. Press Enter

---

## ✅ Test the Connection

After reloading, ask Claude:

```
"List all tables in my Supabase database"
```

If it works, Claude will be able to:

- ✅ Query your database directly
- ✅ Apply migrations automatically
- ✅ Create and modify tables
- ✅ Run SQL commands
- ✅ Generate TypeScript types

---

## 🔍 Troubleshooting

### "MCP server not found" or no response

**Check 1: File Location**

```bash
ls -la ~/claude_desktop_config.json
```

The file should exist in your home directory.

**Check 2: File Contents**

```bash
cat ~/claude_desktop_config.json
```

Make sure:

- Valid JSON format (no trailing commas)
- Token is filled in (not "REPLACE_WITH_YOUR_TOKEN")
- Project ID is correct: `nladwgkecjkcjsdawzoc`

**Check 3: Test MCP Server Manually**

```bash
npx -y @supabase/mcp-server@latest --version
```

Should install and show version info.

---

### Still Not Working?

**Alternative: Skip MCP and Use Supabase Dashboard**

You don't need MCP to proceed! You can:

1. **Apply Migration Manually:**
   - Go to: https://supabase.com/dashboard/project/nladwgkecjkcjsdawzoc/sql
   - Click "New Query"
   - Copy SQL from `supabase/migrations/20251015000000_initial_schema.sql`
   - Paste and click "Run"

2. **View Tables:**
   - Go to: https://supabase.com/dashboard/project/nladwgkecjkcjsdawzoc/editor
   - See all tables in left sidebar

3. **Run Queries:**
   - Use the SQL Editor in dashboard
   - Or use the Table Editor for GUI operations

---

## 📍 File Locations

**MCP Config:**

- Location: `~/claude_desktop_config.json`
- Quick open: `open ~/claude_desktop_config.json`

**Migration File:**

- Location: `supabase/migrations/20251015000000_initial_schema.sql`
- In your project directory

---

## 🔒 Security Notes

- ✅ `~/claude_desktop_config.json` is in your home directory (secure)
- ✅ NOT tracked in git
- ⚠️ Keep your access token private
- ⚠️ Don't share this file or commit it to repositories

---

## Next Steps

**Once MCP is configured OR you've applied the migration manually:**

1. ✅ Verify tables exist (users, rooms, bookings)
2. ✅ Create an admin user
3. ✅ Move to Task 1.2.5: Configure Supabase Client in Apps

---

## Commands Quick Reference

```bash
# Open MCP config
open ~/claude_desktop_config.json

# Or edit with VS Code
code ~/claude_desktop_config.json

# View file contents
cat ~/claude_desktop_config.json

# Test MCP server installation
npx -y @supabase/mcp-server@latest --version

# Reload VS Code
# Cmd+Shift+P → "Developer: Reload Window"
```

---

**Current Status:**

- ✅ Template config created at `~/claude_desktop_config.json`
- ⏳ Waiting for you to add your Supabase access token
- ⏳ Then reload VS Code

**Your token goes here in the file:**

```json
"SUPABASE_ACCESS_TOKEN": "sbp_paste_your_token_here"
```

Get your token: https://supabase.com/dashboard/account/tokens 🚀
