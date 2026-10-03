// Shared helpers for the /api functions. Files starting with "_" are not exposed as routes by Vercel.
// Secrets come ONLY from Vercel environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY.

export const TABLE = "decision_checks";

export const FOCUS_SKILLS = [
  "Diagnosing the real problem",
  "Prioritising",
  "Capacity planning",
  "Stakeholder management",
  "Escalation judgement",
  "Customer communication",
];

const base = () => String(process.env.SUPABASE_URL || "").replace(/\/$/, "");

// Works with both Supabase key styles: legacy service_role JWT ("eyJ...") and new secret keys ("sb_secret_...").
export function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  const h = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

// Counts rows matching a PostgREST filter, e.g. "visitor_id=eq.abc".
export async function countRows(filter) {
  const r = await fetch(`${base()}/rest/v1/${TABLE}?select=id${filter ? "&" + filter : ""}`, {
    method: "HEAD",
    headers: { ...sbHeaders(), Prefer: "count=exact" },
  });
  if (!r.ok) throw new Error(`Supabase count failed (${r.status})`);
  const range = r.headers.get("content-range") || "*/0"; // e.g. "0-2/3" or "*/0"
  return parseInt(range.split("/")[1], 10) || 0;
}

export async function selectRows(query) {
  const r = await fetch(`${base()}/rest/v1/${TABLE}?${query}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Supabase select failed (${r.status})`);
  return r.json();
}

export async function insertRow(row) {
  const r = await fetch(`${base()}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
  if (!r.ok) console.error("Supabase insert failed", r.status, await r.text());
  return r.ok;
}
