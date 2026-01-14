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

## Troubleshooting 404 Error

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
   npm install
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
