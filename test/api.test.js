// Integration tests: call the real route handlers against a temp JSON file,
// including a "reload" (fresh module state) to prove persistence.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.DB_PATH = path.join(mkdtempSync(path.join(tmpdir(), "coy-")), "db.json");

let feed, swipe, matches, reset, seed;
before(async () => {
  feed = await import("../app/api/feed/route.js");
  swipe = await import("../app/api/swipe/route.js");
  matches = await import("../app/api/matches/route.js");
  reset = await import("../app/api/reset/route.js");
  seed = (await import("../lib/seed.js")).buildSeed();
});

const get = (mod, url = "http://x/feed") => mod.GET(new Request(url));
const post = (body) =>
  swipe.POST(new Request("http://x/swipe", { method: "POST", headers: { "content-type": "application/json" }, body }));
const likers = () => seed.inboundLikes.map((l) => l.from);

test("GET /feed, POST /swipe, GET /matches end to end", async () => {
  await reset.POST();
  let res = await get(feed);
  assert.equal(res.status, 200);
  const start = (await res.json()).profiles.length;

  const liker = likers()[0];
  res = await post(JSON.stringify({ profileId: liker, action: "like" }));
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.matched, true);
  assert.equal(body.match.profile.id, liker);

  res = await get(feed);
  const after = (await res.json()).profiles;
  assert.equal(after.length, start - 1);
  assert.ok(!after.some((p) => p.id === liker));

  res = await get(matches, "http://x/matches");
  assert.deepEqual((await res.json()).matches.map((m) => m.profile.id), [liker]);
});

test("feed ?limit is applied", async () => {
  const res = await get(feed, "http://x/feed?limit=3");
  assert.equal((await res.json()).profiles.length, 3);
});

test("duplicate swipe -> 409, bad JSON -> 400, bad action -> 400, unknown -> 404", async () => {
  await reset.POST();
  const id = seed.profiles[0].id;
  assert.equal((await post(JSON.stringify({ profileId: id, action: "pass" }))).status, 201);
  assert.equal((await post(JSON.stringify({ profileId: id, action: "like" }))).status, 409);
  assert.equal((await post("{not json")).status, 400);
  assert.equal((await post(JSON.stringify({ profileId: id, action: "wink" }))).status, 400);
  assert.equal((await post(JSON.stringify({ profileId: "zzz", action: "like" }))).status, 404);
});

test("concurrent swipes are all persisted", async () => {
  await reset.POST();
  const ids = seed.profiles.slice(0, 10).map((p) => p.id);
  const results = await Promise.all(ids.map((profileId) => post(JSON.stringify({ profileId, action: "pass" }))));
  assert.ok(results.every((r) => r.status === 201));
  const remaining = (await (await get(feed)).json()).profiles.map((p) => p.id);
  assert.ok(ids.every((id) => !remaining.includes(id)));
});

test("swipes and matches persist across a reload", async () => {
  await reset.POST();
  const liker = likers()[1];
  await post(JSON.stringify({ profileId: liker, action: "like" }));
  // Simulate a server restart / page reload: new module instances read from disk.
  const feed2 = await import(`../app/api/feed/route.js?reload=${Date.now()}`);
  const matches2 = await import(`../app/api/matches/route.js?reload=${Date.now()}`);
  const f = (await (await feed2.GET(new Request("http://x/feed"))).json()).profiles;
  const m = (await (await matches2.GET(new Request("http://x/matches"))).json()).matches;
  assert.ok(!f.some((p) => p.id === liker));
  assert.deepEqual(m.map((x) => x.profile.id), [liker]);
});
