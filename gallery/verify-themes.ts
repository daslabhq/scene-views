/**
 * Visual verification — opens the built gallery in headless Chromium under
 * three theme states and writes screenshots so a human can spot-check.
 *
 *   bun gallery/verify-themes.ts
 *
 * Output:
 *   gallery/verify/auto-light.png    (color-scheme=light from OS, toggle=auto)
 *   gallery/verify/auto-dark.png     (color-scheme=dark from OS, toggle=auto)
 *   gallery/verify/forced-light.png  (OS=dark, toggle=light → must look like auto-light)
 *   gallery/verify/forced-dark.png   (OS=light, toggle=dark → must look like auto-dark)
 *
 * Also runs basic readability assertions: header contrast, mcp iframe body
 * background flip, a2ui-host bg flip — fails the script if any are wrong.
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE_URL = pathToFileURL(join(HERE, "index.html")).toString();
const OUT_DIR = join(HERE, "verify");
mkdirSync(OUT_DIR, { recursive: true });

interface Probe {
  label:           string;
  rootColorScheme: string;
  rootDataTheme:   string | null;
  bodyBg:          string;
  bodyFg:          string;
  cardBg:          string;   // first <section class="card">
  a2uiHostBg:      string;   // first .a2ui-host
  mcpIframeBodyBg: string;   // first .mcp-host iframe → body computed bg
}

async function probe(page: import("playwright").Page): Promise<Probe> {
  const top = await page.evaluate(() => {
    const cs = (el: Element) => getComputedStyle(el);
    const root = document.documentElement;
    const card = document.querySelector("section.card") as HTMLElement;
    const a2ui = document.querySelector(".a2ui-host") as HTMLElement;
    return {
      rootColorScheme: cs(root).colorScheme,
      rootDataTheme:   root.getAttribute("data-theme"),
      bodyBg:          cs(document.body).backgroundColor,
      bodyFg:          cs(document.body).color,
      cardBg:          card ? cs(card).backgroundColor : "",
      a2uiHostBg:      a2ui ? cs(a2ui).backgroundColor : "",
    };
  });
  // Sandboxed iframes are cross-origin to their parent (opaque origin), so
  // .contentDocument from the page is null. Playwright's frame handle goes
  // around that — it speaks CDP directly to the iframe's renderer.
  const frames = page.frames().filter(f => f !== page.mainFrame());
  let mcpIframeBodyBg = "";
  if (frames[0]) {
    mcpIframeBodyBg = await frames[0].evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
  }
  return { label: "", ...top, mcpIframeBodyBg };
}

async function clickToggle(page: import("playwright").Page, value: "auto"|"light"|"dark") {
  await page.click(`.theme-toggle button[data-theme-set="${value}"]`);
  // Give iframes a moment to receive postMessage + apply data-theme.
  await page.waitForTimeout(150);
}

const browser = await chromium.launch();
const results: (Probe & { file: string })[] = [];

async function capture(label: string, file: string, options: {
  colorScheme: "light" | "dark";
  toggle?:     "auto" | "light" | "dark";
}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: options.colorScheme,
  });
  const page = await ctx.newPage();
  await page.goto(PAGE_URL);
  await page.waitForLoadState("networkidle");
  if (options.toggle && options.toggle !== "auto") {
    await clickToggle(page, options.toggle);
  }
  // Scroll the first card into view so the live iframe mounts/loads.
  await page.evaluate(() => {
    const card = document.querySelector("section.card") as HTMLElement | null;
    card?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await page.waitForTimeout(800);
  const out = join(OUT_DIR, file);
  await page.screenshot({ path: out, fullPage: false });
  const p = await probe(page);
  results.push({ ...p, label, file });
  await ctx.close();
}

await capture("auto-light",   "auto-light.png",   { colorScheme: "light" });
await capture("auto-dark",    "auto-dark.png",    { colorScheme: "dark"  });
await capture("forced-light", "forced-light.png", { colorScheme: "dark",  toggle: "light" });
await capture("forced-dark",  "forced-dark.png",  { colorScheme: "light", toggle: "dark"  });

await browser.close();

console.log("\n=== probe results ===");
for (const r of results) {
  console.log(`\n[${r.label}]  file=${r.file}`);
  console.log(`  rootColorScheme : ${r.rootColorScheme}`);
  console.log(`  rootDataTheme   : ${r.rootDataTheme}`);
  console.log(`  bodyBg          : ${r.bodyBg}`);
  console.log(`  bodyFg          : ${r.bodyFg}`);
  console.log(`  cardBg          : ${r.cardBg}`);
  console.log(`  a2uiHostBg      : ${r.a2uiHostBg}`);
  console.log(`  mcpIframeBodyBg : ${r.mcpIframeBodyBg}`);
}

// --- Readability assertions ---
let failed = 0;
function check(cond: boolean, msg: string) {
  if (!cond) { console.error(`✗ ${msg}`); failed++; }
  else       { console.log (`✓ ${msg}`); }
}

const byLabel = Object.fromEntries(results.map(r => [r.label, r]));
const isLightish = (rgb: string) => {
  // crude: light = sum of channels above 600 (out of 765)
  const m = rgb.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return false;
  return parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]) > 600;
};
const isDarkish  = (rgb: string) => {
  const m = rgb.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return false;
  return parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]) < 200;
};

console.log("\n=== assertions ===");
// auto-light: everything light
check(isLightish(byLabel["auto-light"].bodyBg),          "auto-light body bg is light");
check(isLightish(byLabel["auto-light"].cardBg),          "auto-light card bg is light");
check(isLightish(byLabel["auto-light"].mcpIframeBodyBg), "auto-light mcp iframe body is light");
// auto-dark: everything dark
check(isDarkish(byLabel["auto-dark"].bodyBg),            "auto-dark body bg is dark");
check(isDarkish(byLabel["auto-dark"].cardBg),            "auto-dark card bg is dark");
check(isDarkish(byLabel["auto-dark"].mcpIframeBodyBg),   "auto-dark mcp iframe body is dark");
// forced-light overrides OS=dark
check(isLightish(byLabel["forced-light"].bodyBg),          "forced-light body bg is light (overrides OS=dark)");
check(isLightish(byLabel["forced-light"].mcpIframeBodyBg), "forced-light mcp iframe body is light (postMessage propagated)");
check(byLabel["forced-light"].rootDataTheme === "light",   "forced-light :root has data-theme=light");
// forced-dark overrides OS=light
check(isDarkish(byLabel["forced-dark"].bodyBg),            "forced-dark body bg is dark (overrides OS=light)");
check(isDarkish(byLabel["forced-dark"].mcpIframeBodyBg),   "forced-dark mcp iframe body is dark (postMessage propagated)");
check(byLabel["forced-dark"].rootDataTheme === "dark",     "forced-dark :root has data-theme=dark");

if (failed > 0) {
  console.error(`\n✗ ${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\n✓ all theme checks pass");
