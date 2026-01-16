# Luxury Hotel Discovery - Operational Guide

This guide addresses critical operational considerations for running the luxury hotel discovery system in production.

---

## 🚨 Critical: Read-Only Filesystem Trap

### The Problem
Serverless platforms (Vercel, AWS Lambda, Netlify) have **read-only filesystems at runtime**. You **cannot** write to `src/lib/data/luxury-mapping.ts` in production.

### The Solution
Treat discovery/update scripts as **BUILD-TIME operations**, not runtime operations.

### Correct Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  LOCAL MACHINE or CI/CD PIPELINE                            │
├─────────────────────────────────────────────────────────────┤
│  1. npm run discover-luxury                                 │
│  2. npm run update-luxury-mappings --merge                  │
│  3. git add src/lib/data/luxury-mapping.ts                  │
│  4. git commit -m "Update luxury hotel mappings"            │
│  5. git push                                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  DEPLOYMENT (Vercel/Lambda)                                 │
├─────────────────────────────────────────────────────────────┤
│  1. Pull latest code (includes updated luxury-mapping.ts)  │
│  2. Build application                                       │
│  3. Deploy with luxury-mapping.ts baked into bundle         │
│  4. Runtime: Read luxury-mapping.ts (✅ Allowed)            │
│  5. Runtime: Write luxury-mapping.ts (❌ BLOCKED)           │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

✅ **DO:**
- Run scripts locally on your machine
- Run scripts in CI/CD pipeline (GitHub Actions, etc.)
- Commit updated `luxury-mapping.ts` to Git
- Deploy the committed file

❌ **DON'T:**
- Run discovery scripts on Vercel/Lambda
- Try to write files at runtime
- Build dynamic API endpoints that modify luxury-mapping.ts

---

## 🔄 Stale Data Strategy

### The Problem
Hotels can lose luxury program participation:
- Contracts expire
- Franchises change ownership
- Programs discontinue partnerships
- Your database becomes outdated

### The Solution: Monthly Re-Verification

#### 1. Re-Verification Script

```bash
# Re-verify all hotels
npm run reverify-luxury

# Re-verify specific program
npm run reverify-luxury -- --program=VIRTUOSO

# Dry run (preview removals)
npm run reverify-luxury -- --dry-run
```

#### 2. How It Works

```
For each hotel in luxury-mapping.ts:
  1. Re-probe Sabre API for luxury rates
  2. If successful → Clear failure count
  3. If failed → Increment failure count
  4. If failed 3x → Remove from database
```

#### 3. Failure Tracking

The script maintains a failure log (`.luxury-verification-failures.json`):

```json
[
  {
    "hotelId": "12345",
    "failureCount": 2,
    "lastFailure": "2026-01-15T10:30:00Z",
    "chainCode": "FS",
    "program": "VIRTUOSO"
  }
]
```

This prevents premature removal due to temporary issues (API outages, rate load delays, etc.).

#### 4. Schedule Monthly Checks

**Option A: Cron Job**
```bash
# Add to crontab (1st of month at 2am)
0 2 1 * * cd /path/to/project && npm run reverify-luxury && git add . && git commit -m "chore: reverify luxury hotels" && git push
```

**Option B: GitHub Actions** (Recommended)
```yaml
# .github/workflows/luxury-reverification.yml
name: Monthly Luxury Re-Verification

on:
  schedule:
    - cron: '0 2 1 * *'  # 1st of month at 2am UTC
  workflow_dispatch:      # Allow manual trigger

jobs:
  reverify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Re-verify luxury hotels
        run: npm run reverify-luxury
        env:
          SABRE_CLIENT_ID: ${{ secrets.SABRE_CLIENT_ID }}
          SABRE_CLIENT_SECRET: ${{ secrets.SABRE_CLIENT_SECRET }}
          SABRE_PCC: ${{ secrets.SABRE_PCC }}

      - name: Commit changes
        run: |
          git config --global user.name 'Luxury Bot'
          git config --global user.email 'bot@example.com'
          git add src/lib/data/luxury-mapping.ts
          git add .luxury-verification-failures.json
          git diff --staged --quiet || git commit -m "chore: remove stale luxury hotels"

      - name: Push changes
        run: git push
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📅 Dynamic Date Logic

### The Problem
Hardcoded dates in API queries:
- Break when the date passes
- Fail during holiday blackout periods
- Return false negatives due to minimum stay restrictions

### The Solution (Already Implemented ✅)

Our probe service uses **dynamic relative dates**:

```typescript
// From src/lib/services/luxury-probe.ts
const checkIn = addDays(new Date(), daysInFuture);   // Default: 45 days
const checkOut = addDays(checkIn, nightCount);       // Default: 2 nights

// API request
{
  "StayDateRange": {
    "StartDate": format(checkIn, 'yyyy-MM-dd'),     // Dynamic: 2026-03-01
    "EndDate": format(checkOut, 'yyyy-MM-dd')       // Dynamic: 2026-03-03
  }
}
```

### Why 45 Days?
- Far enough to have inventory available
- Avoids "sold out" false negatives
- Not so far that rates aren't loaded yet

### Avoiding Holiday False Negatives

**Problem:** Hotels often have minimum stay requirements during holidays (3-5 nights), so our 2-night probe fails.

**Blackout Periods to Avoid:**
- Christmas/New Year: Dec 20 - Jan 5
- Easter week: Variable (March/April)
- Chinese New Year: Variable (Jan/Feb)
- Major local holidays (Bastille Day in Paris, etc.)

**Solution:** The re-verification script's 3-strike rule prevents premature removal if a hotel fails during a holiday period.

```typescript
// Example: Hotel fails during Christmas
Strike 1: Dec 25 → Failed (holiday minimum stay)
Strike 2: Jan 10 → Failed (still in blackout)
Strike 3: Feb 1  → Failed (genuine issue) → REMOVED

// vs. Holiday-specific failure
Strike 1: Dec 25 → Failed (holiday)
Strike 2: Jan 10 → Success → Failure count reset to 0 ✅
```

---

## 🛡️ Safety Checklist

Before running discovery/update scripts:

### Pre-Flight Checklist
- [ ] I'm running this on my **local machine** or **CI/CD**, not on production server
- [ ] I have Sabre API credentials configured (`.env.local`)
- [ ] It's **not** a major holiday period (no Christmas, Easter, etc.)
- [ ] I'm using `--dry-run` first to preview changes
- [ ] I have a backup of `luxury-mapping.ts` (or it's in Git)

### Post-Execution Checklist
- [ ] Review the confirmed/rejected hotels list
- [ ] Check that success rate is reasonable (>50%)
- [ ] If many hotels failed, investigate (API issue? Holiday period?)
- [ ] Review the generated TypeScript code for errors
- [ ] Test locally with `npm run dev`
- [ ] Commit changes to Git
- [ ] Deploy to production

---

## 📊 Monitoring & Alerts

### Key Metrics to Track

1. **Discovery Success Rate**
   - Normal: 60-80% of candidates confirm
   - Alert if: <40% (API issue or pattern problem)

2. **Re-Verification Removals**
   - Normal: 0-5% removed per month
   - Alert if: >15% (widespread program changes or API issue)

3. **Probe Failures**
   - Normal: Occasional timeouts (retry automatically)
   - Alert if: Consistent failures (credential issue)

### GitHub Actions Notifications

Add to your workflow:

```yaml
- name: Notify if many removals
  if: ${{ steps.reverify.outputs.removed_count > 5 }}
  uses: 8398a7/action-slack@v3
  with:
    status: custom
    text: '⚠️ Warning: ${{ steps.reverify.outputs.removed_count }} luxury hotels were removed. Review changes manually.'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🔧 Troubleshooting

### "ERR.2SG.SEC.NOT_AUTHORIZED" during probe
**Cause:** Your PCC doesn't have access to Hotel Availability API
**Fix:** Contact Sabre support to enable `/v3.0.0/hotel/availability` endpoint

### Many hotels failing validation
**Possible Causes:**
1. Running during holiday period → Wait and retry
2. API credentials expired → Check `.env.local`
3. Sabre API outage → Check status.sabre.com
4. Testing too far in future (>180 days) → Rates not loaded yet

**Fix:** Run `--dry-run` first, check failure patterns

### Re-verification removes valid hotels
**Cause:** 3 consecutive failures due to temporary issues
**Fix:** Manually re-add to luxury-mapping.ts and clear failure log

### TypeScript errors after update
**Cause:** New program name not in type definitions
**Fix:** Add new programs to `LuxuryProgram` type in luxury-mapping.ts

---

## 🎯 Quick Reference

| Task | Command | Frequency |
|------|---------|-----------|
| Discover new hotels | `npm run discover-luxury -- --cities="Paris,Dubai"` | Monthly |
| Update database | `npm run update-luxury-mappings -- --merge` | After discovery |
| Re-verify existing | `npm run reverify-luxury` | Monthly (automated) |
| Dry run (safe) | `npm run discover-luxury -- --dry-run` | Before real run |
| Test changes | `npm run dev` | After updates |

---

## 🚀 Recommended Workflow

### Initial Setup
1. Run discovery on 10-15 major cities
2. Review confirmed hotels
3. Update mappings with `--merge`
4. Test locally
5. Commit and deploy

### Monthly Maintenance
1. GitHub Action auto-runs re-verification (1st of month)
2. Review PR with removed hotels
3. Merge if changes look reasonable
4. Auto-deploys to production

### Adding New Destinations
1. Run discovery: `npm run discover-luxury -- --cities="Maldives,Santorini" --merge`
2. Review new hotels
3. Commit and deploy

---

## 📚 Additional Resources

- **Discovery Documentation:** `LUXURY_AUTO_DISCOVERY.md`
- **Probe Service:** `src/lib/services/luxury-probe.ts`
- **Enrichment Layer:** `src/lib/services/hotel-enricher.ts`
- **UI Components:** `src/components/hotel/LuxuryBadge.tsx`

---

**Last Updated:** 2026-01-16
**Maintainer:** Development Team
