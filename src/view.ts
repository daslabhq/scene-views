/**
 * View — render asset state in multiple media (HTML / Markdown / Text).
 *
 * Same definition produces:
 *   - HTML        for human-visual rendering (dashboards, scrubbers, iOS webview)
 *   - Markdown    for LLM-context injection (token-efficient, comprehension-cheap)
 *   - Text        for terminal output and text-only models
 *
 * The view is the agent's view of the asset state too — not just the human's.
 * A 1500-byte Gmail JSON dump → 80 tokens of structured Markdown summary.
 */

export type JSONSchema = Record<string, unknown>;

export interface ViewDef<TState = unknown> {
  /** Stable view name, e.g. "GmailInbox". */
  name: string;
  /** Optional human-readable description (helps LLM tool specs / UIs). */
  description?: string;
  /** Optional JSON Schema for the input state. Used for validation/typing. */
  schema?: JSONSchema;
  /** Render to HTML — for browsers, scrubbers, dashboards. */
  toHTML(state: TState): string;
  /** Render to Markdown — for LLM context injection. */
  toMarkdown(state: TState): string;
  /** Render to plain text — for terminals + text-only models. */
  toText?(state: TState): string;
}

/**
 * Build a view from any subset of formatters; falls back to a JSON dump
 * for any format the author didn't define.
 */
export function defineView<TState = unknown>(
  config: Partial<ViewDef<TState>> & { name: string; toHTML: (s: TState) => string; toMarkdown: (s: TState) => string },
): ViewDef<TState> {
  return {
    name:       config.name,
    description: config.description,
    schema:     config.schema,
    toHTML:     config.toHTML,
    toMarkdown: config.toMarkdown,
    toText:     config.toText ?? ((state) => stripTags(config.toHTML(state))),
  };
}

// ---------------------------------------------------------------------------
// Helpers reused by built-in views
// ---------------------------------------------------------------------------

export function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c] as string);
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
