import { ROSTER, NAMES } from "./_roster.js";
import { renderCard, toDataUri } from "./_render.js";

const ART_HOSTS = [
  "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/",
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/",
];

function findKey(o, k, d = 0) {
  if (!o || typeof o !== "object" || d > 6) return null;
  if (typeof o[k] === "string" && o[k]) return o[k];
  for (const i in o) { const r = findKey(o[i], k, d + 1); if (r) return r; }
  return null;
}

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    const handle = String(q.u || "").replace(/^@/, "");
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return res.status(400).send("bad handle");
    const poke = ROSTER[String(q.p || "")];
    if (!poke) return res.status(400).send("unknown pokemon");
    const nums = String(q.c || "").split(",").map((x) => Math.max(0, Math.min(100, parseInt(x, 10) || 0)));
    const pct = {};
    Object.keys(NAMES).forEach((k, i) => (pct[k] = nums[i] ?? 50));

    const artP = toDataUri(ART_HOSTS.map((b) => b + poke.dex + ".png"), 5000);

    let avatarUrl = null;
    const a = String(q.a || "");
    if (/^[0-9]+\/[A-Za-z0-9_\-]+\.(jpg|jpeg|png)$/.test(a)) avatarUrl = "https://pbs.twimg.com/profile_images/" + a;
    else {
      try {
        const r = await fetch("https://api.fxtwitter.com/2/profile/" + handle, { signal: AbortSignal.timeout(3000) });
        if (r.ok) avatarUrl = findKey(await r.json(), "avatar_url");
        if (avatarUrl) avatarUrl = avatarUrl.replace("_normal", "_400x400");
      } catch {}
    }
    if (avatarUrl && !/^https:\/\/pbs\.twimg\.com\//.test(avatarUrl)) avatarUrl = null;

    const [avatar, art] = await Promise.all([
      avatarUrl ? toDataUri(avatarUrl, 4000) : null,
      artP,
    ]);
    const png = await renderCard({ handle, poke, pct, avatar, art });
    res.setHeader("Content-Type", "image/png");
    // never let a degraded card (missing Pokemon art / avatar) get stuck in the CDN for a day
    const complete = art && (!avatarUrl || avatar);
    res.setHeader("Cache-Control", complete
      ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
      : "public, max-age=0, s-maxage=30");
    res.status(200).send(png);
  } catch (e) {
    res.status(500).send("could not draw card");
  }
}
