# CLAUDE.md - Project Context & Rules

## Project: Travel Agency Sabre Integration (Bellhopping Replica)
**Goal:** Replicate `hotels.bellhopping.com` booking flow using Sabre API.
**Context:** "V2" build. We have "V1" findings that override official docs.

## 🧠 Source of Truth (Hierarchy)
1.  **`AUTHENTICATION_FIXED.md`**: ✅ **THE TRUTH.** Use V2 EPR Auth (`V1:USER:PCC:DOMAIN`). V3 is BROKEN.
2.  **`SEARCH_IMPLEMENTATION_STATUS.md`**: ✅ **THE TRUTH.** Search uses **V5 API** (`/v5/get/hotelavail`), NOT `/v1.0.0`.
3.  **`bellhopping.com` (Live Site):** The reference for the Booking Payload structure.
4.  **`SABRE_API_REFERENCE.md`**: ⚠️ **DEPRECATED/SUSPECT.** Use only for field definitions, NOT for endpoints or auth logic.

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router)
- **DB:** PostgreSQL + Prisma (Schema: `SearchLog`, `HotelResult`, `Booking`)
- **API:** Sabre REST (V2 Auth, V5 Search)
- **Styling:** Tailwind CSS

## ⚡ Workflow (The "Whiteboard" Protocol)
1.  **Spy First:** We do not guess payloads. We inspect `bellhopping.com` Network tab to see *exactly* what JSON they send.
2.  **Plan First:** Use `&` (Web Session) to map Spy Data -> Sabre Requirements.
3.  **No Hallucinations:** If "V1" files contradict "Architecture.md", **V1 wins**.

## 📝 Lessons Learned (The Memory Bank)
- **Auth:** Client ID `VD35...` is NOT provisioned for V3. Must use V2 EPR.
- **Search:** V5 API requires `RefPointType` strategy (Code vs. Geo).
- **Chrome:** To spy on the competitor, the browser MUST be open and connected to CLI.