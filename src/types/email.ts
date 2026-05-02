/**
 * Email — canonical type for inbox/mailbox state.
 *
 * Vendor implementations declare `extends: ["email/mailbox"]`:
 *   Gmail, Outlook, ProtonMail, Fastmail, …
 *
 * Each size returns a WidgetData JSON; the framework converts it to
 * HTML / Markdown / Text. Authors don't write parallel rendering code.
 */

import { defineAsset } from "../asset.js";
import { defineView, truncate } from "../view.js";
import { ICONS } from "../views/heroicons.js";
import type { WidgetData } from "../widgets.js";

export interface EmailMessage {
  id:         string;
  from:       string;
  to:         string[];
  subject:    string;
  body?:      string;
  date?:      string;
  unread?:    boolean;
}

export interface EmailMailboxState {
  messages: EmailMessage[];
}

const unreadCount = (s: EmailMailboxState) => s.messages.filter(m => m.unread).length;

const InboxView = defineView<EmailMailboxState>({
  name: "EmailInbox",
  sizes: {
    icon: (s): WidgetData => ({
      type: "icon",
      glyph: ICONS.envelope,
      color: "blue",
      label: "Email",
      badge: unreadCount(s) || undefined,
    }),

    small: (s): WidgetData => {
      const u = unreadCount(s);
      const top = s.messages.find(m => m.unread) ?? s.messages[0];
      return {
        type: "stack",
        header: { glyph: ICONS.envelope, color: "blue", title: "Inbox", meta: u ? `${u} unread` : undefined },
        body: top ? [{
          type: "list",
          items: [{
            title: truncate(top.subject || "(no subject)", 40),
            subtitle: top.from,
            badge: top.unread ? "unread" : undefined,
          }],
        }] : [{ type: "empty", message: "no messages" }],
      };
    },

    medium: (s): WidgetData => {
      const u = unreadCount(s);
      return {
        type: "stack",
        header: { glyph: ICONS.envelope, color: "blue", title: "Inbox", meta: `${s.messages.length} · ${u} unread` },
        body: [{
          type: "list",
          layout: "grid-2",
          items: s.messages.slice(0, 4).map(m => ({
            title: truncate(m.subject || "(no subject)", 32),
            subtitle: m.from,
            badge: m.unread ? "unread" : undefined,
          })),
        }],
      };
    },

    large: (s): WidgetData => {
      const u = unreadCount(s);
      return {
        type: "list",
        title: `Inbox · ${s.messages.length} messages${u ? ` · ${u} unread` : ""}`,
        items: s.messages.slice(0, 20).map(m => ({
          title: m.subject || "(no subject)",
          subtitle: m.from,
          detail: truncate(m.body ?? "", 140),
          badge: m.unread ? "unread" : undefined,
        })),
      };
    },
  },
});

export const Email = defineAsset<EmailMailboxState>({
  type: "email/mailbox",
  description: "Canonical mailbox — list of email messages.",
  schema: {
    type: "object",
    properties: { messages: { type: "array" } },
    required: ["messages"],
  },
  defaultView: InboxView,
  mockState: () => ({
    messages: [
      { id: "m1", from: "alice@vendor.com",   to: ["me@x.com"], subject: "Invoice — overdue",        body: "Past due, please confirm.",            unread: true,  date: "2026-04-30T08:14:00Z" },
      { id: "m2", from: "ceo@company.com",    to: ["me@x.com"], subject: "Quick question",            body: "Got a sec?",                            unread: true,  date: "2026-04-30T07:55:00Z" },
      { id: "m3", from: "alerts@stripe.com",  to: ["me@x.com"], subject: "Payout completed: $1,200",  body: "Your payout has been deposited.",       unread: false, date: "2026-04-30T06:30:00Z" },
      { id: "m4", from: "newsletter@nyt.com", to: ["me@x.com"], subject: "Morning briefing",          body: "Top stories…",                          unread: false, date: "2026-04-30T05:00:00Z" },
    ],
  }),
});
