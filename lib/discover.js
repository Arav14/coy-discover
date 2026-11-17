// Core Discover logic. Pure functions over a plain `db` object so they can be
// unit-tested without HTTP or the filesystem.
//
// Privacy rule (Coy's core promise): nothing returned to the client may reveal
// that someone liked the user unless the like is mutual. Concretely:
//   - feed items never carry like information, and feed ORDER is independent
//     of who liked the user (no "likers first" boosting that could be inferred);
//   - a like that doesn't match and a pass return the exact same response shape;
//   - matches are only computed server-side.

import { createHash } from "node:crypto";

export class DiscoverError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const PUBLIC_FIELDS = ["id", "name", "age", "location", "bio", "interests", "photo"];

export function toPublicProfile(p) {
  const out = {};
  for (const k of PUBLIC_FIELDS) out[k] = p[k];
  return out;
}

// Stable per-user ordering: a hash of (userId, profileId). Deterministic, so the
// feed doesn't reshuffle on reload, and unrelated to like status.
function rank(userId, profileId) {
  return createHash("sha256").update(`${userId}:${profileId}`).digest("hex");
}

export function hasSwiped(db, userId, profileId) {
  return db.swipes.some((s) => s.userId === userId && s.profileId === profileId);
}

export function getFeed(db, userId, { limit } = {}) {
  const swiped = new Set(db.swipes.filter((s) => s.userId === userId).map((s) => s.profileId));
  const items = db.profiles
    .filter((p) => p.id !== userId && !swiped.has(p.id))
    .sort((a, b) => (rank(userId, a.id) < rank(userId, b.id) ? -1 : 1))
    .map(toPublicProfile);
  const remaining = items.length;
  return { profiles: limit ? items.slice(0, limit) : items, remaining };
}

function likedBy(db, fromId, toId) {
  // Another profile's like toward the user (seeded), or the user's own like.
  return (
    db.inboundLikes.some((l) => l.from === fromId && l.to === toId) ||
    db.swipes.some((s) => s.userId === fromId && s.profileId === toId && s.action === "like")
  );
}

export function recordSwipe(db, userId, { profileId, action }, now = new Date()) {
  if (typeof profileId !== "string" || !profileId) {
    throw new DiscoverError(400, "invalid_profile", "profileId is required");
  }
  if (action !== "like" && action !== "pass") {
    throw new DiscoverError(400, "invalid_action", 'action must be "like" or "pass"');
  }
  if (profileId === userId) {
    throw new DiscoverError(400, "invalid_profile", "cannot swipe on yourself");
  }
  const profile = db.profiles.find((p) => p.id === profileId);
  if (!profile) throw new DiscoverError(404, "not_found", "profile not found");
  if (hasSwiped(db, userId, profileId)) {
    throw new DiscoverError(409, "already_swiped", "profile already swiped");
  }

  const at = now.toISOString();
  db.swipes.push({ userId, profileId, action, at });

  if (action === "like" && likedBy(db, profileId, userId)) {
    const exists = db.matches.some((m) => m.userId === userId && m.profileId === profileId);
    if (!exists) db.matches.push({ userId, profileId, at });
    return { matched: true, match: { profile: toPublicProfile(profile), matchedAt: at } };
  }
  // Identical shape for "pass" and "like without match".
  return { matched: false };
}

export function getMatches(db, userId) {
  return db.matches
    .filter((m) => m.userId === userId)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((m) => {
      const p = db.profiles.find((x) => x.id === m.profileId);
      return p ? { profile: toPublicProfile(p), matchedAt: m.at } : null;
    })
    .filter(Boolean);
}
