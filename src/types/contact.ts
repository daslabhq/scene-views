/**
 * Contact — canonical type for people / contact records.
 *
 * Vendor implementations: Salesforce, HubSpot, Airtable, Pipedrive,
 * Notion, Google Contacts, …
 */

import { defineAsset } from "../asset.js";
import { defineView } from "../view.js";
import { TableView } from "../views/primitives.js";

export interface ContactRecord {
  id:        string;
  firstName: string;
  lastName:  string;
  email?:    string;
  phone?:    string;
  title?:    string;
  company?:  string;
}

export interface ContactsState {
  contacts: ContactRecord[];
}

const ContactListView = defineView<ContactsState>({
  name: "ContactList",
  toHTML(s) {
    return TableView.toHTML({
      title: `${s.contacts.length} contacts`,
      columns: ["Name", "Email", "Phone", "Title", "Company"],
      rows: s.contacts.map(c => ({
        Name:    `${c.firstName} ${c.lastName}`,
        Email:   c.email ?? "",
        Phone:   c.phone ?? "",
        Title:   c.title ?? "",
        Company: c.company ?? "",
      })),
    });
  },
  toMarkdown(s) {
    return TableView.toMarkdown({
      title: "Contacts",
      rows: s.contacts.map(c => ({
        Name:  `${c.firstName} ${c.lastName}`,
        Email: c.email ?? "",
        Title: c.title ?? "",
      })),
    });
  },
});

export const Contact = defineAsset<ContactsState>({
  type: "contact/list",
  description: "Canonical contact list — people with email, phone, role.",
  schema: {
    type: "object",
    properties: { contacts: { type: "array" } },
    required: ["contacts"],
  },
  defaultView: ContactListView,
  mockState: () => ({
    contacts: [
      { id: "c1", firstName: "Jordan", lastName: "Lee",    email: "jordan@acme.com",       phone: "+1-555-0101", title: "Director of Ops", company: "Acme" },
      { id: "c2", firstName: "Maria",  lastName: "Santos", email: "maria@brightwave.com",  phone: "+1-555-0182", title: "VP Marketing",    company: "Brightwave" },
      { id: "c3", firstName: "Aiden",  lastName: "Park",   email: "aiden@meridian.com",    phone: "+1-555-0301", title: "CEO",             company: "Meridian" },
    ],
  }),
});
