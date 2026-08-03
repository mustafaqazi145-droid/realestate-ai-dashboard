# Admin Dashboard — Phase 2

A Vite + React app that lets a non-technical agency admin add/edit/delete
properties (with image upload) and manage leads — no SQL required.

Security note: this talks to Supabase directly using the **anon public key**,
which is safe to expose in frontend code. Real protection comes from the
Row Level Security policies already in your database — the anon key can only
do what those policies allow (read your own org's data; write only if your
`profiles.role` is admin/owner).

## Setup (local)

1. `cd admin-dashboard`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` — already filled with your project URL
   - `VITE_SUPABASE_ANON_KEY` — Supabase Dashboard → Project Settings → API →
     "anon public" key (NOT the service_role key — never put that one here)
4. Run the storage + admin-linking SQL: open
   `../supabase/migrations/0003_storage_and_admin.sql` in the Supabase SQL
   Editor, run the top part (bucket + policies), then:
   - Dashboard → Authentication → Users → **Add user** (create your own login)
   - Copy that user's UID
   - Uncomment the `insert into profiles (...)` block at the bottom of the
     file, paste your UID and org id, and run it
5. `npm run dev` → open the printed localhost URL, log in with the user you
   just created.

## Deploy (free, commercial-use-allowed)

Use **Cloudflare Pages**, not Vercel Hobby (Vercel's free tier forbids
commercial/revenue-generating use — Cloudflare Pages' free tier does not):

1. Push this project to a GitHub repo
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → connect the repo
3. Build command: `npm run build` — Output directory: `dist`
4. Add the same two environment variables (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) in Cloudflare Pages' settings
5. Deploy — you'll get a free `*.pages.dev` URL

## What's next
- **Phase 4**: customer-facing chat widget calling the `property-search`
  Edge Function we already deployed
- **Phase 9**: a signup flow so a new prospective client can create their own
  org + admin login and start adding their own inventory (the "bring your own
  data" demo)
