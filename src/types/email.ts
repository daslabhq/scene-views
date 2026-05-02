/**
 * Email — canonical type for inbox/mailbox state.
 *
 * Vendor implementations declare `extends: ["email/mailbox"]`:
 *   Gmail, Outlook, ProtonMail, Fastmail, …
 *
 * The minimal contract: a list of messages with sender + subject + body
 * + unread state. Vendor extensions add labels, threads, attachments,
 * drafts, etc.
 */

import { defineAsset } from "../asset.js";
import { defineView, truncate } from "../view.js";
import { ListView } from "../views/primitives.js";

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

const InboxView = defineView<EmailMailboxState>({
  name: "EmailInbox",
  toHTML(s) {
    const unread = s.messages.filter(m => m.unread).length;
    return ListView.toHTML({
      title: `Inbox · ${s.messages.length} messages${unread ? ` · ${unread} unread` : ""}`,
      items: s.messages.slice(0, 20).map(m => ({
        title: m.subject || "(no subject)",
        subtitle: m.from,
        detail: truncate(m.body ?? "", 140),
        badge: m.unread ? "unread" : undefined,
      })),
      empty: "no messages",
    });
  },
  toMarkdown(s) {
    const unread = s.messages.filter(m => m.unread).length;
    return ListView.toMarkdown({
      title: `Inbox (${s.messages.length} messages, ${unread} unread)`,
      items: s.messages.slice(0, 20).map(m => ({
        title: m.subject || "(no subject)",
        subtitle: `from ${m.from}${m.unread ? " · unread" : ""}`,
      })),
    });
  },
});

export const Email = defineAsset<EmailMailboxState>({
  type: "email/mailbox",
  description: "Canonical mailbox — list of email messages.",
  schema: {
    type: "object",
    properties: {
      messages: { type: "array" },
    },
    required: ["messages"],
  },
  defaultView: InboxView,
  mockState: () => ({
    messages: [
      { id: "m1", from: "alice@vendor.com",   to: ["me@x.com"], subject: "Invoice — overdue",        body: "Past due, please confirm.",                       unread: true,  date: "2026-04-30T08:14:00Z" },
      { id: "m2", from: "ceo@company.com",    to: ["me@x.com"], subject: "Quick question",            body: "Got a sec?",                                       unread: true,  date: "2026-04-30T07:55:00Z" },
      { id: "m3", from: "alerts@stripe.com",  to: ["me@x.com"], subject: "Payout completed: $1,200",  body: "Your payout has been deposited.",                  unread: false, date: "2026-04-30T06:30:00Z" },
      { id: "m4", from: "newsletter@nyt.com", to: ["me@x.com"], subject: "Morning briefing",          body: "Top stories…",                                     unread: false, date: "2026-04-30T05:00:00Z" },
    ],
  }),
});
