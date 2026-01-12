# Workflow Setup Guide

This document explains how to configure the multi-agent Claude Code workflow for the hotel-booking project.

---

## Current Setup (What You Have)

| Component | Status | Configuration |
|-----------|--------|---------------|
| iTerm + Claude Code | Working | Sonnet 4.5 |
| Claude Web (this session) | Working | Opus 4.5 |
| Chrome + Claude Extension | Installed | Haiku |
| Project Tabs | Open | localhost:3000, 8081, bellhopping.com |

---

## Required Configuration

### 1. Create `.claude/` Directory

The whiteboard shows using `.claude/settings.json` for pre-approved commands:

```bash
cd /path/to/hotel-booking
mkdir -p .claude
```

Create `.claude/settings.json`:
```json
{
  "preApprovedCommands": [
    "npm install",
    "npm run dev",
    "npm run build",
    "npm run lint",
    "npx prisma generate",
    "npx prisma migrate dev",
    "npx prisma studio",
    "curl http://localhost:3000/api/auth/test"
  ],
  "model": {
    "default": "sonnet",
    "planning": "opus"
  },
  "workflow": {
    "alwaysUsePlanMode": true,
    "autoAcceptAfterPlan": true
  }
}
```

### 2. Add to `.gitignore`

Ensure sensitive config isn't committed:
```bash
echo ".claude/settings.local.json" >> .gitignore
```

---

## MCP Integration (Optional but Powerful)

The whiteboard mentions `.mcp.json` for external tool integration.

Create `.mcp.json` (if you want Slack/Sentry integration later):
```json
{
  "version": "1.0",
  "servers": {
    "browser": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-puppeteer"]
    }
  }
}
```

For now, you can skip this - Chrome extension handles browser interaction.

---

## iTerm Claude Code Configuration

### Enable System Notifications

The whiteboard shows iTerm2 notifications for background tasks:

1. Open iTerm2 Preferences
2. Go to Profiles > Terminal
3. Enable "Post notifications for completed commands"

Or use Claude Code's built-in notification system.

### Set Model for Planning

In your iTerm Claude session, use Plan Mode:
- Press `Shift+Tab` twice to enter Plan Mode
- Claude will outline steps before executing
- Review and approve before auto-accept kicks in

---

## Chrome Extension Setup

### Tab Organization

Keep these tabs open in Chrome:
1. **localhost:3000** - Your V2 app (current development)
2. **localhost:8081/search** - Your V1 app (reference)
3. **hotels.bellhopping.com** - Spy target

### DevTools Position

For payload capture:
1. Open DevTools (`Cmd+Option+I`)
2. Go to Network tab
3. Enable "Preserve log" checkbox
4. Filter by "Fetch/XHR" to see API calls

### Using Chrome Extension with Claude Code

The Claude extension in Chrome can:
- Read page content
- Extract network requests (when you copy them)
- Test UI interactions

To pass data from Chrome to iTerm Claude:
1. Capture payload in Chrome DevTools
2. Copy the JSON
3. In iTerm, paste and ask Claude to analyze

---

## The & Command (State Transfer)

### How It's Supposed to Work

From the whiteboard: "Seamless State Transfer - Pass context & files between local & web"

**Current Reality:** The `&` command in Claude Code CLI is used to reference previous context or web sessions. However, direct integration between iTerm Claude and Web Claude requires manual copy-paste of relevant context.

### Practical Workflow

**Step 1: Spy in Chrome**
```
1. Open bellhopping.com
2. Perform booking action
3. Copy network request from DevTools
```

**Step 2: Plan in Web Claude (this session)**
```
Paste the payload here and say:
"Analyze this booking payload from bellhopping.com and create implementation plan"
```

**Step 3: Execute in iTerm Claude**
```
Copy the plan to iTerm and say:
"Implement this plan for the booking flow"
```

### Future Enhancement

For true seamless transfer, you could:
- Use a shared file (e.g., `.claude/context.json`)
- Write payloads/plans there
- Reference from any session

---

## Session Types & When to Use Each

### iTerm Claude (Sonnet) - Use For:
- Writing/editing code
- Running npm commands
- Git operations
- Quick file searches
- Testing endpoints

### Web Claude (Opus) - Use For:
- Complex multi-step planning
- Analyzing captured payloads
- Designing API contracts
- Reviewing architecture decisions
- This conversation (ongoing project context)

### Chrome Extension (Haiku) - Use For:
- Quick page analysis
- Extracting visible content
- Simple questions about current page
- Testing UI after changes

---

## Background Tasks (Long Running)

The whiteboard mentions:
- **(a) Background Agents** - Run asynchronously
- **(b) Stop Hooks** - Interrupt long runs

In Claude Code, use background mode for long tasks:
```bash
# In iTerm Claude
"Run the build in the background and notify me when done"
```

---

## Post-Tool-Use Hooks (Formatting)

The whiteboard shows: "Ensures 100% consistency (Prettier, Black) -> Avoids CI fails"

Add to your workflow:
```json
// package.json scripts
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "lint:fix": "eslint --fix \"src/**/*.{ts,tsx}\""
  }
}
```

Then tell Claude to run format after edits:
```
After making changes, run npm run format
```

---

## Safety Rules (From Whiteboard)

### NO `--dangerously-skip-permissions`
The whiteboard explicitly warns against this. Never bypass permission checks.

### Pre-Approve Only Safe Commands
Only pre-approve commands that can't cause harm:
- Package installs (npm install)
- Dev server (npm run dev)
- Linting/formatting
- Database commands (prisma)

### Never Pre-Approve:
- `rm -rf`
- Git push --force
- Database drops
- Anything destructive

---

## Quick Start Checklist

- [ ] Create `.claude/` directory
- [ ] Add `.claude/settings.json` with pre-approved commands
- [ ] Keep Chrome tabs organized (localhost:3000, bellhopping.com)
- [ ] Enable DevTools Network logging
- [ ] Use Plan Mode for complex tasks (Shift+Tab x2)
- [ ] Test workflow: Spy -> Plan -> Execute

---

## Troubleshooting

### Chrome Not Connecting to CLI
- Ensure Chrome is running before starting Claude Code
- Check that Claude extension is enabled
- Try restarting Chrome

### Context Not Transferring
- Manually copy/paste between sessions
- Use shared files in `.claude/` directory
- Reference CLAUDE.md for project context

### Model Not Switching
- Explicitly request model in iTerm: "Use opus for planning this"
- Check `.claude/settings.json` configuration
