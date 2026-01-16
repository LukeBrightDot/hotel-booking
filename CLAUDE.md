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
| 3 | `DEPLOYMENT_GUIDE.md` | **THE TRUTH** | Complete VPS deployment guide with database setup (2026-01-16) |
| 4 | `DEPLOYMENT_CHECKLIST.md` | **REFERENCE** | Quick reference checklist for deployment |
| 5 | `LUXURY_OPERATIONS_GUIDE.md` | **THE TRUTH** | Luxury hotel discovery system - operational guide (2026-01-16) |
| 6 | `LUXURY_AUTO_DISCOVERY.md` | **THE TRUTH** | Luxury hotel auto-discovery technical documentation |
| 7 | `DATABASE_SETUP.md` | **REFERENCE** | Database setup instructions (local and production) |
| 8 | `SEARCH_LOGGING_IMPLEMENTATION.md` | **REFERENCE** | Search logging technical details |
| 9 | `HOTEL_IMAGES_IMPLEMENTATION.md` | **THE TRUTH** | Two-phase hotel images: Live API (done) + DB override (planned) |
| 10 | `BOOKING_PAYLOAD_DISCOVERY_PLAN.md` | **THE TRUTH** | Booking endpoint discovery (2026-01-15). Correct: `/v2/book/hotels` with `CreateBookingRQ`. |
| 10 | `SABRE_SUPPORT_REQUEST.md` | **ACTIVE** | Support request for booking API access (ERR.2SG.SEC.NOT_AUTHORIZED) |
| 11 | `SABRE_BOOKING_API_MAPPING.md` | **REFERENCE** | Field mappings for booking payload (structure confirmed) |
| 12 | `BELLHOPPING_BOOKING_PAYLOAD_CAPTURED.md` | **CAPTURED** | Actual form data from bellhopping.com (2026-01-13) |
| 13 | `SABRE_AUTH_V3_TEST_RESULTS.md` | **Confirmed** | Documents why V3 fails (not provisioned, not broken) |
| 14 | `bellhopping.com` (Live Site) | **SPY TARGET** | Reference for UI/UX implementation |
| 15 | `SABRE_API_REFERENCE.md` | **DEPRECATED** | Field definitions only - NOT for endpoints/auth |

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

### Voice Assistant UI (Complete - 2026-01-15)
- **Location:** `/assistant` route, powered by OpenAI Realtime API
- **Design:** iPhone/Siri-inspired premium aesthetic
- **Features:**
  - 24-bar waveform animation (state-based: idle, listening, speaking, thinking)
  - Price range filtering ("around $200", "under $300", etc.)
  - Glassmorphic controls with gradient buttons
  - Inter font for clean typography
  - Subtle gradient background (slate-50 → white → blue-50)
- **Key Bugs Fixed:**
  - Tailwind `w-2` compiling to `width: 0px` → Fixed with inline `width: '6px'`
  - Audio element not in DOM → Added `document.body.appendChild(audioEl)`
  - AnimatePresence `mode="wait"` causing stuck opacity → Removed prop
- **Discovery Method:** Browser automation debugging with Chrome DevTools

### Booking (Discovery Complete - 2026-01-15)
- ✅ **Payload structure discovered** through systematic testing (15 variations)
- ✅ **Correct endpoint:** `POST https://api.sabre.com/v2/book/hotels`
- ✅ **Correct wrapper:** `CreateBookingRQ` with `HotelBookInfo` nested structure
- ✅ **Authentication works:** V2 EPR token accepted
- ❌ **BLOCKED:** ERR.2SG.SEC.NOT_AUTHORIZED - PCC 52JL lacks booking API permissions
- **Status:** Both CERT and PRODUCTION return 403 Forbidden
- **Blocker:** Awaiting Sabre support to enable booking API access
- **Discovery method:** Tested all endpoint variations, confirmed `/v2/book/hotels` recognizes payload
- **Critical Fields (for when access is granted):**
  - `RoomTypeCode`, `RateCode` from search results
  - Guest address REQUIRED (line1, city, postal, country)
  - Phone number STRONGLY RECOMMENDED
  - Card type mapping: VISA→VI, MC→MC, AMEX→AX
  - Expiration format: `YYYY-MM`
- **Next step:** Contact Sabre support with SABRE_SUPPORT_REQUEST.md

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
- [x] Voice Assistant (OpenAI Realtime API)
- [x] Price Range Filtering for Voice Search
- [x] Premium UI Redesign (iPhone/Siri-style waveform, glassmorphism)
- [x] **Luxury Hotel Intelligence System** (2026-01-16)
  - [x] Two-phase discovery (Hypothesis → Proof via rate probing)
  - [x] Auto-enrichment of search results with luxury program badges
  - [x] Re-verification script for stale data detection
  - [x] UI components (LuxuryBadge, LuxuryBadgeGroup)
  - [x] Integration with search API and hotel cards
  - [x] Operational documentation and safety guidelines
- [x] **Search Result Logging & Analytics** (2026-01-16)
  - [x] Database logging for all searches (SearchLog, HotelResult models)
  - [x] Session tracking across searches
  - [x] Luxury hotel appearance statistics
  - [x] Analytics dashboard (/analytics)
  - [x] API endpoint for statistics (/api/analytics/search-stats)
  - [x] Failed search logging for debugging
- [x] **Real Hotel Images from Sabre API** (2026-01-16)
  - [x] Phase 1: Live API images (extract from MediaItems.MediaItem[])
  - [x] Smart image filtering (avoids maps, prefers JPG)
  - [x] Next.js Image optimization with domain whitelisting
  - [x] ResortCard component updated to use Next/Image
  - [ ] Phase 2: Database override for luxury hotels (planned)

### Current Focus: Booking API Access (BLOCKED)
- [x] Spy on bellhopping.com booking process
- [x] Capture complete form structure (24+ fields)
- [x] Discover correct endpoint and payload structure (15 test variations)
- [x] Confirm `/v2/book/hotels` with `CreateBookingRQ` wrapper
- [x] Test both CERT and PRODUCTION environments
- [x] Identify blocker: PCC 52JL lacks booking API permissions
- [x] Create Sabre support request documentation
- [ ] **BLOCKED:** Contact Sabre support for API access provisioning
- [ ] Test booking with real access (once granted)
- [ ] Update booking form UI (add address, phone)
- [ ] Implement booking service (src/lib/sabre/booking.ts)
- [ ] Build booking API endpoint (src/app/api/booking/create/route.ts)
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
# Authentication & Search
src/lib/sabre/auth.ts                        # V2 EPR authentication
src/lib/sabre/search.ts                      # V5 hotel search
src/app/api/search/hotels/route.ts           # Search endpoint

# Voice Assistant
src/app/assistant/page.tsx                   # Voice assistant page
src/components/assistant/PresenceOrb.tsx     # iPhone-style waveform (24 bars)
src/hooks/useRealtimeSession.ts              # OpenAI Realtime API integration
src/lib/assistant/tools.ts                   # AI function definitions (searchHotels, etc.)

# Luxury Hotel Intelligence System
src/lib/data/luxury-mapping.ts               # Knowledge base (chain codes, hotel IDs)
src/lib/services/luxury-probe.ts             # Rate validation service
src/lib/services/hotel-enricher.ts           # Runtime enrichment layer
src/components/hotel/LuxuryBadge.tsx         # UI components
src/components/voice/ResortCard.tsx          # Hotel card with badges
scripts/discover-luxury-hotels.ts            # Auto-discovery script
scripts/update-luxury-mappings.ts            # Database update script
scripts/reverify-luxury-hotels.ts            # Stale data detection

# Search Logging & Analytics
src/lib/services/search-logger.ts            # Search logging service
src/app/api/analytics/search-stats/route.ts  # Analytics API endpoint
src/app/analytics/page.tsx                   # Analytics dashboard UI

# Database
prisma/schema.prisma                         # All models (SearchLog, HotelResult, Booking, ApiLog)
src/lib/prisma.ts                            # Prisma client
```

---

## Rules for All Agents

1. **No Hallucinated Payloads** - Always verify against bellhopping.com
2. **V1 Findings Win** - If V1 docs contradict Architecture.md, V1 wins
3. **Test in Chrome** - Every UI change should be verified visually
4. **Log Mistakes** - Add lessons learned to this file when things break
5. **Plan Complex Tasks** - Use Opus (Plan Mode) before executing
