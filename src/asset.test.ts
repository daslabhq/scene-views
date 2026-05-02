/**
 * Sanity tests — every asset's defaultView renders mock state cleanly
 * to all three formats with no thrown errors.
 */

import { test, expect, describe } from "bun:test";
import { assets, defineView, defineAsset } from "./index.js";

describe("built-in assets", () => {
  for (const [name, asset] of Object.entries(assets)) {
    test(`${name}.defaultView renders mock state`, () => {
      const state = asset.mockState!();
      const html = asset.defaultView.toHTML(state);
      const md   = asset.defaultView.toMarkdown(state);
      const txt  = asset.defaultView.toText!(state);
      expect(html.length).toBeGreaterThan(0);
      expect(md.length).toBeGreaterThan(0);
      expect(txt.length).toBeGreaterThan(0);
      // HTML should be tag-shaped
      expect(html).toMatch(/<\w+/);
      // Markdown shouldn't contain raw HTML
      expect(md).not.toMatch(/<\w+ /);
    });
  }
});

describe("defineView", () => {
  test("toText falls back to stripping HTML when omitted", () => {
    const v = defineView<{ x: number }>({
      name: "T",
      toHTML: (s) => `<div>x=<b>${s.x}</b></div>`,
      toMarkdown: (s) => `x=${s.x}`,
    });
    expect(v.toText!({ x: 7 })).toBe("x=7");
  });
});

describe("defineAsset", () => {
  test("propagates secretFields", () => {
    const a = defineAsset({
      type: "test/x",
      schema: { type: "object" },
      secretFields: ["token"],
      defaultView: defineView<{ y: number }>({
        name: "T", toHTML: () => "ok", toMarkdown: () => "ok",
      }),
    });
    expect(a.secretFields).toEqual(["token"]);
  });

  test("applies sensible defaults", () => {
    const a = defineAsset({
      type: "test/y",
      schema: { type: "object" },
      defaultView: defineView<{ y: number }>({
        name: "T", toHTML: () => "ok", toMarkdown: () => "ok",
      }),
    });
    expect(a.secretFields).toEqual([]);
    expect(a.views).toEqual({});
  });
});
