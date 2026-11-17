import { resetDb } from "../../../lib/db.js";
import { json, handleError } from "../../../lib/http.js";

// POST /reset -> restore seed data (demo convenience)
export async function POST() {
  try {
    await resetDb();
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
