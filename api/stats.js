// GET /api/stats
// Reads back from Supabase what the page shows publicly:
//  - total: how many decisions have been reviewed (valid attempts only)
//  - strongShare: % of those reviews judged a "strong call"
//  - topFocus: the skills people most often need to work on, last 7 days (top 5)

import { FOCUS_SKILLS, countRows, selectRows } from "./_shared.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET." });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server is missing Supabase settings." });
  }
  try {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const [total, strong, recent] = await Promise.all([
      countRows("is_valid_attempt=eq.true"),
      countRows("is_valid_attempt=eq.true&verdict=eq.strong"),
      selectRows(`select=focus_skill&is_valid_attempt=eq.true&created_at=gte.${encodeURIComponent(since)}&limit=2000`),
    ]);
    const counts = {};
    for (const r of recent) if (FOCUS_SKILLS.includes(r.focus_skill)) counts[r.focus_skill] = (counts[r.focus_skill] || 0) + 1;
    const topFocus = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=60");
    return res.status(200).json({
      total,
      strongShare: total ? Math.round((strong / total) * 100) : 0,
      weekCount: recent.length,
      topFocus,
    });
  } catch (e) {
    console.error(e);
    return res.status(503).json({ error: "Stats are unavailable right now." });
  }
}
