import { ROSTER, NAMES } from "../lib/roster.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default function handler(req, res) {
  const q = req.query || {};
  const handle = String(q.u || "").replace(/^@/, "");
  const poke = ROSTER[String(q.p || "")];
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle) || !poke) {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    return res.end();
  }
  const nums = String(q.c || "").split(",").map((x) => Math.max(0, Math.min(100, parseInt(x, 10) || 0)));
  const c = Object.keys(NAMES).map((_, i) => nums[i] ?? 50).join(",");
  const a = String(q.a || "");
  const params = new URLSearchParams({ u: handle, p: poke.n, c });
  if (/^[0-9]+\/[A-Za-z0-9_\-]+\.(jpg|jpeg|png)$/.test(a)) params.set("a", a);
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const origin = `https://${host}`;
  const img = `${origin}/api/og?${params.toString()}`;
  const title = `@${handle} is ${poke.n}. What's your Pokémon?`;
  const desc = "Type your X username and find your most scandalous tweet, your most viral tweet and your Pokémon. Built by @espressomart1n.";
  const dest = `/?u=${encodeURIComponent(handle)}`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(origin)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="twitter:creator" content="@espressomart1n">
</head><body>
<p>Opening What's your Pokémon? If nothing happens, <a href="${esc(dest)}">tap here</a>.</p>
<script>location.replace(${JSON.stringify(dest)});</script>
</body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
  res.status(200).send(html);
}
