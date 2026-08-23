// Imports FantasyPros consensus rankings into src/data/rankings.json.
//
// Usage:
//   node scripts/import-rankings.mjs [URL]
//   # default: https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php
//
// The page embeds a JSON array of player records. We extract each object,
// keep QB/RB/WR/TE, and write { name, position, rank, adp } sorted by rank.

import { writeFile } from "node:fs/promises";

const DEFAULT_URL = "https://www.fantasypros.com/nfl/rankings/ppr-cheatsheets.php";
const URL = process.argv[2] || DEFAULT_URL;
const ALLOWED = new Set(["QB", "RB", "WR", "TE"]);

// Robustly extract balanced JS objects that begin with the player token.
function extractObjects(html) {
  const startToken = '{"player_id":';
  const results = [];
  let idx = 0;
  while ((idx = html.indexOf(startToken, idx)) !== -1) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (let j = idx; j < html.length; j++) {
      const c = html[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === "{") depth++;
        else if (c === "}") {
          depth--;
          if (depth === 0) {
            end = j + 1;
            break;
          }
        }
      }
    }
    if (end === -1) break;
    try {
      results.push(JSON.parse(html.slice(idx, end)));
    } catch {
      /* skip malformed */
    }
    idx = end;
  }
  return results;
}

const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
const html = await res.text();

const raw = extractObjects(html).filter((o) => ALLOWED.has(o.player_position_id));

// Dedupe by player_id, keep the richest record.
const byId = new Map();
for (const o of raw) {
  const prev = byId.get(o.player_id);
  if (!prev) {
    byId.set(o.player_id, o);
  } else if (o.rank_ecr != null && (prev.rank_ecr == null || o.rank_ecr < prev.rank_ecr)) {
    byId.set(o.player_id, o);
  }
}

const list = [...byId.values()];
list.sort((a, b) => (a.rank_ecr ?? 99999) - (b.rank_ecr ?? 99999));

const out = list.map((o) => ({
  // Store the raw display name; the app normalizes it with the same rule used
  // to match Sleeper players (see src/lib/espn.ts normalizeName).
  name: o.player_name,
  position: o.player_position_id,
  rank: o.rank_ecr ?? null,
  adp: o.rank_ave ?? null,
}));

await writeFile("src/data/rankings.json", JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`Wrote ${out.length} players to src/data/rankings.json`);
const top = out.slice(0, 10).map((o) => `${o.rank ?? o.adp} ${o.name} (${o.position})`).join("\n  ");
console.log("Top 10:\n  " + top);
