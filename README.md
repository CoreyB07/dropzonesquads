# Drop Zone Squads

## Current Architecture

- Frontend: React + Vite (`client/`)
- Hosting target: GitHub Pages
- Data backend: Supabase (`public.squads`, `public.profiles`, `public.marketing_subscribers`)
- Auth: Supabase Auth (email/password)

## 1. Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor and run:
   `supabase/schema.sql`
3. In Supabase Project Settings -> API, copy:
   - Project URL
   - Publishable key (public)
4. In Authentication -> Providers, ensure Email is enabled.
5. Optional: In Authentication -> Email, turn off confirmation if you want instant sign-in after registration.

## 2. Client Env Setup

Create `client/.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

You can use `client/.env.example` as a template.

## 3. Run Locally

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## 4. Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Configure a Pages workflow (Vite static build).
3. In GitHub repo settings -> Secrets and variables -> Actions, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Add your custom domain (`dropzonesquads.com`) in GitHub Pages settings and configure DNS.

## Notes

- The app no longer depends on `localhost:5000` for squads.
- Sign up / sign in / profile updates now use Supabase Auth + `public.profiles`.
- Browsing remains open; join/post actions require sign-in.
- Join-request application records are still stored locally in-browser in this version.
- Signup now includes optional marketing opt-in and stores subscribers in `public.marketing_subscribers`.
- Admin dashboard route is `/admin` (requires `profiles.is_admin = true` for your account).

## Make Yourself Admin

After you create your account, run this in Supabase SQL Editor:

```sql
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'your-email@example.com';
```
