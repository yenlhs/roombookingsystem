# Supabase MCP Server Setup Guide

**Model Context Protocol (MCP)** allows AI assistants like Claude to directly interact with your Supabase database.

---

## What is MCP?

The Supabase MCP Server enables AI tools to:

- ✅ Create and manage database tables
- ✅ Run SQL queries and migrations
- ✅ Manage project configurations
- ✅ View logs and debug issues
- ✅ Generate TypeScript types

---

## Prerequisites

- [x] Supabase project created (nladwgkecjkcjsdawzoc)
- [ ] Supabase Access Token (we need to create this)

---

## Step 1: Create Supabase Access Token

### A. Generate Personal Access Token

1. Go to [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
2. Click **"Generate new token"**
3. Give it a name: `mcp-server-token` or `claude-code-token`
4. Click **"Generate token"**
5. **⚠️ COPY THE TOKEN IMMEDIATELY** - you won't see it again!

The token looks like: `sbp_abc123...`

---

## Step 2: Configure MCP for Claude Code

### Option A: Using Claude Code Settings (Recommended)

1. Open VS Code Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type: `Claude Code: Edit MCP Settings`
3. Add the Supabase MCP configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_TOKEN_HERE",
        "SUPABASE_PROJECT_ID": "nladwgkecjkcjsdawzoc"
      }
    }
  }
}
```

4. Replace `YOUR_TOKEN_HERE` with your actual token
5. Save the file
6. Restart Claude Code (reload VS Code window)

### Option B: Manual Configuration

Edit: `~/.vscode/extensions/anthropic.claude-code-*/mcp-settings.json`

Or create `.mcp-config.json` in your home directory.

---

## Step 3: Verify Connection

Once configured, you can ask Claude to:

```
"Show me all tables in my Supabase database"
"Create a new migration for adding an index"
"Query the users table"
"Check the schema of the bookings table"
```

---

## Available MCP Tools

The Supabase MCP provides these capabilities:

### Database Management

- `list_tables` - List all tables in your database
- `describe_table` - Get table schema and columns
- `execute_sql` - Run SQL queries (read or write)
- `get_table_data` - Fetch data from tables

### Project Management

- `list_projects` - Show all your Supabase projects
- `get_project_config` - View project settings
- `list_branches` - Show database branches (if using branching)

### Schema Management

- `generate_migration` - Create new migration files
- `run_migration` - Apply migrations
- `generate_types` - Create TypeScript types from schema

### Logs & Debugging

- `get_logs` - Retrieve database logs
- `get_api_logs` - View API request logs

---

## Security Best Practices

### ✅ DO:

- Use with development/staging projects
- Set read-only mode if connecting to production
- Scope to specific project ID
- Store tokens in secure locations (MCP settings, not in code)

### ⚠️ DON'T:

- Share your access token
- Commit tokens to git
- Use in production without read-only mode
- Give MCP access to customers/end-users

---

## Read-Only Mode (Optional)

If you want to limit MCP to read-only operations:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_TOKEN_HERE",
        "SUPABASE_PROJECT_ID": "nladwgkecjkcjsdawzoc",
        "READ_ONLY": "true"
      }
    }
  }
}
```

---

## Troubleshooting

### "Connection failed"

- Check your access token is valid
- Verify project ID is correct: `nladwgkecjkcjsdawzoc`
- Make sure you have internet connection

### "Permission denied"

- Access token may have expired
- Generate a new token
- Check token has correct permissions

### "MCP server not found"

- Restart VS Code / Claude Code
- Check MCP settings file exists
- Verify `npx` is available in your PATH

### Test Connection

```bash
# Test if MCP server can be installed
npx -y @supabase/mcp-server@latest --version
```

---

## Example Usage

Once MCP is configured, you can interact naturally:

**Example Conversations:**

👤 "Apply the migration we created"
🤖 _Uses MCP to run the migration SQL_

👤 "Show me all users with role = 'admin'"
🤖 _Queries database and shows results_

👤 "Create a new index on bookings.booking*date"
🤖 \_Generates and applies migration*

👤 "What's the schema of the rooms table?"
🤖 _Describes table structure_

---

## Quick Setup Summary

1. ✅ Generate Supabase Access Token
2. ✅ Add MCP configuration to Claude Code settings
3. ✅ Restart Claude Code
4. ✅ Test by asking: "List my Supabase tables"

---

## Resources

- [Official Supabase MCP Docs](https://supabase.com/docs/guides/getting-started/mcp)
- [GitHub Repository](https://github.com/supabase-community/supabase-mcp)
- [MCP Specification](https://modelcontextprotocol.io)

---

## Your Next Steps

1. **Generate Access Token**: Go to [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. **Configure MCP**: Add token to Claude Code MCP settings
3. **Apply Migration**: Ask Claude to apply the database migration
4. **Continue Building**: Move to Task 1.2.5

---

**Status:** ⏳ Waiting for you to generate access token and configure MCP

Once configured, I'll be able to directly interact with your Supabase database! 🚀
