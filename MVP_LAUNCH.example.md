# Stickee MVP Launch Checklist (example — no real values)

This is a placeholder copy of `MVP_LAUNCH.md` for anyone setting up a new environment.
`MVP_LAUNCH.md` itself is gitignored because it ends up containing real secret values
once you fill it in for your own environment — never remove it from `.gitignore`, and
never paste real values into a file that isn't gitignored.

**Goal:** Go from working localhost to a live, data-populated app that runs its agents automatically.

---

## Phase 1 — Admin Access (do this now, before anything else)

### 1.1 Add yourself as admin via env var

In `.env.local` (for local dev) add:

```
STICKEE_ADMIN_EMAILS=<your-email@example.com>
```

In Vercel (for production), add the same env var under **Settings → Environment Variables**.

This is all you need — `isAppAdmin()` checks that env var and automatically upserts you into `app_admins`. No SQL required.

---

## Phase 2 — Seed Real Parliament Data (15 min)

With the local dev server running (`npm run dev`), run these two curl commands in sequence. They populate `members` then `divisions + member_votes`, which gives parliament-watcher something to work with.

### 2.1 Sync members (MPs & senators)

```bash
curl -X POST http://localhost:3000/api/sync/members \
  -H "x-sync-secret: <SYNC_SECRET — fetch from your password manager / Vercel env, never commit>"
```

Expected: `{"synced": 226}` (approx)

### 2.2 Sync divisions (votes — takes 2–3 min)

```bash
curl -X POST "http://localhost:3000/api/sync/divisions?limit=50" \
  -H "x-sync-secret: <SYNC_SECRET>"
```

Expected: `{"divisions": 50, "votes": ~7000}`

### 2.3 Run parliament-watcher to generate feed posts

```bash
curl -X POST http://localhost:3000/api/agents/parliament-watcher \
  -H "x-sync-secret: <SYNC_SECRET>"
```

After this, the `/feed` page will show **real civic alerts** instead of mock data.

### 2.4 Run the daily-bonus agent (seeds wallets for existing users)

```bash
curl -X POST http://localhost:3000/api/agents/daily-bonus \
  -H "x-sync-secret: <SYNC_SECRET>"
```

### 2.5 Run migration 014 in Supabase SQL Editor

Paste and run `supabase/migrations/014_daily_bonus_agent.sql` in the Supabase dashboard
to seed the `daily-bonus` agent row. (Or paste `migrations_bundle.sql` again — it's idempotent,
though see the audit notes about that file being stale relative to the numbered migrations.)

---

## Phase 3 — Deploy to Vercel (30 min)

### 3.1 Push to GitHub

```bash
cd ~/stickee
git add -A
git commit -m "your commit message"
git push origin main
```

### 3.2 Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables from `.env.local` — fetch the real values from your own
   password manager / Vercel project settings, never from a committed file:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | *(from your Supabase project settings)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(from your Supabase project settings)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from your Supabase project settings — server-only, never expose)* |
| `THEYVOTEFORYOU_API_KEY` | *(request your own key)* |
| `SYNC_SECRET` | *(generate: `openssl rand -hex 32`)* |
| `CRON_SECRET` | *(generate: `openssl rand -hex 32`)* |
| `STICKEE_ADMIN_EMAILS` | *(your email)* |

5. Deploy.

### 3.3 Verify CRON_SECRET is set

Vercel injects `CRON_SECRET` automatically — but you can override with your own value for predictability. The cron jobs in `vercel.json` will call your API routes with `Authorization: Bearer <CRON_SECRET>` automatically.

---

## Phase 4 — Configure Supabase Auth for Production (10 min)

In [Supabase dashboard](https://app.supabase.com) → your project → **Authentication → URL Configuration**:

1. **Site URL**: `https://your-app.vercel.app`
2. **Redirect URLs**: add `https://your-app.vercel.app/auth/callback`

Without this, magic link sign-ins will fail in production.

---

## Phase 5 — Post-Deploy Verification

After deploying, run the data seeding commands against your production URL, using the real
`CRON_SECRET` value from Vercel's environment variable settings (never paste it into a file):

```bash
PROD=https://your-app.vercel.app

curl -X GET "$PROD/api/sync/members" \
  -H "Authorization: Bearer <CRON_SECRET>"

curl -X GET "$PROD/api/sync/divisions" \
  -H "Authorization: Bearer <CRON_SECRET>"

curl -X GET "$PROD/api/agents/parliament-watcher" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Then open `$PROD/admin/agents` — you should see the agents listed, all with green last_status after your runs.

---

## Agent Roster

| Agent | Purpose | Cadence |
|-------|---------|---------|
| Parliament Watcher | Turns TVFY divisions into civic alert feed posts; flags party rebellions | 15 min |
| Daily Bonus Distributor | Credits points to every wallet daily | Daily |
| Prediction Resolver | Grades free-poll predictions, updates civic scores | 30 min |
| Moderation Triage | Auto-resolves spam; escalates flagged content | 5 min |
| Bill Stage Tracker | Detects bill stage transitions, notifies users | 2 hr |
| MP Scorecard | Recalculates MP alignment score (not the public-facing "Stickee Score" — see IMPLEMENTATION_BATCH_1_REPORT.md) | Daily |
| Electorate Pulse | Weekly engagement digest per electorate | Weekly |
