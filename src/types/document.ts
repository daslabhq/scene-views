/**
 * Document — canonical type for prose/text documents.
 *
 * Vendor implementations: Notion pages, Google Docs, Confluence, Coda,
 * Word docs, Markdown notes.
 */

import { defineAsset } from "../asset.js";
import { defineView } from "../view.js";
import { DocumentView } from "../views/primitives.js";

export interface DocumentRecord {
  id:         string;
  title:      string;
  body:       string;
  byline?:    string;
  modifiedAt?: string;
  tags?:      string[];
}

export interface DocumentState {
  documents: DocumentRecord[];
}

const FeaturedDocumentView = defineView<DocumentState>({
  name: "FeaturedDocument",
  toHTML(s) {
    if (s.documents.length === 0) return `<div class="ws-empty">no documents</div>`;
    const sorted = [...s.documents].sort((a, b) =>
      (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? "")
    );
    const featured = sorted[0]!;
    return DocumentView.toHTML({
      title: featured.title,
      body:  featured.body,
      byline: featured.byline,
      meta:   featured.modifiedAt ? `modified ${featured.modifiedAt}` : "",
    });
  },
  toMarkdown(s) {
    return s.documents.slice(0, 5).map(d =>
      `### ${d.title}${d.modifiedAt ? ` _(${d.modifiedAt})_` : ""}\n\n${d.body.slice(0, 200)}…`
    ).join("\n\n");
  },
});

export const Document = defineAsset<DocumentState>({
  type: "document/collection",
  description: "Canonical document collection — pages with title + body.",
  schema: {
    type: "object",
    properties: { documents: { type: "array" } },
    required: ["documents"],
  },
  defaultView: FeaturedDocumentView,
  mockState: () => ({
    documents: [
      { id: "d1", title: "Q2 launch plan", body: "Overview\n\nWe're shipping the new agent runtime in three phases. Phase 1 (May 6) covers the core SDK; phase 2 (May 20) adds the visual scrubber; phase 3 (June 3) brings the AutomationBench integration to production with belief-vs-truth scoring.", byline: "ops team", modifiedAt: "2026-04-30", tags: ["plan"] },
      { id: "d2", title: "On-call runbook", body: "Step 1: check the on-call dashboard. Step 2: …", modifiedAt: "2026-04-29", tags: ["ops"] },
      { id: "d3", title: "Customer feedback · April", body: "Top themes from this month's calls…", modifiedAt: "2026-04-28", tags: ["research"] },
    ],
  }),
});
