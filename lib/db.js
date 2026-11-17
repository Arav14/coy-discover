// Tiny JSON-file store. Writes are atomic (temp file + rename) and serialized
// through an in-process queue so concurrent requests can't clobber each other.

import { promises as fs } from "node:fs";
import path from "node:path";
import { buildSeed } from "./seed.js";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "db.json");

let queue = Promise.resolve();

async function load() {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    const seed = buildSeed();
    await save(seed);
    return seed;
  }
}

async function save(db) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_PATH);
}

// Run fn(db) exclusively. If fn returns { write: true }, the db is persisted.
export function withDb(fn, { write = false } = {}) {
  const run = queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    if (write) await save(db);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export async function resetDb() {
  return withDb(async () => {
    await save(buildSeed());
  });
}
