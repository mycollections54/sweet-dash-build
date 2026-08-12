export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const TABS = [
  { id: "checklist", label: "Daily Checklist" },
  { id: "duties", label: "Recurring Duties" },
  { id: "meetings", label: "Meetings" },
  { id: "events", label: "Events & Reminders" },
  { id: "ceremonies", label: "Wedding / Naming / Burial" },
  { id: "calendar", label: "Calendar Sync" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export const CADENCES = ["Daily", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Yearly"];
export const EVENT_CATEGORIES = ["Event", "Reminder", "Programme", "Anniversary", "Deadline"];
export const CEREMONY_KINDS = ["Wedding", "Naming", "Burial"];
export const CEREMONY_STATUSES = ["Enquiry", "Approved", "Scheduled", "Completed", "Cancelled"];

export const DEFAULT_CHECKLIST = [
  "Coordinate the running of the service",
  "Attend to guest entertainment, if any",
  "Coordinate Thursday service recording",
  "Get the Management meeting agenda ready",
  "Attend to any other official assignment as assigned",
  "Remind the Prayer Rain Minister of next duty",
  "Share Sunday Prayer Rain prayer points with the assigned minister",
  "Confirm next Sunday's theme and the ministers",
];

export type ChecklistItem = { id: string; weekday: number; label: string; position: number };
export type RecurringDuty = { id: string; title: string; cadence: string; notes: string | null };
export type Meeting = {
  id: string;
  title: string;
  weekday: number;
  start_time: string | null;
  location: string | null;
  notes: string | null;
  meeting_date: string | null;
  is_recurring: boolean;
};
export type LedgerEvent = {
  id: string;
  title: string;
  event_date: string;
  category: string;
  notes: string | null;
  remind: boolean;
};
export type Ceremony = {
  id: string;
  kind: string;
  name: string;
  ceremony_date: string | null;
  officiant: string | null;
  status: string;
  notes: string | null;
};

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function longDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function prettyDate(iso: string | null) {
  if (!iso) return "Date to be fixed";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function icsDate(iso: string) {
  return iso.replaceAll("-", "");
}

function esc(text: string) {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export function buildICS(
  events: { title: string; date: string; description?: string }[],
  name = "The Admin Ledger",
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Admin Ledger//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${esc(name)}`,
  ];
  events.forEach((e, i) => {
    const start = icsDate(e.date);
    const endDate = new Date(e.date);
    endDate.setDate(endDate.getDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:ledger-${i}-${start}@admin-ledger`,
      `DTSTAMP:${icsDate(todayISO())}T000000Z`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${icsDate(todayISO(endDate))}`,
      `SUMMARY:${esc(e.title)}`,
      e.description ? `DESCRIPTION:${esc(e.description)}` : "DESCRIPTION:",
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(content: string, filename = "admin-ledger.ics") {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
