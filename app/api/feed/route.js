import { withDb } from "../../../lib/db.js";
import { getFeed } from "../../../lib/discover.js";
import { CURRENT_USER, json, handleError } from "../../../lib/http.js";

export const dynamic = "force-dynamic";

// GET /feed?limit=N -> profiles the user has not swiped on yet
export async function GET(req) {
  try {
    const raw = new URL(req.url).searchParams.get("limit");
    const limit = raw ? Math.min(Math.max(parseInt(raw, 10) || 0, 1), 100) : undefined;
    return json(await withDb((db) => getFeed(db, CURRENT_USER, { limit })));
  } catch (err) {
    return handleError(err);
  }
}
