/**
 * Message — canonical type for chat/messaging state.
 *
 * Vendor implementations: Slack, Teams, Discord, IRC, WhatsApp.
 * The minimal contract: messages grouped into channels.
 */

import { defineAsset } from "../asset.js";
import { defineView, truncate } from "../view.js";
import { ListView } from "../views/primitives.js";

export interface ChatMessage {
  id:        string;
  channel:   string;
  sender:    string;
  body:      string;
  timestamp?: string;
}

export interface MessageState {
  channels: Array<{ id: string; name: string }>;
  messages: ChatMessage[];
}

const ActivityView = defineView<MessageState>({
  name: "MessagingActivity",
  toHTML(s) {
    const byCh = new Map<string, ChatMessage[]>();
    for (const m of s.messages) byCh.set(m.channel, [...(byCh.get(m.channel) ?? []), m]);
    const items = [...byCh.entries()].map(([ch, msgs]) => {
      const last = msgs[msgs.length - 1];
      return {
        title: `#${ch}`,
        subtitle: `${msgs.length} message${msgs.length === 1 ? "" : "s"}`,
        detail: last ? `${last.sender}: ${truncate(last.body, 110)}` : "",
      };
    });
    return ListView.toHTML({ title: "Recent activity", items });
  },
  toMarkdown(s) {
    const byCh = new Map<string, ChatMessage[]>();
    for (const m of s.messages) byCh.set(m.channel, [...(byCh.get(m.channel) ?? []), m]);
    return [...byCh.entries()].map(([ch, msgs]) =>
      `**#${ch}** (${msgs.length} messages)\n` + msgs.slice(-3).map(m => `> ${m.sender}: ${truncate(m.body, 120)}`).join("\n")
    ).join("\n\n");
  },
});

export const Message = defineAsset<MessageState>({
  type: "message/channels",
  description: "Canonical messaging — channels + messages.",
  schema: {
    type: "object",
    properties: {
      channels: { type: "array" },
      messages: { type: "array" },
    },
    required: ["channels", "messages"],
  },
  defaultView: ActivityView,
  mockState: () => ({
    channels: [
      { id: "C-eng", name: "engineering" },
      { id: "C-mkt", name: "marketing"   },
    ],
    messages: [
      { id: "1", channel: "engineering", sender: "alice", body: "Deploy is green; canary at 5%." },
      { id: "2", channel: "engineering", sender: "bob",   body: "Looks good — bumping to 25%."   },
      { id: "3", channel: "marketing",   sender: "carol", body: "Paused c-retain. CPA was high." },
    ],
  }),
});
