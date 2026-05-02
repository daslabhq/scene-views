/**
 * Event — canonical type for calendar events.
 *
 * Vendor implementations: Google Calendar, Outlook Calendar, Apple Calendar,
 * Calendly, Zoom (scheduled meetings), …
 */

import { defineAsset } from "../asset.js";
import { CalendarView, type CalendarProps } from "../views/primitives.js";
import { defineView } from "../view.js";

export interface CalendarEventRecord {
  id:         string;
  title:      string;
  startsAt:   string;
  endsAt?:    string;
  location?:  string;
  attendees?: string[];
  allDay?:    boolean;
}

export interface CalendarEventsState {
  events: CalendarEventRecord[];
}

const UpcomingView = defineView<CalendarEventsState>({
  name: "UpcomingEvents",
  toHTML(s) {
    const props: CalendarProps = {
      title: "Upcoming",
      events: s.events.map(e => ({
        title: e.title, start: e.startsAt, end: e.endsAt,
        location: e.location, attendees: e.attendees, allDay: e.allDay,
      })),
    };
    return CalendarView.toHTML(props);
  },
  toMarkdown(s) {
    return CalendarView.toMarkdown({
      title: "Upcoming",
      events: s.events.map(e => ({
        title: e.title, start: e.startsAt, end: e.endsAt,
        location: e.location, attendees: e.attendees, allDay: e.allDay,
      })),
    });
  },
});

export const Event = defineAsset<CalendarEventsState>({
  type: "event/calendar",
  description: "Canonical calendar events — what's scheduled.",
  schema: {
    type: "object",
    properties: { events: { type: "array" } },
    required: ["events"],
  },
  defaultView: UpcomingView,
  mockState: () => ({
    events: [
      { id: "e1", title: "Daily standup",       startsAt: "2026-05-02T10:00:00", endsAt: "2026-05-02T10:15:00", attendees: ["alice@team", "bob@team"] },
      { id: "e2", title: "Sales review · Q2",   startsAt: "2026-05-02T13:00:00", endsAt: "2026-05-02T14:00:00", location: "Conf Room 3" },
      { id: "e3", title: "Customer call",       startsAt: "2026-05-02T15:30:00", endsAt: "2026-05-02T16:00:00", location: "Zoom" },
      { id: "e4", title: "Off-site",            startsAt: "2026-05-04",          allDay: true },
    ],
  }),
});
