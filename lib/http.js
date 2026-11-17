import { DiscoverError } from "./discover.js";

export const CURRENT_USER = "me"; // single logged-in user, no auth per the brief

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function handleError(err) {
  if (err instanceof DiscoverError) {
    return json({ error: err.code, message: err.message }, err.status);
  }
  console.error(err);
  return json({ error: "internal", message: "Something went wrong" }, 500);
}
