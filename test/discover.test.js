import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeed } from "../lib/seed.js";
import { getFeed, recordSwipe, getMatches, DiscoverError } from "../lib/discover.js";

const ME = "me";
const fresh = () => buildSeed();
const likerIds = (db) => db.inboundLikes.filter((l) => l.to === ME).map((l) => l.from);
const nonLikerId = (db) => db.profiles.find((p) => !likerIds(db).includes(p.id)).id;

test("seed has 30+ complete profiles and some inbound likes", () => {
  const db = fresh();
  assert.ok(db.profiles.length >= 30);
  for (const p of db.profiles) {
    for (const k of ["id", "name", "age", "photo", "bio", "location", "interests"]) assert.ok(p[k], `${p.id}.${k}`);
    assert.ok(p.interests.length > 0);
  }
  assert.ok(likerIds(db).length > 0);
  assert.equal(new Set(db.profiles.map((p) => p.id)).size, db.profiles.length, "ids unique");
});

test("feed returns every unswiped profile, public fields only", () => {
  const db = fresh();
  const { profiles, remaining } = getFeed(db, ME);
  assert.equal(profiles.length, db.profiles.length);
  assert.equal(remaining, db.profiles.length);
  for (const p of profiles) {
    assert.deepEqual(Object.keys(p).sort(), ["age", "bio", "id", "interests", "location", "name", "photo"]);
  }
});

test("feed respects limit and reports remaining", () => {
  const db = fresh();
  const { profiles, remaining } = getFeed(db, ME, { limit: 5 });
  assert.equal(profiles.length, 5);
  assert.equal(remaining, db.profiles.length);
});

test("swiped profiles never reappear in the feed", () => {
  const db = fresh();
  const [a, b] = getFeed(db, ME).profiles;
  recordSwipe(db, ME, { profileId: a.id, action: "like" });
  recordSwipe(db, ME, { profileId: b.id, action: "pass" });
  const ids = getFeed(db, ME).profiles.map((p) => p.id);
  assert.ok(!ids.includes(a.id));
  assert.ok(!ids.includes(b.id));
  assert.equal(ids.length, db.profiles.length - 2);
});

test("feed order is stable across calls", () => {
  const db = fresh();
  assert.deepEqual(getFeed(db, ME).profiles.map((p) => p.id), getFeed(db, ME).profiles.map((p) => p.id));
});

test("feed order does not front-load people who liked the user", () => {
  const db = fresh();
  const ids = getFeed(db, ME).profiles.map((p) => p.id);
  const likers = new Set(likerIds(db));
  const firstN = ids.slice(0, likers.size);
  assert.ok(firstN.some((id) => !likers.has(id)), "likers should not all be at the top");
});

test("liking someone who liked you creates a match", () => {
  const db = fresh();
  const liker = likerIds(db)[0];
  const res = recordSwipe(db, ME, { profileId: liker, action: "like" });
  assert.equal(res.matched, true);
  assert.equal(res.match.profile.id, liker);
  assert.equal(getMatches(db, ME).length, 1);
});

test("liking someone who has not liked you is not a match", () => {
  const db = fresh();
  const res = recordSwipe(db, ME, { profileId: nonLikerId(db), action: "like" });
  assert.deepEqual(res, { matched: false });
  assert.equal(getMatches(db, ME).length, 0);
});

test("passing on someone who liked you reveals nothing", () => {
  const db = fresh();
  const pass = recordSwipe(db, ME, { profileId: likerIds(db)[0], action: "pass" });
  const likeNoMatch = recordSwipe(db, ME, { profileId: nonLikerId(db), action: "like" });
  // Pass on a liker and an unrequited like must be indistinguishable.
  assert.deepEqual(pass, { matched: false });
  assert.deepEqual(pass, likeNoMatch);
  assert.equal(getMatches(db, ME).length, 0);
});

test("API outputs never contain one-sided like data", () => {
  const db = fresh();
  recordSwipe(db, ME, { profileId: likerIds(db)[0], action: "like" });
  const blob = JSON.stringify([getFeed(db, ME), getMatches(db, ME)]);
  for (const word of ["likedMe", "likedYou", "inboundLikes", "likes"]) {
    assert.ok(!blob.includes(word), `leaked "${word}"`);
  }
  // Only the matched liker appears in matches; other likers stay hidden.
  const matchedIds = getMatches(db, ME).map((m) => m.profile.id);
  assert.deepEqual(matchedIds, [likerIds(db)[0]]);
});

test("cannot swipe the same profile twice", () => {
  const db = fresh();
  const id = nonLikerId(db);
  recordSwipe(db, ME, { profileId: id, action: "pass" });
  assert.throws(() => recordSwipe(db, ME, { profileId: id, action: "like" }), (e) => e instanceof DiscoverError && e.status === 409);
  assert.equal(db.swipes.length, 1);
});

test("rejects bad input without mutating state", () => {
  const db = fresh();
  const cases = [
    [{ profileId: "", action: "like" }, 400],
    [{ action: "like" }, 400],
    [{ profileId: "p01", action: "superlike" }, 400],
    [{ profileId: "nope", action: "like" }, 404],
    [{ profileId: ME, action: "like" }, 400],
  ];
  for (const [body, status] of cases) {
    assert.throws(() => recordSwipe(db, ME, body), (e) => e.status === status, JSON.stringify(body));
  }
  assert.equal(db.swipes.length, 0);
});

test("matches are newest first", () => {
  const db = fresh();
  const [a, b] = likerIds(db);
  recordSwipe(db, ME, { profileId: a, action: "like" }, new Date("2026-11-10T00:00:00Z"));
  recordSwipe(db, ME, { profileId: b, action: "like" }, new Date("2026-11-11T00:00:00Z"));
  assert.deepEqual(getMatches(db, ME).map((m) => m.profile.id), [b, a]);
});
