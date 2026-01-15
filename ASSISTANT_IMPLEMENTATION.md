# Conversational AI Hotel Booking Assistant

## Implementation Status

**Branch:** `claude/conversational-hotel-booking-demo-nDpic`
**Commit:** `915821a` - Add conversational AI hotel booking assistant (Her-inspired)

## Architecture

### Page Route
- **URL:** `/assistant`
- **File:** `src/app/assistant/page.tsx`
- **Entry Component:** `AssistantCanvas`

### Component Hierarchy

```
AssistantCanvas (src/components/assistant/AssistantCanvas.tsx)
├── PresenceOrb (src/components/assistant/PresenceOrb.tsx)
│   └── Framer Motion breathing animations
├── TranscriptDisplay (src/components/assistant/TranscriptDisplay.tsx)
│   └── Typewriter effect for messages
├── HotelResults (src/components/assistant/HotelResults.tsx)
│   └── Floating hotel cards
└── VoiceIndicator (src/components/assistant/VoiceIndicator.tsx)
    └── Mic/speaker toggle buttons
```

### API Routes
- `POST /api/realtime/session` - Creates ephemeral OpenAI token for WebRTC

### Hooks
- `useRealtimeSession` (src/hooks/useRealtimeSession.ts) - WebRTC connection to OpenAI Realtime API

### Configuration
- `src/lib/assistant/systemPrompt.ts` - AI personality ("Bell" the concierge)
- `src/lib/assistant/tools.ts` - Tool definitions for hotel search

## Dependencies Added

```json
{
  "openai": "latest",
  "framer-motion": "latest"
}
```

## Environment Variables Required

```env
OPENAI_API_KEY=sk-...  # Required for Realtime API
```

## Troubleshooting

### Common Issues & Fixes (2026-01-14)

**Issue 1: "No hotels found" - Location lookup failing**
- **Symptom:** Console shows `❌ ASSISTANT: No location found for: Miami`
- **Root cause:** API expects `q` parameter but code was sending `query`
- **Fix:** Changed `/api/locations/autocomplete?query=...` → `/api/locations/autocomplete?q=...`
- **Location:** `src/components/assistant/AssistantCanvas.tsx:41`

**Issue 2: Runtime error "Objects are not valid as a React child (found: object with keys {CityCode, value})"**
- **Root cause:** Multiple data mapping mismatches between API response and component expectations:
  - Coordinates: `latitude/longitude` → should be `lat/lng`
  - Address: `line1` → should be `addressLine1`
  - Currency: `currency` → should be `currencyCode`
  - Distance: number → should be formatted string with "mi"
- **Fix:** Updated data mapping in `src/components/assistant/AssistantCanvas.tsx:84-102`
  ```typescript
  // Correct mapping:
  latitude: location.lat,
  longitude: location.lng,
  address: hotel.address?.addressLine1 || hotel.address?.city,
  currency: hotel.currencyCode || 'USD',
  distance: hotel.distance ? `${hotel.distance.toFixed(1)} mi` : undefined
  ```

**Issue 3: AI says "no results" even when search succeeds**
- **Symptom:** Search API returns 72 hotels but AI doesn't receive them
- **Root cause:** Tool result format not properly structured for OpenAI Realtime API
- **Fix:** Enhanced result formatting in `src/hooks/useRealtimeSession.ts:123-145`
  - Send up to 8 hotels (was 5)
  - Better price formatting: `$150.00 per night`
  - Include success message: "Found 72 hotels available for your dates"
  - Proper error handling with fallback messages

**Issue 4: User waits 5-10 seconds in silence during search**
- **Root cause:** Hotel search takes 5-10 seconds, AI didn't know to fill the gap
- **Fix:** Updated system prompt with CRITICAL TIMING STRATEGY
- **Location:** `src/lib/assistant/systemPrompt.ts:45-57`
- **Behavior:** AI now:
  1. Starts search immediately when it has destination/dates/guests
  2. Tells user "Let me search for hotels..."
  3. Asks about budget/preferences while search runs
  4. Presents results matched to stated preferences

### 404 Error Troubleshooting

If `/assistant` returns 404:

1. **Check files exist:**
   ```bash
   ls -la src/app/assistant/
   # Should show: page.tsx
   ```

2. **Verify build:**
   ```bash
   npm run build
   # Should show: ○ /assistant in routes
   ```

3. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Check component imports:**
   - `src/app/assistant/page.tsx` imports `AssistantCanvas`
   - `src/components/assistant/AssistantCanvas.tsx` must exist
   - All sub-components must be valid

5. **Verify dependencies:**
   ```bash
   npm install framer-motion
   ```

## Files in This Implementation

| File | Purpose |
|------|---------|
| `src/app/assistant/page.tsx` | Page entry point |
| `src/app/api/realtime/session/route.ts` | Token generation API |
| `src/components/assistant/AssistantCanvas.tsx` | Main UI orchestrator |
| `src/components/assistant/PresenceOrb.tsx` | AI presence animation |
| `src/components/assistant/TranscriptDisplay.tsx` | Chat messages |
| `src/components/assistant/HotelResults.tsx` | Search results cards |
| `src/components/assistant/VoiceIndicator.tsx` | Voice controls |
| `src/components/assistant/index.ts` | Barrel exports |
| `src/hooks/useRealtimeSession.ts` | WebRTC hook |
| `src/lib/assistant/systemPrompt.ts` | AI personality |
| `src/lib/assistant/tools.ts` | Tool definitions |

## Design Philosophy (Her-Inspired)

- **Voice-first:** Technology melts into background
- **Minimal UI:** Blank warm-white canvas, single orb
- **Ambient presence:** Breathing animation indicates AI state
- **Natural conversation:** No forms, just talk

## OpenAI Realtime API Flow

1. Page loads → `useRealtimeSession.connect()` called
2. Fetches ephemeral token from `/api/realtime/session`
3. Creates WebRTC peer connection
4. Establishes data channel for events
5. Connects to `api.openai.com/v1/realtime`
6. AI greets user, begins conversation
7. User speaks → transcribed → AI responds
8. When ready, AI calls `searchHotels` tool
9. Results displayed as floating cards
