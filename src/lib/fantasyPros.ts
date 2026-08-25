export interface PlayerInfo {
  ecr: string | null;
  adp: string | null;
  bestWorst: string | null;
  rostered: string | null;
  outlook: string | null;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

/**
 * Scrape a FantasyPros player page for the outlook strip (ECR/Best-Worst/ADP/
 * Rostered) and the "Expert Note" outlook paragraph. Cached server-side.
 * Returns null if the page can't be fetched (site changed / blocked / offline).
 */
export async function scrapeFantasyProsPlayer(page: string): Promise<PlayerInfo | null> {
  const url = `https://www.fantasypros.com/nfl/players/${page}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();

  let ecr: string | null = null;
  let adp: string | null = null;
  let bestWorst: string | null = null;
  let rostered: string | null = null;

  const strip = html.match(/<dl class="player-bio-header_outlook-strip">([\s\S]*?)<\/dl>/);
  if (strip) {
    const pairs = strip[1].matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g);
    for (const m of pairs) {
      const k = stripTags(m[1]).replace(/\s+/g, " ").trim();
      const v = stripTags(m[2]).replace(/\s+/g, " ").trim();
      if (/draft rank/i.test(k)) ecr = v;
      else if (/best/i.test(k)) bestWorst = v;
      else if (/adp/i.test(k)) adp = v;
      else if (/rostered/i.test(k)) rostered = v;
    }
  }

  let outlook: string | null = null;
  const note = html.match(
    /<div class="subsection feature-stretch ">[\s\S]*?<div class="content">\s*<p>([\s\S]*?)<\/p>/,
  );
  if (note) {
    outlook = stripTags(note[1]).replace(/\s+/g, " ").trim();
  }

  return { ecr, adp, bestWorst, rostered, outlook };
}
