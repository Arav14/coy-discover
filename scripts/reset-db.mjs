import { promises as fs } from "node:fs";
import path from "node:path";
import { buildSeed } from "../lib/seed.js";

const file = path.join(process.cwd(), "data", "db.json");
await fs.mkdir(path.dirname(file), { recursive: true });
await fs.writeFile(file, JSON.stringify(buildSeed(), null, 2));
console.log(`Seeded ${file}`);
