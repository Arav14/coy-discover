import { withDb } from "../../../lib/db.js";
import { getMatches } from "../../../lib/discover.js";
import { CURRENT_USER, json, handleError } from "../../../lib/http.js";

export const dynamic = "force-dynamic";

// GET /matches -> mutual matches only
export async function GET() {
  try {
    return json({ matches: await withDb((db) => getMatches(db, CURRENT_USER)) });
  } catch (err) {
    return handleError(err);
  }
}
