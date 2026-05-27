# WC2026 Predictor

World Cup 2026 group stage predictor app. Pick a team per round, predict the score, top the leaderboard.

## Setup

### 1. Run the database migration

Go to your Supabase dashboard → SQL Editor → paste and run `supabase-migration.sql`

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

`.env.local` is pre-configured with your Supabase credentials.

For Railway deployment, add these env vars (find values in your Supabase project settings):
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
RESEND_API_KEY=<your-resend-api-key>
NEXT_PUBLIC_APP_URL=https://<your-railway-domain>
```

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to Railway

```bash
railway init
railway up
```

Set the env vars in Railway dashboard and add your domain.

## Admin

Go to `/admin` — default password is `worldcup26` (change it in Settings tab after first login).

### Admin workflow:
1. **Fixtures tab** — add the match fixtures for each round (who plays who)
2. **Settings tab** — keep entries open until kick-off, then close
3. **Settings tab** — reveal picks 1 hour before each round's kick-off
4. **Results tab** — enter actual scores after each round plays
5. **Entries tab** — view all picks + export CSV anytime

## Points

- ✅ Correct winner = **1 point**
- 🎯 Correct score = **3 points**
- ❌ Loss = **0 points**
