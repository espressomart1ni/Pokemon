import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import { NAMES, COL } from "./roster.js";

const W = 1200, H = 630;
let fonts = null;
function loadFonts() {
  if (!fonts) {
    const f = (w) => fs.readFileSync(new URL(`../fonts/bricolage-grotesque-latin-${w}-normal.woff`, import.meta.url));
    fonts = [400, 600, 800].map((w) => ({ name: "Bricolage", data: f(w), weight: w, style: "normal" }));
  }
  return fonts;
}

export async function toDataUri(url, ms = 4000) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms) });
    if (!r.ok) return null;
    const ct = (r.headers.get("content-type") || "image/png").split(";")[0];
    if (!/^image\/(png|jpe?g|gif)$/.test(ct)) return null;
    const b = Buffer.from(await r.arrayBuffer());
    return `data:${ct};base64,${b.toString("base64")}`;
  } catch {
    return null;
  }
}

const h = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } });

export async function renderCard({ handle, poke, pct, avatar, art }) {
  const keys = Object.keys(NAMES).sort((a, b) => pct[b] - pct[a]).slice(0, 3);
  const circle = { display: "flex", width: 200, height: 200, borderRadius: 100, border: "7px solid #ffffff", overflow: "hidden" };

  const avatarEl = avatar
    ? h("img", { width: 200, height: 200, borderRadius: 100, border: "7px solid #ffffff" }, undefined, { src: avatar, width: 200, height: 200 })
    : h("div", { ...circle, background: "#FFD23F", alignItems: "center", justifyContent: "center", fontSize: 110, fontWeight: 800, color: "#1B1340" }, handle.charAt(0).toUpperCase());

  const artEl = h("div", { ...circle, background: poke.c, alignItems: "center", justifyContent: "center" },
    art ? [h("img", {}, undefined, { src: art, width: 200, height: 200 })] : poke.n.charAt(0));

  const bar = (k) =>
    h("div", { display: "flex", flexDirection: "column", width: 300, marginRight: 40 }, [
      h("div", { display: "flex", fontSize: 26, fontWeight: 600, color: "#ffffff", marginBottom: 8 }, `${NAMES[k]} ${pct[k]}`),
      h("div", { display: "flex", width: 300, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.18)" }, [
        h("div", { display: "flex", width: Math.max(16, Math.round(3 * pct[k])), height: 16, borderRadius: 8, background: COL[k] }, []),
      ]),
    ]);

  const tree = h("div", {
    display: "flex", position: "relative", width: W, height: H, fontFamily: "Bricolage",
    background: `linear-gradient(135deg, #1B1340, ${poke.c})`,
  }, [
    h("div", { display: "flex", flexDirection: "column", position: "absolute", left: 36, top: 36, width: 1128, height: 558, boxSizing: "border-box", borderRadius: 34, background: "rgba(20,15,46,0.84)", padding: "40px 54px 30px 54px" }, [
      h("div", { display: "flex", alignItems: "flex-start" }, [
        h("div", { display: "flex", flexDirection: "column", alignItems: "center", width: 220 }, [
          avatarEl,
          h("div", { display: "flex", fontSize: 30, fontWeight: 600, color: "#ffffff", marginTop: 14 }, `@${handle}`),
        ]),
        h("div", { display: "flex", fontSize: 64, fontWeight: 800, color: "#FFD23F", margin: "62px 34px 0 34px" }, "="),
        artEl,
        h("div", { display: "flex", flexDirection: "column", marginLeft: 44, marginTop: 34, flex: 1 }, [
          h("div", { display: "flex", fontSize: poke.n.length > 10 ? 58 : 70, fontWeight: 800, color: "#ffffff" }, poke.n),
          h("div", { display: "flex", fontSize: 32, fontWeight: 600, color: poke.c, marginTop: 6 }, poke.t.join(" / ")),
        ]),
      ]),
      h("div", { display: "flex", marginTop: 56 }, keys.map(bar)),
      h("div", { display: "flex", flex: 1 }, []),
      h("div", { display: "flex", justifyContent: "space-between", fontSize: 34, fontWeight: 800 }, [
        h("div", { display: "flex", color: "#ffffff" }, "What's your Pokémon?"),
        h("div", { display: "flex", color: "#FFD23F" }, "@espressomart1n"),
      ]),
    ]),
  ]);

  const svg = await satori(tree, { width: W, height: H, fonts: loadFonts() });
  return new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
}
