# HANDOVER landing page + live AI feedback

HANDOVER helps Indian SaaS companies move their own support employees into customer onboarding roles.
This repo is the landing page (Task 3) plus one working AI feature (Task 4): **"Make the call"**,
where a visitor answers a real onboarding scenario and gets feedback on their decision.

## How it works
- `index.html` – the landing page. Its "Live AI practice" band shows live numbers from `/api/stats` and links to the practice workspace.
- `try.html` – the practice workspace (served at `/try`): pick a case, make the call, get AI feedback from `/api/feedback`, see live numbers from `/api/stats`.
- `vercel.json` – turns on clean URLs so `/try` works.
- `api/feedback.js` – Vercel serverless function. Checks caps in Supabase, calls Gemini with the system prompt, validates the output, logs the exchange to Supabase, returns the feedback.
- `api/stats.js` – reads back from Supabase: decisions reviewed, % strong calls, top focus skills this week.
- `api/_shared.js` – Supabase helpers (not a route).
- `supabase/schema.sql` – the `decision_checks` table. Run once in Supabase.

## Environment variables (set in Vercel only, never in code)
| Name | Where it comes from |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio → Get API key |
| `SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API Keys → secret key (`sb_secret_…`) or legacy `service_role` key |
| `GEMINI_MODEL` (optional) | Defaults to `gemini-2.5-flash-lite` |

## Caps and guardrails
- 350 max output tokens per request, thinking budget 0
- 3 reviews per visitor (random id in the browser, counted in Supabase); 30 per hashed IP per 24 hours as a backstop
- Answers must be 30–1,200 characters; email addresses and phone numbers are rejected
- The model refuses anything that isn't a genuine answer to the scenario (prompt injection, off-topic requests, CVs, judging named people), and never judges the person or predicts hiring/promotion
- The server re-checks the model output (verdict and skill must come from fixed lists; text is length-limited)
