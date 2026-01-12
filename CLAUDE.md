# CLAUDE.md - Project Context & Rules

## Project: Travel Agency Sabre Integration (Bellhopping Replica)
**Goal:** Replicate `hotels.bellhopping.com` booking flow using Sabre API.
**Context:** "V2" build. We have "V1" findings that override official docs.
**Current Focus:** Booking Flow (Search is complete)

---

## Source of Truth (Hierarchy)

| Priority | Document | Status | What It's For |
|----------|----------|--------|---------------|
| 1 | `AUTHENTICATION_FIXED.md` | **THE TRUTH** | V2 EPR Auth (`V1:USER:PCC:DOMAIN`). V3 is NOT provisioned. |
| 2 | `SEARCH_IMPLEMENTATION_STATUS.md` | **THE TRUTH** | Search uses **V5 API** (`/v5/get/hotelavail`) |
| 3 | `SABRE_AUTH_V3_TEST_RESULTS.md` | **Confirmed** | Documents why V3 fails (not provisioned, not broken) |
| 4 | `bellhopping.com` (Live Site) | **SPY TARGET** | Reference for Booking Payload structure |
| 5 | `SABRE_API_REFERENCE.md` | **DEPRECATED** | Field definitions only - NOT for endpoints/auth |

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **DB:** PostgreSQL + Prisma (`SearchLog`, `HotelResult`, `Booking`)
- **API:** Sabre REST (V2 Auth, V5 Search)
- **Styling:** Tailwind CSS

---

## Multi-Agent Workflow (Whiteboard Protocol)

### Agent Roles
| Agent | Model | Role | Use For |
|-------|-------|------|---------|
| **iTerm Claude** | Sonnet | Executor | Code edits, git, npm, browser control |
| **Web Claude** | Opus 4.5 | Planner | Complex planning, architecture, payload mapping |
| **Chrome Extension** | Haiku | Inspector | Spy on bellhopping.com, test UI |

### Workflow Steps

**1. SPY FIRST (Chrome Extension)**
```
DO NOT GUESS PAYLOADS. Capture exactly what bellhopping.com sends.
- Open DevTools > Network tab
- Perform booking action on bellhopping.com
- Copy request payload and headers
- Paste into this conversation for analysis
```

**2. PLAN FIRST (Web Claude - Opus)**
```
Use & command in iTerm to pass context to Web session:
- Map captured payload -> Sabre API requirements
- Design API endpoint contract
- Identify missing fields
- Create implementation checklist
```

**3. EXECUTE (iTerm Claude - Sonnet)**
```
- Implement planned solution
- Run builds and tests
- Commit changes
- Verify with Chrome extension
```

### The & Command (Dispatch to Web)
The `&` prefix dispatches tasks to a web session (Opus 4.5) while you continue working locally.

**Dispatch:**
```bash
# In iTerm, prefix your message with &
& Analyze this booking payload from bellhopping.com and create implementation plan:
{...captured JSON...}
```

**Check Progress:**
```bash
/tasks   # View status of background web sessions
```

**Teleport Results Back:**
```bash
/teleport   # Interactive picker to bring web session back
/tp         # Shorthand
claude --teleport <session-id>   # Resume specific session
```

**Note:** Session transfer is one-way (web → local). You dispatch with `&`, then `/teleport` back.

---

## Lessons Learned (Memory Bank)

### Authentication
- Client ID `VD35-Coastline52JL` is **NOT** provisioned for V3 password grant
- V2 EPR works: `V1:250463:52JL:AA` format
- Base URL: `https://api.sabre.com` (NOT cert subdomain)
- Token lasts 7 days (604800 seconds)

### Search (Complete)
- V5 API: `POST /v5/get/hotelavail`
- RefPointType: `"6"` for codes, `"3"` for coordinates
- Date format: `YYYY-MM-DDT00:00:00`

### Booking (Next Phase)
- DO NOT implement without spying bellhopping.com first
- Capture: Room selection, Guest form, Payment payloads
- Expected endpoint: CreatePassengerNameRecordRQ or similar

### Chrome Integration
- Browser MUST be open and connected to CLI
- Use DevTools Network tab to capture real requests
- Test UI changes in localhost:3000

---

## Project Status

### Completed
- [x] V2 EPR Authentication (~200ms)
- [x] V5 Hotel Search API
- [x] Location Autocomplete
- [x] Search Results UI

### Current Focus: Booking Flow
- [ ] Spy on bellhopping.com booking process
- [ ] Map room selection payload
- [ ] Map guest information payload
- [ ] Map payment/booking confirmation payload
- [ ] Implement booking API endpoint
- [ ] Build booking UI forms

---

## Quick Reference

### Start Dev Server
```bash
npm run dev  # http://localhost:3000
```

### Test Auth
```bash
curl http://localhost:3000/api/auth/test
# Expected: {"status":"success","version":"v2-epr"}
```

### Key Files
```
src/lib/sabre/auth.ts     # V2 EPR authentication
src/lib/sabre/search.ts   # V5 hotel search
src/app/api/search/hotels/route.ts  # Search endpoint
prisma/schema.prisma      # Booking model ready
```

---

## Rules for All Agents

1. **No Hallucinated Payloads** - Always verify against bellhopping.com
2. **V1 Findings Win** - If V1 docs contradict Architecture.md, V1 wins
3. **Test in Chrome** - Every UI change should be verified visually
4. **Log Mistakes** - Add lessons learned to this file when things break
5. **Plan Complex Tasks** - Use Opus (Plan Mode) before executing
