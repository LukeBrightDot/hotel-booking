# Claude Code Multi-Agent Setup Guide

> Your complete setup for parallel Claude Code agents with shared context.
> Stack: Next.js 16 + React 19 + Prisma + PostgreSQL + OpenAI Realtime

-----

## Table of Contents

1. [Quick Start](#quick-start)
1. [File Structure](#file-structure)
1. [CLAUDE.md - The Shared Brain](#claudemd---the-shared-brain)
1. [Local Config Files](#local-config-files)
1. [Custom Slash Commands](#custom-slash-commands)
1. [MCP Integration](#mcp-integration)
1. [Git Hooks & Automation](#git-hooks--automation)
1. [GitHub Actions](#github-actions)
1. [Daily Workflow](#daily-workflow)
1. [Terminal Setup (iTerm2)](#terminal-setup-iterm2)
1. [Long Tasks (Agents & Sandbox)](#long-tasks-agents--sandbox)
1. [Local + Web Sessions](#local--web-sessions-claudeai)
1. [Subagents](#subagents)
1. [Verifies Own Work (Chrome Extension)](#verifies-own-work-chrome-extension)
1. [Mobile Monitoring (iPhone)](#mobile-monitoring-iphone)
1. [Quick Reference](#quick-reference)
1. [Troubleshooting](#troubleshooting)

-----

## Quick Start

```bash
# 1. Copy all config files to your repo (see sections below)

# 2. Create the directory structure
mkdir -p .claude/commands .claude/hooks

# 3. Make hooks executable
chmod +x .claude/hooks/*.sh

# 4. Open 5 terminal sessions and launch agents
# (See "Daily Workflow" section)
```

-----

## File Structure

After setup, your repo should have:

```
your-repo/
├── CLAUDE.md                    # Shared project brain (git tracked)
├── .claude/
│   ├── settings.json            # Permissions & model config
│   ├── commands/
│   │   ├── commit-push-pr.md    # /commit-push-pr command
│   │   ├── verify-app.md        # /verify-app command
│   │   ├── db-migrate.md        # /db-migrate command
│   │   ├── deploy.md            # /deploy command
│   │   └── refactor.md          # /refactor command
│   └── hooks/
│       └── post-tool-use.sh     # Auto-format after edits
├── .mcp.json                    # MCP server connections
├── .github/
│   └── workflows/
│       └── claude-pr.yml        # @claude in PR comments
└── src/
    └── ... (your app)
```

-----

## CLAUDE.md - The Shared Brain

Create `CLAUDE.md` in your repo root. **Commit this to git.**

```markdown
# CLAUDE.md - Project Intelligence

> This file is read by all Claude agents. Keep it updated.
> Last updated: [DATE]

## Project Overview

Hotel booking platform with voice assistant capabilities.

### Tech Stack
- **Frontend**: Next.js 16.1.1 (App Router, RSC), React 19.2.3, TypeScript 5.9.3 (strict)
- **Styling**: Tailwind CSS 4.1.18, Framer Motion 12.26.2, Radix UI, Lucide icons
- **State**: TanStack React Query 5.90.16
- **Backend**: Next.js API Routes (src/app/api/*/route.ts)
- **Database**: PostgreSQL + Prisma 5.22.0
- **Voice**: OpenAI Realtime API (gpt-4o-realtime-preview), Shimmer voice
- **External**: Sabre API (hotel search), Axios 1.13.2

### Repository Structure
```

src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── hotels/        # Hotel search endpoints
│   │   ├── bookings/      # Booking management
│   │   └── voice/         # Voice assistant WebSocket
│   ├── (routes)/          # Page routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Radix UI primitives
│   └── features/         # Feature components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── sabre.ts          # Sabre API client
│   └── openai.ts         # OpenAI client
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
prisma/
├── schema.prisma          # Database schema
└── migrations/            # Migration history

```
## Coding Conventions

### TypeScript
- Strict mode is ON - no `any` types without justification
- Use `interface` for object shapes, `type` for unions/intersections
- Always define return types for functions
- Use `satisfies` for type-safe object literals

### React / Next.js
- Default to Server Components, add 'use client' only when needed
- Use React Query for all data fetching in client components
- Colocate components with their routes when possible
- Animation: use Framer Motion's `motion` components

### API Routes
- All routes in `src/app/api/[resource]/route.ts`
- Always validate input with Zod
- Return consistent error format: `{ error: string, code: string }`
- Log all external API calls to ApiLog table

### Database
- Always use Prisma transactions for multi-table operations
- Run `npx prisma generate` after schema changes
- Test migrations on local DB first: `npx prisma migrate dev`
- Never use raw SQL unless absolutely necessary

### Styling
- Tailwind only - no CSS files
- Use `cn()` helper for conditional classes
- Mobile-first: start with base styles, add `md:` `lg:` breakpoints
- Animations: prefer Tailwind's built-in, Framer Motion for complex

### Forms & Dates
- Use React Day Picker for date selection
- Format dates with date-fns: `format(date, 'PPP')`
- Always handle timezone: store UTC, display local

## Current Sprint

### In Progress
- [ ] User profile settings page
- [ ] Booking confirmation emails
- [ ] Voice assistant hotel search integration

### Blocked
- [ ] Payment processing (waiting on Stripe approval)

### Completed Recently
- [x] Hotel search results caching
- [x] Voice activity detection improvements

## Known Issues & Gotchas

### Critical - Read Before Coding

1. **Prisma Client in Edge Runtime**
   - Next.js API routes using edge runtime can't use Prisma directly
   - Use `runtime = 'nodejs'` in route config, or use Prisma Accelerate

2. **React 19 Hydration**
   - Radix UI components may cause hydration mismatches
   - Wrap in `<ClientOnly>` component or use `suppressHydrationWarning`

3. **Sabre API Rate Limits**
   - Max 10 requests/second
   - Always use the caching layer in `lib/sabre.ts`
   - Check `HotelResult` table before making new requests

4. **Voice WebSocket Reconnection**
   - OpenAI Realtime disconnects after 15min idle
   - Client must handle reconnection gracefully

5. **Tailwind v4 Changes**
   - No more `@apply` in components - use cn() helper
   - JIT is default, no need for safelist unless dynamic

## Environment Variables

Required in `.env.local`:
```

DATABASE_URL=postgresql://…
SABRE_CLIENT_ID=…
SABRE_CLIENT_SECRET=…
OPENAI_API_KEY=…
NEXT_PUBLIC_APP_URL=http://localhost:3000

```
## Mistake Log

> When something breaks, document it here so we never repeat it.

### Template
```

### [DATE]: Brief description

- **Error**: What happened
- **Cause**: Why it happened
- **Fix**: How we fixed it
- **Prevention**: Rule to follow going forward

```
### [Example] 2024-XX-XX: Prisma migration failed in prod
- **Error**: `P3009: migrate found failed migrations`
- **Cause**: Ran `migrate dev` instead of `migrate deploy` in production
- **Fix**: Manually marked migration as applied: `prisma migrate resolve`
- **Prevention**: Always use `migrate deploy` in prod, `migrate dev` only locally

---

## Agent-Specific Instructions

### Frontend Agent
Focus areas: `src/components/`, `src/app/(routes)/`, styling, animations
- Run `npm run dev` to see changes
- Test on mobile viewport (375px) for all UI changes
- Use Radix primitives from `src/components/ui/`

### Backend Agent  
Focus areas: `src/app/api/`, `src/lib/`, `prisma/`
- Test API routes with `curl` or Thunder Client
- Always check Prisma schema before DB operations
- Log external API calls to ApiLog

### DevOps Agent
Focus areas: deployment, environment, infrastructure
- SSH to prod: `ssh user@your-vps-ip`
- Deployments via git push to main
- Check logs: `pm2 logs` or `docker logs`

---

*Keep this file updated. Every agent reads it.*
```

-----

## Local Config Files

### Pre-Approve Safe Commands

The diagram emphasizes pre-approving safe commands to avoid constant permission prompts. Store these in `.claude/settings.json`:

### `.claude/settings.json`

```json
{
  "model": "claude-sonnet-4-5-20250514",
  "planningModel": "claude-opus-4-5-20250514",
  
  "permissions": {
    "allow": [
      "npm install",
      "npm install *",
      "npm run dev",
      "npm run build", 
      "npm run lint",
      "npm run lint -- --fix",
      "npm test",
      "npm test -- *",
      "npx prisma generate",
      "npx prisma migrate dev",
      "npx prisma migrate dev -- --name *",
      "npx prisma db push",
      "npx prisma db seed",
      "npx prisma studio",
      "npx prettier --write *",
      "npx eslint --fix *",
      "npx tsc --noEmit",
      "docker-compose up -d",
      "docker-compose down",
      "docker-compose logs *",
      "git status",
      "git diff",
      "git diff --staged",
      "git add .",
      "git add *",
      "git commit -m *",
      "git push",
      "git push origin *",
      "git pull",
      "git checkout *",
      "git checkout -b *",
      "git branch",
      "git log --oneline -*",
      "gh pr create *",
      "gh pr list",
      "curl *",
      "cat *",
      "ls *",
      "mkdir *",
      "touch *"
    ],
    "deny": [
      "rm -rf /",
      "rm -rf ~",
      "rm -rf .",
      "git push --force",
      "git push -f",
      "git reset --hard HEAD~*",
      "DROP DATABASE",
      "DROP TABLE",
      "npx prisma migrate reset",
      "ssh * rm -rf *",
      "> /dev/sda",
      "chmod -R 777",
      "sudo rm *"
    ]
  },

  "contextFiles": [
    "CLAUDE.md",
    "prisma/schema.prisma",
    "src/types/index.ts",
    "package.json"
  ],

  "autoApprove": {
    "editing": true,
    "fileCreation": true,
    "commands": false
  }
}
```

-----

## Custom Slash Commands

### `.claude/commands/commit-push-pr.md`

```markdown
# /commit-push-pr

Create a commit, push, and open a pull request.

## Steps

1. Run `git status` to see all changes
2. Run `git diff` to understand what changed
3. Create a meaningful commit message following conventional commits:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `refactor:` for code changes that don't add features or fix bugs
   - `style:` for formatting changes
   - `docs:` for documentation
   - `test:` for adding tests
   - `chore:` for maintenance tasks

4. Run `git add .`
5. Run `git commit -m "type: description"`
6. Run `git push origin HEAD`
7. Run `gh pr create --fill` to create PR with auto-filled title/body

## Example

```bash
git add .
git commit -m "feat: add user profile settings page"
git push origin HEAD
gh pr create --title "feat: add user profile settings page" --body "## Changes\n- Added profile settings UI\n- Connected to API endpoints"
```

```
### `.claude/commands/verify-app.md`

```markdown
# /verify-app

Run all verification checks before committing.

## Steps (run in order, stop if any fail)

1. **TypeScript Check**
   ```bash
   npx tsc --noEmit
```

Fix any type errors before proceeding.

1. **Linting**
   
   ```bash
   npm run lint
   ```
   
   If errors, run `npm run lint -- --fix` and review changes.
1. **Build Test**
   
   ```bash
   npm run build
   ```
   
   Must complete without errors.
1. **Unit Tests** (if present)
   
   ```bash
   npm test -- --passWithNoTests
   ```
1. **Prisma Validation**
   
   ```bash
   npx prisma validate
   ```
1. **Visual Check**
- Open http://localhost:3000 in browser
- Check the pages affected by recent changes
- Test on mobile viewport (375px width)
- Report any visual issues

## Success Criteria

All 6 checks must pass before code is ready to commit.

```
### `.claude/commands/db-migrate.md`

```markdown
# /db-migrate

Safely create and apply a database migration.

## Arguments
- `$1` - Migration name (e.g., "add_user_preferences")

## Steps

1. **Verify schema changes**
   ```bash
   cat prisma/schema.prisma
```

Review the pending changes.

1. **Check for destructive changes**
   Look for:
- Removed fields (data loss!)
- Changed field types
- Removed models
   
   If destructive, STOP and confirm with user.
1. **Create migration**
   
   ```bash
   npx prisma migrate dev --name $1
   ```
1. **Regenerate client**
   
   ```bash
   npx prisma generate
   ```
1. **Verify migration**
   
   ```bash
   npx prisma migrate status
   ```

## Warnings

- NEVER run `prisma migrate reset` without explicit permission
- NEVER modify existing migrations
- Always backup data before destructive migrations

```
### `.claude/commands/deploy.md`

```markdown
# /deploy

Deploy the application to production.

## Pre-deployment Checklist

1. Run `/verify-app` first - all checks must pass
2. Ensure you're on `main` branch
3. All changes committed and pushed

## Steps

1. **Build locally to verify**
   ```bash
   npm run build
```

1. **Check environment variables**
   Verify prod has all required env vars from CLAUDE.md
1. **Database migrations (if any)**
   
   ```bash
   # SSH to production server
   ssh user@your-vps-ip
   cd /app
   npx prisma migrate deploy
   exit
   ```
1. **Deploy**
   
   ```bash
   git push origin main
   ```
   
   (Assumes CI/CD deploys on main push)
1. **Verify deployment**
- Check https://your-domain.com
- Test critical flows (search, booking)
- Check logs for errors: `ssh user@your-vps-ip "pm2 logs --lines 50"`
1. **Rollback if needed**
   
   ```bash
   git revert HEAD
   git push origin main
   ```

```
### `.claude/commands/refactor.md`

```markdown
# /refactor

Safely refactor code with proper verification.

## Arguments
- `$1` - File or directory to refactor
- `$2` - Refactoring goal (e.g., "extract component", "reduce complexity")

## Steps

1. **Understand current code**
   ```bash
   cat $1
```

Analyze structure, dependencies, and tests.

1. **Check for tests**
   Look for corresponding test files. If none exist, write tests first.
1. **Identify dependencies**
   
   ```bash
   grep -r "import.*from.*$1" src/
   ```
   
   List all files that import this code.
1. **Make incremental changes**
- Small, focused commits
- Run `/verify-app` after each significant change
- Keep functionality identical
1. **Update imports**
   If file paths changed, update all importers.
1. **Final verification**
   
   ```bash
   npm run build
   npm test
   ```

## Rules

- Refactoring should NOT change behavior
- If behavior changes are needed, that’s a separate task
- Always have tests before refactoring complex code

```
---

## MCP Integration

### `.mcp.json` (project root or `~/.claude/`)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    
    "postgres": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
      }
    },
    
    "sentry": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sentry"],
      "env": {
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}",
        "SENTRY_ORG": "${SENTRY_ORG}",
        "SENTRY_PROJECT": "${SENTRY_PROJECT}"
      }
    },
    
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/your/repo"]
    }
  }
}
```

### MCP Environment Variables

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# MCP Server Tokens
export GITHUB_TOKEN="ghp_your_github_token"
export SLACK_BOT_TOKEN="xoxb-your-slack-token"
export SLACK_TEAM_ID="T01234567"
export SENTRY_AUTH_TOKEN="your-sentry-token"
export SENTRY_ORG="your-org"
export SENTRY_PROJECT="your-project"
```

-----

## Git Hooks & Automation

### `.claude/hooks/post-tool-use.sh`

```bash
#!/bin/bash
# Runs automatically after Claude edits files
# Ensures consistent formatting to avoid CI failures

set -e

# Only run in repo root
if [ ! -f "package.json" ]; then
  exit 0
fi

echo "🔧 Auto-formatting edited files..."

# Format with Prettier
npx prettier --write \
  "src/**/*.{ts,tsx,js,jsx,json,css,md}" \
  "prisma/**/*.prisma" \
  --log-level error 2>/dev/null || true

# Fix ESLint issues
npx eslint --fix \
  "src/**/*.{ts,tsx}" \
  --quiet 2>/dev/null || true

# Regenerate Prisma client if schema changed
if git diff --name-only | grep -q "prisma/schema.prisma"; then
  echo "📦 Prisma schema changed, regenerating client..."
  npx prisma generate
fi

echo "✅ Formatting complete"
```

### Git Pre-commit Hook (Optional)

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Prevent commits that would break CI

echo "Running pre-commit checks..."

# TypeScript
npx tsc --noEmit || {
  echo "❌ TypeScript errors found"
  exit 1
}

# Lint
npm run lint || {
  echo "❌ Linting errors found"
  exit 1
}

echo "✅ Pre-commit checks passed"
```

-----

## GitHub Actions

### Teammates (@claude in PRs)

The diagram shows teammates mentioning `@claude` in PR comments. Here’s the full workflow:

**How it works:**

1. Teammate opens a PR
1. They comment `@claude please review this code for security issues`
1. GitHub Action triggers Claude Code
1. Claude analyzes the PR and responds with a comment

**Morning Routine (from diagram):**

```
Launch all sessions & check in later
```

Set up your agents in the morning, give them tasks, then check PRs on your phone throughout the day.

### `.github/workflows/claude-pr.yml`

```yaml
name: Claude PR Assistant

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  claude-respond:
    # Only run if comment mentions @claude
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout PR branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      
      - name: Extract Claude request
        id: extract
        run: |
          COMMENT='${{ github.event.comment.body }}'
          # Extract everything after @claude
          REQUEST=$(echo "$COMMENT" | sed 's/.*@claude//')
          echo "request=$REQUEST" >> $GITHUB_OUTPUT
      
      - name: Run Claude
        id: claude
        run: |
          RESPONSE=$(claude -p "${{ steps.extract.outputs.request }}" --output-format json)
          echo "response<<EOF" >> $GITHUB_OUTPUT
          echo "$RESPONSE" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      
      - name: Post response
        uses: actions/github-script@v7
        with:
          script: |
            const response = `${{ steps.claude.outputs.response }}`;
            let parsed;
            try {
              parsed = JSON.parse(response);
            } catch {
              parsed = { result: response };
            }
            
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `🤖 **Claude Response:**\n\n${parsed.result || response}`
            });

  # Auto-update CLAUDE.md when PRs merge
  update-claude-md:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Append to CLAUDE.md
        run: |
          echo "" >> CLAUDE.md
          echo "### PR #${{ github.event.pull_request.number }} merged ($(date +%Y-%m-%d))" >> CLAUDE.md
          echo "- ${{ github.event.pull_request.title }}" >> CLAUDE.md
      
      - name: Commit update
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add CLAUDE.md
          git commit -m "docs: update CLAUDE.md with merged PR" || exit 0
          git push
```

-----

## Daily Workflow

### Morning Startup Script

Save as `~/start-claude-agents.sh`:

```bash
#!/bin/bash
# Launch multi-agent Claude Code setup

PROJECT_DIR="/path/to/your/repo"
cd "$PROJECT_DIR"

# Use iTerm2 or tmux
if command -v tmux &> /dev/null; then
  # Create tmux session with 5 panes
  tmux new-session -d -s claude -n agents
  
  # Pane 0: Dev server
  tmux send-keys -t claude:agents.0 "cd $PROJECT_DIR && npm run dev" Enter
  
  # Pane 1: Opus Planner (main agent)
  tmux split-window -h -t claude:agents
  tmux send-keys -t claude:agents.1 "cd $PROJECT_DIR && claude --model claude-opus-4-5-20250514" Enter
  
  # Pane 2: Frontend Agent
  tmux split-window -v -t claude:agents.0
  tmux send-keys -t claude:agents.2 "cd $PROJECT_DIR && claude" Enter
  
  # Pane 3: Backend Agent  
  tmux split-window -v -t claude:agents.1
  tmux send-keys -t claude:agents.3 "cd $PROJECT_DIR && claude" Enter
  
  # Pane 4: Tests/DevOps
  tmux new-window -t claude -n tools
  tmux send-keys -t claude:tools "cd $PROJECT_DIR && npm test -- --watch" Enter
  
  # Attach to session
  tmux attach -t claude

else
  echo "tmux not found. Please open terminals manually:"
  echo "  T1: cd $PROJECT_DIR && npm run dev"
  echo "  T2: cd $PROJECT_DIR && claude --model claude-opus-4-5-20250514"
  echo "  T3: cd $PROJECT_DIR && claude"
  echo "  T4: cd $PROJECT_DIR && claude"
  echo "  T5: cd $PROJECT_DIR && npm test -- --watch"
fi
```

Make executable: `chmod +x ~/start-claude-agents.sh`

### Typical Session

```bash
# Start all agents
~/start-claude-agents.sh

# In the Opus pane (Pane 1), give your main instruction:
> Read CLAUDE.md for context. Today I want to build the user profile 
> settings feature. Create a detailed plan, then coordinate the work:
> - Frontend work goes to the frontend agent (Pane 2)
> - Backend/API work goes to the backend agent (Pane 3)
> Write task instructions to files that I'll copy to other agents.

# Opus creates the plan, you review it
# Copy tasks to other agent panes as needed
# Check in periodically to see progress

# When done, in any agent:
> /verify-app
> /commit-push-pr
```

-----

## Terminal Setup (iTerm2)

### Profile for Claude Agents

1. **Create new profile**: iTerm2 → Preferences → Profiles → +
1. **Name it**: “Claude Agent”
1. **Settings**:
- Colors: Use a distinct color scheme so you know it’s Claude
- Terminal → Notifications → “Post notifications for session activity”
- Terminal → “Silence bell” → OFF
- Session → “Always prompt before closing”

### Window Arrangement

Save your layout: Window → Save Window Arrangement → “Claude Multi-Agent”

Recommended layout:

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   Dev Server (T1)   │   Opus Planner (T2) │
│                     │                     │
├─────────────────────┼─────────────────────┤
│                     │                     │
│   Frontend (T3)     │   Backend (T4)      │
│                     │                     │
├─────────────────────┴─────────────────────┤
│              Tests/DevOps (T5)            │
└───────────────────────────────────────────┘
```

-----

## Long Tasks (Agents & Sandbox)

The diagram shows three advanced patterns for handling long-running tasks:

### (a) Background Agents

Run tasks asynchronously and get notified on completion:

```bash
# Start a background task
claude -p "Run full test suite and report results" --background

# Or in an interactive session, use:
> Run this task in the background: [your long task]
```

**Notification setup** (macOS):

```bash
# Add to your shell profile
claude_notify() {
  claude -p "$1" --output-format json && \
  osascript -e 'display notification "Claude task completed" with title "Claude Code"'
}

# Usage
claude_notify "Run all E2E tests"
```

### (b) Stop Hooks

Interrupt long-running tasks when specific conditions are met:

```bash
# Create .claude/hooks/stop-conditions.sh
#!/bin/bash
# Returns exit code 0 to STOP, non-zero to CONTINUE

# Stop if build errors exceed threshold
ERROR_COUNT=$(grep -c "error" /tmp/claude-output.log 2>/dev/null || echo 0)
if [ "$ERROR_COUNT" -gt 10 ]; then
  echo "Too many errors ($ERROR_COUNT), stopping..."
  exit 0
fi

# Stop if running longer than 30 minutes
# (Implement your own timeout logic)

exit 1  # Continue running
```

### (c) Ralph-Wiggum Plugin (Chaos Testing)

“Wild but effective” — Use random inputs to find edge cases:

```markdown
# .claude/commands/chaos-test.md

# /chaos-test

Generate random/unexpected inputs to find edge cases.

## Steps

1. Identify the feature or component to test
2. Generate edge cases:
   - Empty strings, null, undefined
   - Very long strings (10000+ chars)
   - Special characters: `<script>`, `'; DROP TABLE`, `../../etc/passwd`
   - Unicode: emojis 🎉, RTL text, zero-width chars
   - Boundary numbers: 0, -1, MAX_INT, Infinity, NaN
   - Invalid dates: Feb 30, year 0, far future

3. Run each through the component
4. Document any crashes or unexpected behavior
5. Create regression tests for failures found
```

-----

## Local + Web Sessions (claude.ai)

The diagram shows using **both** terminal Claude Code AND web Claude.ai sessions in parallel:

### Terminal Sessions (Claude Code)

- T1: Dev server
- T2: Tests
- T3: DB migrations
- T4: Docs
- T5: Infra

### Web Sessions (claude.ai)

- W1: Research — Look up documentation, best practices
- W2: Code review — Paste code for detailed review
- W3: Planning — High-level architecture discussions
- W4: Debugging — Analyze error logs, stack traces
- W5: Creative writing — Documentation, blog posts, README

### Seamless State Transfer

Pass context between local and web sessions:

```bash
# Export context from terminal to share with web Claude
claude -p "Summarize current project state" --output-format json > /tmp/context.json

# Copy to clipboard for pasting into claude.ai
cat /tmp/context.json | pbcopy  # macOS
cat /tmp/context.json | xclip   # Linux
```

**In web Claude.ai:**

```
Here's the context from my local Claude Code session:
[paste context]

Now help me think through the architecture for...
```

-----

## Subagents

Create specialized sub-agents for specific tasks:

### `.claude/commands/code-simplifier.md`

```markdown
# /code-simplifier

Analyze and simplify code for better maintainability.

## Arguments
- `$1` - File or directory to analyze

## Steps

1. **Analyze complexity**
   - Identify deeply nested code (>3 levels)
   - Find duplicate code blocks
   - Spot overly long functions (>50 lines)

2. **Apply DRY principle**
   - Extract repeated code into functions
   - Create shared utilities
   - Use composition over repetition

3. **Simplify conditionals**
   - Replace nested if/else with early returns
   - Use guard clauses
   - Consider switch/match for multiple conditions

4. **Improve naming**
   - Variables should describe their content
   - Functions should describe their action
   - Avoid abbreviations

5. **Run verification**
   ```bash
   npm run build
   npm test
```

## Output

Provide a summary of changes made and complexity reduced.

```
### `.claude/commands/verify-e2e.md`

```markdown
# /verify-e2e

Run end-to-end tests and verify UI functionality.

## Steps

1. **Start the application**
   ```bash
   npm run dev &
   sleep 10  # Wait for server
```

1. **Run E2E tests**
   
   ```bash
   npx playwright test
   # or
   npx cypress run
   ```
1. **Check critical user flows**
- [ ] Homepage loads
- [ ] Search functionality works
- [ ] Booking flow completes
- [ ] Voice assistant initializes
1. **Visual regression** (if configured)
   
   ```bash
   npx playwright test --update-snapshots
   ```
1. **Report results**
   Summarize pass/fail and any screenshots of failures.

```
---

## Verifies Own Work (Chrome Extension)

The diagram mentions Claude using a Chrome extension for UI/UX testing. Here's how to set this up:

### Option 1: Playwright for Visual Verification

Add to your project:

```bash
npm install -D @playwright/test
npx playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
```

### Option 2: Screenshot Verification Command

```markdown
# .claude/commands/check-ui.md

# /check-ui

Take screenshots and verify UI looks correct.

## Steps

1. **Ensure dev server is running**
   ```bash
   curl -s http://localhost:3000 > /dev/null || npm run dev &
```

1. **Take screenshots of key pages**
   
   ```bash
   npx playwright screenshot http://localhost:3000 /tmp/home.png
   npx playwright screenshot http://localhost:3000/search /tmp/search.png
   npx playwright screenshot http://localhost:3000/booking /tmp/booking.png
   ```
1. **Analyze screenshots**
   Review each screenshot for:
- Layout issues (overlapping elements, broken grids)
- Missing content
- Styling problems
- Mobile responsiveness (take at 375px width too)
1. **Test interactions**
   
   ```bash
   npx playwright test e2e/smoke.spec.ts
   ```
1. **Report findings**
   List any visual issues found with specific details.

```
### Real Feedback Loop

The key insight from the diagram: **Claude verifying its own work leads to 2-3x better results**.

Add this to your workflow:
```bash
# After Claude makes changes, always run:
> Now verify your changes by running /check-ui and /verify-app
> Fix any issues you find before marking this task complete.
```

-----

## Mobile Monitoring (iPhone)

The diagram shows iPhone integration for monitoring agents while away.

### Option 1: Slack Notifications

With MCP Slack integration, Claude can send you updates:

```markdown
# Add to your CLAUDE.md

## Notification Rules
When completing major tasks, send a Slack message to #dev-notifications:
- Task completed successfully
- Errors encountered
- Waiting for human input
```

### Option 2: SSH from iPhone

Use an SSH app (Termius, Blink Shell) to:

- Check tmux sessions: `tmux attach -t claude`
- View agent output
- Send quick commands

### Option 3: GitHub Mobile

Enable GitHub notifications on mobile. When Claude creates PRs or comments, you’ll get notified.

-----

## Quick Reference

### Essential Commands

|Command                                  |Description                               |
|-----------------------------------------|------------------------------------------|
|`claude`                                 |Start Claude Code (uses Sonnet by default)|
|`claude --model claude-opus-4-5-20250514`|Start with Opus (for planning)            |
|`claude -p "task"`                       |Run headless, single task                 |
|`claude -p "task" --output-format json`  |Headless with JSON output                 |
|Shift+Tab (x2)                           |Enter plan mode                           |
|`/plan <description>`                    |Create a plan before executing            |
|`/commit-push-pr`                        |Custom: commit, push, create PR           |
|`/verify-app`                            |Custom: run all checks                    |

### Key Files

|File                   |Purpose                      |
|-----------------------|-----------------------------|
|`CLAUDE.md`            |Shared context for all agents|
|`.claude/settings.json`|Permissions & model config   |
|`.claude/commands/*.md`|Custom slash commands        |
|`.mcp.json`            |External tool connections    |

### Safety Rules

- ✅ Pre-approve safe commands in settings.json
- ✅ Log every mistake in CLAUDE.md
- ✅ Start complex tasks in Plan Mode (Opus)
- ✅ Run `/verify-app` before committing
- ❌ Never use `--dangerously-skip-permissions`
- ❌ Never let agents push to main without review
- ❌ Never run `prisma migrate reset` in prod

-----

## Troubleshooting

### Claude doesn’t see CLAUDE.md

```bash
# Make sure it's in repo root
ls -la CLAUDE.md

# Explicitly tell Claude to read it
> Read CLAUDE.md and confirm you understand the project context
```

### MCP server not connecting

```bash
# Test server manually
npx -y @modelcontextprotocol/server-github

# Check environment variables
echo $GITHUB_TOKEN
```

### Agents conflicting on same files

- Use clear task boundaries (frontend vs backend)
- Have Opus coordinate file ownership
- Use git branches per agent if needed

### Commands not auto-approved

- Check `.claude/settings.json` syntax
- Patterns use glob matching: `npm install *` matches `npm install axios`
- Restart Claude session after changing settings

-----

*Generated for your Next.js 16 + React 19 + Prisma + PostgreSQL stack*
*Save this file and use it as your setup reference*