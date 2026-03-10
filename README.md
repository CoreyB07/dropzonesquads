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

## 4. Deploy to GitHub Pages + Cloudflare

1. Push this repo to GitHub (`main` branch).
2. In GitHub repo settings -> Secrets and variables -> Actions, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. In GitHub repo settings -> Pages:
   - Source: `GitHub Actions`
   - Custom domain: `www.dropzonesquads.com`
   - Enable `Enforce HTTPS` after DNS is valid.
4. In Cloudflare DNS for `dropzonesquads.com`, add:
   - `CNAME` record: `www` -> `coreyb07.github.io`
   - `A` record: `@` -> `185.199.108.153`
   - `A` record: `@` -> `185.199.109.153`
   - `A` record: `@` -> `185.199.110.153`
   - `A` record: `@` -> `185.199.111.153`
5. In Cloudflare Rules, add a redirect:
   - `dropzonesquads.com/*` -> `https://www.dropzonesquads.com/$1` (301)
6. Wait for DNS propagation, then rerun the deploy workflow if needed.

## 5. Supabase Auth URLs (Required for Email Auth Flows)

In Supabase -> Authentication -> URL Configuration:

- Site URL: `https://www.dropzonesquads.com`
- Additional Redirect URLs:
  - `http://localhost:5173`
  - `https://www.dropzonesquads.com`
  - `https://dropzonesquads.com`

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
