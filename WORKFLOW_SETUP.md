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

## Custom Subagents (Automated Specialists)

Subagents are markdown files in `.claude/agents/` that Claude automatically spawns for specific tasks.

### Installed Subagents

| Agent | Model | Purpose | Trigger |
|-------|-------|---------|---------|
| `bellhopping-spy` | Haiku | Analyze captured payloads | "Analyze this payload from bellhopping..." |
| `ui-tester` | Haiku | Visual comparison testing | "Compare UI with bellhopping..." |
| `booking-qa` | Sonnet | End-to-end QA testing | "Run QA on booking flow..." |

### How They Work

Claude automatically detects when a subagent is relevant and spawns it:

```bash
# In iTerm - Claude will auto-spawn bellhopping-spy
"I captured this payload from bellhopping.com, analyze it:
{...JSON...}"

# Claude will auto-spawn ui-tester
"Compare the hotel card component with bellhopping.com"

# Claude will auto-spawn booking-qa
"Run QA tests on the booking flow"
```

### Creating Custom Subagents

Create `.claude/agents/your-agent.md`:

```markdown
---
name: your-agent-name
description: What it does. When to use it.
model: haiku   # haiku, sonnet, opus, or inherit
tools: Read, Grep, Glob, Bash   # Restrict available tools
color: green   # UI color
---

Your system prompt here. Instructions for the agent.
```

### Managing Subagents

```bash
/agents        # List all available subagents
/agents edit   # Edit existing subagent
```

---

## MCP Browser Automation (Puppeteer)

MCP gives Claude **direct browser control** - not just reading pages, but taking screenshots, clicking, typing.

### Setup (Already Configured)

The `.mcp.json` in project root enables Puppeteer:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "puppeteer-mcp-claude"]
    }
  }
}
```

### First-Time Installation

```bash
# Install the MCP server
npx puppeteer-mcp-claude install

# Restart Claude Code to load MCP
# Then verify with:
/mcp
```

### Available Browser Tools

| Tool | Usage Example |
|------|---------------|
| `puppeteer_launch` | "Launch a browser" |
| `puppeteer_navigate` | "Go to bellhopping.com" |
| `puppeteer_screenshot` | "Take a screenshot of the page" |
| `puppeteer_click` | "Click the search button" |
| `puppeteer_type` | "Type 'Miami' in the location field" |
| `puppeteer_get_text` | "Get the hotel name text" |

### Example: Automated UI Comparison

```bash
# In iTerm Claude
"Launch a browser, take screenshots of:
1. bellhopping.com search form
2. localhost:3000 search form
Then compare them and list differences"
```

### Example: Spy on Network (Manual + Auto)

Since Puppeteer can't capture network requests directly, use hybrid approach:

1. **Manual:** Open DevTools, capture the request, paste to Claude
2. **Auto:** Use Puppeteer to navigate and trigger actions, observe in DevTools

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

## The & Command (Dispatch to Web Sessions)

### How It Works

The `&` prefix is a **Claude Code CLI feature** that dispatches tasks to web sessions running Opus 4.5.

```
┌─────────────────┐    & prefix     ┌──────────────────┐
│  iTERM (Local)  │ ─────────────▶ │  WEB (Cloud)     │
│  Sonnet 4.5     │                │  Opus 4.5        │
│  Your main hub  │                │  Complex tasks   │
└────────┬────────┘                └────────┬─────────┘
         │                                  │
         │◀────── /teleport ───────────────┘
         │        (pull results back)
```

### Dispatch a Task

In iTerm Claude Code, prefix your message with `&`:

```bash
& Analyze this booking payload from bellhopping.com and create implementation plan:
{
  "HotelCode": "ABC123",
  "RoomType": "DBL",
  ...captured JSON...
}
```

This creates a **new web session on claude.ai** with your current context. The web session runs in the background while you continue working locally.

### Check Progress

```bash
/tasks   # View all background web sessions and their status
```

### Teleport Results Back

When the web session completes (or anytime you want to check):

```bash
/teleport        # Interactive picker - shows all web sessions
/tp              # Shorthand for /teleport
```

Or from command line:
```bash
claude --teleport              # Interactive picker
claude --teleport <session-id> # Resume specific session directly
```

### Important Notes

1. **One-way transfer:** You can dispatch with `&` but cannot push a local session to web. Results come back via `/teleport`.

2. **Multiple concurrent sessions:** Each `&` creates a new web session. You can have multiple running simultaneously.

3. **Context preserved:** The web session inherits your current conversation context when dispatched.

### Practical Workflow for This Project

**Step 1: Spy in Chrome DevTools**
```
1. Open bellhopping.com
2. Perform booking action
3. Copy network request from DevTools (right-click → Copy → Copy as fetch)
```

**Step 2: Dispatch to Web Session (iTerm)**
```bash
& Analyze this booking payload I captured from bellhopping.com.
Map fields to Sabre API and create implementation plan:

[paste captured payload]
```

**Step 3: Continue Working Locally**
```bash
# While web session analyzes, you can:
- Work on other features
- Run tests
- Check other parts of codebase
```

**Step 4: Teleport Results Back**
```bash
/teleport   # When notified or ready, pull the plan back
```

**Step 5: Execute the Plan**
```bash
# Now in iTerm with the plan from Opus, implement it
Implement the booking API based on the plan above
```

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

- [x] Create `.claude/` directory
- [x] Create `.claude/agents/` with subagents (bellhopping-spy, ui-tester, booking-qa)
- [x] Add `.mcp.json` with Puppeteer configuration
- [ ] Run `npx puppeteer-mcp-claude install` in terminal
- [ ] Restart Claude Code to load MCP and subagents
- [ ] Verify with `/mcp` and `/agents`
- [ ] Keep Chrome tabs organized (localhost:3000, bellhopping.com)
- [ ] Enable DevTools Network logging
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
