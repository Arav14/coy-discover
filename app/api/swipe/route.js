import { withDb } from "../../../lib/db.js";
import { recordSwipe, DiscoverError } from "../../../lib/discover.js";
import { CURRENT_USER, json, handleError } from "../../../lib/http.js";

// POST /swipe { profileId, action: "like" | "pass" } -> { matched, match? }
export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new DiscoverError(400, "invalid_json", "body must be JSON");
    }
    const result = await withDb((db) => recordSwipe(db, CURRENT_USER, body ?? {}), { write: true });
    return json(result, 201);
  } catch (err) {
    return handleError(err);
  }
}
