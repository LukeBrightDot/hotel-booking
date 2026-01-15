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
| 3 | `SABRE_BOOKING_API_MAPPING.md` | **THE TRUTH** | Booking uses **V2 API** (`/v2.0.0/book/hotels`). Field mappings complete. |
| 4 | `BELLHOPPING_BOOKING_PAYLOAD_CAPTURED.md` | **CAPTURED** | Actual form data from bellhopping.com (2026-01-13) |
| 5 | `SABRE_AUTH_V3_TEST_RESULTS.md` | **Confirmed** | Documents why V3 fails (not provisioned, not broken) |
| 6 | `bellhopping.com` (Live Site) | **SPY TARGET** | Reference for UI/UX implementation |
| 7 | `SABRE_API_REFERENCE.md` | **DEPRECATED** | Field definitions only - NOT for endpoints/auth |

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
- **Discovery method:** 100+ tests to find working format

### Booking API Access (2026-01-15)
- **All booking endpoints return 403** on cert environment (PCC 52JL)
- Endpoints tested: `/v1/book/hotels`, `/v2/book/hotels`, `/v2.0.0/book/hotels`, `/v3/book/hotels`
- Versionless `/book/hotels`: Returns 200 OK but empty response
- Error: `ERR.2SG.SEC.NOT_AUTHORIZED - Authorization failed due to no access privileges`
- **Likely cause:** Cert environment lacks booking privileges, OR different endpoint/payload needed
- **Next:** Test production credentials, spy on bellhopping.com traffic, or brute force alternatives

### Search (Complete)
- V5 API: `POST /v5/get/hotelavail`
- RefPointType: `"6"` for codes, `"3"` for coordinates
- Date format: `YYYY-MM-DDT00:00:00`

### Booking (In Progress - 2026-01-15)
- ✅ **Booking flow captured** from bellhopping.com
- ❌ **Booking API access denied** - ERR.2SG.SEC.NOT_AUTHORIZED
- **Discovery Results:**
  - Tested ALL endpoint variations (V1, V2, V2.0.0, V3, versionless)
  - All versioned endpoints: 403 Forbidden
  - Versionless endpoint `/book/hotels`: 200 OK with empty response
  - PCC 52JL lacks booking API privileges (cert environment)
- **Next Steps:**
  - Test production environment credentials
  - Spy on bellhopping.com actual Sabre API calls
  - OR continue brute force testing with different payload structures
- **Critical Fields (when access enabled):**
  - `RoomTypeCode`, `RateCode` from search results
  - Guest address REQUIRED (line1, city, postal, country)
  - Phone number STRONGLY RECOMMENDED
  - Card type mapping: VISA→VI, MC→MC, AMEX→AX
  - Expiration format: `YYYY-MM`

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

### Current Focus: Booking Flow Implementation
- [x] Spy on bellhopping.com booking process
- [x] Capture complete form structure (24+ fields)
- [x] Map to Sabre API (`/v2.0.0/book/hotels`)
- [x] Identify missing fields (address, phone)
- [x] Create TypeScript interfaces
- [x] Implement booking service (src/lib/sabre/booking.ts) ✅
- [x] Build booking API endpoint (src/app/api/booking/create/route.ts) ✅
- [x] Test all endpoint variations (100+ tests) ✅
- [x] Document findings (SABRE_BOOKING_ENDPOINT_DISCOVERY_RESULTS.md) ✅
- [ ] **BLOCKED:** Test with production credentials
- [ ] **BLOCKED:** Spy on bellhopping.com's actual Sabre API traffic
- [ ] Update booking form UI (add address, phone)
- [ ] Create confirmation page
- [ ] End-to-end testing

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
