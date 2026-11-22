# Screenshots

Captured from the running app (production build, `http://localhost:3000`) against the live Supabase database,
17–22 November 2026, at 1440×1000 (except the mobile shot).

## Captured

| File | Shows |
|---|---|
| `01-home.png` | Home page — hero, navigation, feature cards |
| `02-login.png` | Login page with the pending-approval notice |
| `03-register.png` | Registration form with the university list loaded from the live Hipo Labs API |
| `04-competitions.png` | Competitions page loaded from Supabase (fees, prizes, venues) |
| `05-events.png` | Events page |
| `06-blogs.png` | Blogs page with Blog Post / Achievement tabs |
| `07-highlights.png` | Highlights page (gallery + results tabs) |
| `08-universities.png` | Universities page with live external API results |
| `09-dashboard.png` | **Participant dashboard** — approved banner, upcoming events, own registration |
| `10-admin-dashboard.png` | **Admin dashboard** — Registrations / Competitions / Events / Blogs / Results / History |
| `11-mobile.png` | Home page at phone width (responsive layout) |
| `12-register-validation.png` | Validation errors on the register form |
| `13-upload.png` | Payment proof selected in the upload control |
| `14-dashboard-pending.png` | Dashboard for a fresh account — "pending admin approval" |
| `15-edit-registration.png` | Editing a pending registration |
| `16-admin-proof.png` | Proof retrieved through a short-lived signed URL (private bucket) |
| `17-admin-approved.png` | Admin viewing the registration after approval |
| `19-api-error-state.png` | External API failure state with the retry / manual fallback |
| `23-protected-route.png` | `/dashboard` while logged out redirects to `/login?next=…` |
| `24-logout.png` | After logging out |
| `22-vercel-deployment.png` | The live site at https://vspark-nu.vercel.app |

## Still to capture (needs your accounts)

| File | Why it is missing |
|---|---|
| `18-cancel-registration.png` | The browser's native confirm dialog does not appear in automated screenshots — take it manually |
| `20-supabase-tables.png` | Supabase Table Editor (requires your Supabase dashboard login) |
| `21-supabase-bucket.png` | The `payment-proofs` bucket with an uploaded file (Supabase dashboard) |


Keep these filenames so the links in the main README keep working.
