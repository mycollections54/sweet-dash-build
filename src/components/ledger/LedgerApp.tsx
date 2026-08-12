import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Check, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildICS,
  CADENCES,
  CEREMONY_KINDS,
  CEREMONY_STATUSES,
  downloadICS,
  EVENT_CATEGORIES,
  longDate,
  prettyDate,
  TABS,
  todayISO,
  WEEKDAYS,
  WEEKDAYS_LONG,
  type TabId,
} from "@/lib/ledger";
import { dateForWeekday, type LedgerStore } from "./store";

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="paper p-5 sm:p-7">
      <h2 className="text-2xl text-foreground">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-2 border-b border-border/70 py-3 last:border-b-0">
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

export function LedgerApp({
  store,
  weekday,
  onWeekdayChange,
  headerRight,
  banner,
}: {
  store: LedgerStore;
  weekday: number;
  onWeekdayChange: (w: number) => void;
  headerRight?: ReactNode;
  banner?: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("checklist");
  const [editing, setEditing] = useState(false);
  const [newTask, setNewTask] = useState("");

  const doneCount = store.items.filter((i) => store.doneItemIds.has(i.id)).length;
  const dayMeetings = store.meetings.filter((m) => m.weekday === weekday);

  const calendarEvents = useMemo(
    () => [
      ...store.events.map((e) => ({
        title: `${e.category}: ${e.title}`,
        date: e.event_date,
        description: e.notes ?? "",
      })),
      ...store.ceremonies
        .filter((c) => c.ceremony_date)
        .map((c) => ({
          title: `${c.kind}: ${c.name}`,
          date: c.ceremony_date as string,
          description: [c.officiant, c.status, c.notes].filter(Boolean).join(" — "),
        })),
    ],
    [store.events, store.ceremonies],
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-6 sm:px-6">
      {banner}

      <header className="relative overflow-hidden rounded-xl bg-ink px-6 py-8 text-ink-foreground sm:px-9 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, var(--gold) 0, transparent 45%), radial-gradient(circle at 85% 90%, var(--gold) 0, transparent 40%)",
          }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="label-mono text-gold">RCC &nbsp;/&nbsp; Church Administration</p>
            <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">The Admin Ledger</h1>
            <p className="label-mono mt-2 text-ink-foreground/70">{longDate()}</p>
            <p className="label-mono mt-4 inline-block rounded-full border border-gold/40 px-4 py-2 text-gold">
              {doneCount} of {store.items.length} of today's tasks checked off
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="hidden rounded-md border border-gold/40 px-3 py-2 text-center sm:block">
              <p className="label-mono text-gold">{WEEKDAYS[new Date().getDay()]}</p>
              <p className="font-display text-2xl">{new Date().getDate()}</p>
            </div>
            {headerRight}
          </div>
        </div>
      </header>

      <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`label-mono -mb-[1px] border-b-2 px-1 pb-3 pt-2 transition-colors ${
              tab === t.id
                ? "border-gold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6 space-y-6">
        {tab === "checklist" && (
          <Panel title="Checklist by day" subtitle="Tap a day to view or check off its tasks.">
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => onWeekdayChange(i)}
                  className={`label-mono rounded-md border px-4 py-2 transition-colors ${
                    weekday === i
                      ? "border-ink bg-ink text-ink-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-ink/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                {editing ? "Done editing" : "Edit this day's tasks"}
              </Button>
              <span className="label-mono text-muted-foreground">
                {WEEKDAYS_LONG[weekday]} · {prettyDate(todayISO(dateForWeekday(weekday)))}
              </span>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-secondary/60 p-4">
              <p className="label-mono text-muted-foreground">
                Meetings — {WEEKDAYS_LONG[weekday]}
              </p>
              {dayMeetings.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">Nothing scheduled</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {dayMeetings.map((m) => (
                    <li key={m.id} className="text-sm">
                      <span className="font-medium">{m.title}</span>
                      {m.start_time ? ` · ${m.start_time}` : ""}
                      {m.location ? ` · ${m.location}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {editing && (
              <form
                className="mt-5 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTask.trim()) return;
                  store.addItem(weekday, newTask.trim());
                  setNewTask("");
                }}
              >
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder={`Add a task for ${WEEKDAYS_LONG[weekday]}`}
                />
                <Button type="submit">
                  <Plus className="size-4" /> Add
                </Button>
              </form>
            )}

            <ul className="mt-4">
              {store.items.length === 0 && <Empty text="No tasks for this day yet." />}
              {store.items.map((item) => {
                const checked = store.doneItemIds.has(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b border-border/70 py-3 last:border-b-0"
                  >
                    <button
                      aria-label={checked ? "Mark as not done" : "Mark as done"}
                      onClick={() => store.toggleItem(item.id)}
                      className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        checked ? "border-ink bg-ink text-ink-foreground" : "border-input bg-card"
                      }`}
                    >
                      {checked && <Check className="size-3.5" />}
                    </button>
                    <span
                      className={`flex-1 text-[0.95rem] ${
                        checked ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                    {editing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete task"
                        onClick={() => store.removeItem(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}

        {tab === "duties" && (
          <Panel title="Recurring duties" subtitle="Standing responsibilities and how often they fall due.">
            <AddForm
              fields={[
                { name: "title", placeholder: "Duty", required: true },
                { name: "cadence", type: "select", options: CADENCES },
                { name: "notes", placeholder: "Notes (optional)", type: "textarea" },
              ]}
              onSubmit={(v) =>
                store.addDuty({
                  title: v['title'] as string,
                  cadence: (v['cadence'] as string) || "Weekly",
                  notes: (v['notes'] as string) || null,
                })
              }
            />
            <div className="mt-5">
              {store.duties.length === 0 && <Empty text="No recurring duties recorded." />}
              {store.duties.map((d) => (
                <Row key={d.id}>
                  <div className="flex-1">
                    <p className="font-medium">{d.title}</p>
                    {d.notes && <p className="text-sm text-muted-foreground">{d.notes}</p>}
                  </div>
                  <span className="label-mono rounded-full border border-border px-3 py-1 text-muted-foreground">
                    {d.cadence}
                  </span>
                  <Button variant="ghost" size="icon" aria-label="Delete duty" onClick={() => store.removeDuty(d.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </Row>
              ))}
            </div>
          </Panel>
        )}

        {tab === "meetings" && <MeetingsTab store={store} />}

        {tab === "events" && (
          <Panel title="Events & reminders" subtitle="One-off programmes, deadlines and things not to forget.">
            <AddForm
              fields={[
                { name: "title", placeholder: "Title", required: true },
                { name: "event_date", type: "date", required: true },
                { name: "category", type: "select", options: EVENT_CATEGORIES },
                { name: "notes", placeholder: "Notes (optional)", type: "textarea" },
              ]}
              onSubmit={(v) =>
                store.addEvent({
                  title: v['title'] as string,
                  event_date: (v['event_date'] as string) || todayISO(),
                  category: (v['category'] as string) || "Event",
                  notes: (v['notes'] as string) || null,
                  remind: true,
                })
              }
            />
            <div className="mt-5">
              {store.events.length === 0 && <Empty text="Nothing on the calendar yet." />}
              {store.events.map((e) => (
                <Row key={e.id}>
                  <div className="flex-1">
                    <p className="font-medium">{e.title}</p>
                    <p className="label-mono text-muted-foreground">
                      {prettyDate(e.event_date)} · {e.category}
                    </p>
                    {e.notes && <p className="text-sm text-muted-foreground">{e.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Delete event" onClick={() => store.removeEvent(e.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </Row>
              ))}
            </div>
          </Panel>
        )}

        {tab === "ceremonies" && (
          <Panel title="Wedding / Naming / Burial" subtitle="Ceremony requests and their progress.">
            <AddForm
              fields={[
                { name: "kind", type: "select", options: CEREMONY_KINDS },
                { name: "name", placeholder: "Family / couple name", required: true },
                { name: "ceremony_date", type: "date" },
                { name: "officiant", placeholder: "Officiating minister" },
                { name: "status", type: "select", options: CEREMONY_STATUSES },
                { name: "notes", placeholder: "Notes (optional)", type: "textarea" },
              ]}
              onSubmit={(v) =>
                store.addCeremony({
                  kind: (v['kind'] as string) || "Wedding",
                  name: v['name'] as string,
                  ceremony_date: (v['ceremony_date'] as string) || null,
                  officiant: (v['officiant'] as string) || null,
                  status: (v['status'] as string) || "Enquiry",
                  notes: (v['notes'] as string) || null,
                })
              }
            />
            <div className="mt-5">
              {store.ceremonies.length === 0 && <Empty text="No ceremonies recorded." />}
              {store.ceremonies.map((c) => (
                <Row key={c.id}>
                  <div className="flex-1">
                    <p className="font-medium">
                      {c.kind} — {c.name}
                    </p>
                    <p className="label-mono text-muted-foreground">
                      {prettyDate(c.ceremony_date)}
                      {c.officiant ? ` · ${c.officiant}` : ""}
                    </p>
                    {c.notes && <p className="text-sm text-muted-foreground">{c.notes}</p>}
                  </div>
                  <span className="label-mono rounded-full border border-border px-3 py-1 text-muted-foreground">
                    {c.status}
                  </span>
                  <Button variant="ghost" size="icon" aria-label="Delete record" onClick={() => store.removeCeremony(c.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </Row>
              ))}
            </div>
          </Panel>
        )}

        {tab === "calendar" && (
          <Panel
            title="Calendar sync"
            subtitle="Download your events and ceremonies as a calendar file, then import it into Google Calendar, Outlook or Apple Calendar."
          >
            <div className="rounded-lg border border-border bg-secondary/60 p-5">
              <p className="label-mono text-muted-foreground">Ready to export</p>
              <p className="mt-2 font-display text-3xl">{calendarEvents.length}</p>
              <p className="text-sm text-muted-foreground">dated entries across events and ceremonies</p>
              <Button
                className="mt-4"
                disabled={calendarEvents.length === 0}
                onClick={() => downloadICS(buildICS(calendarEvents))}
              >
                <Download className="size-4" /> Download .ics file
              </Button>
            </div>
            <ol className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0" /> Google Calendar: Settings →
                Import &amp; export → Import the downloaded file.
              </li>
              <li className="flex gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0" /> Apple Calendar: File → Import →
                choose the file.
              </li>
              <li className="flex gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0" /> Outlook: File → Open &amp;
                Export → Import an iCalendar (.ics) file.
              </li>
            </ol>
          </Panel>
        )}
      </div>
    </div>
  );
}

type Field = {
  name: string;
  placeholder?: string;
  type?: "text" | "date" | "textarea" | "select";
  options?: string[];
  required?: boolean;
};

function AddForm({
  fields,
  onSubmit,
}: {
  fields: Field[];
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <form
      className="grid gap-3 rounded-lg border border-dashed border-border p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const missing = fields.some((f) => f.required && !values[f.name]?.trim());
        if (missing) return;
        onSubmit(values);
        setValues({});
      }}
    >
      {fields.map((f) => {
        const value = values[f.name] ?? "";
        if (f.type === "select") {
          return (
            <Select key={f.name} value={value} onValueChange={(v) => set(f.name, v)}>
              <SelectTrigger>
                <SelectValue placeholder={f.options?.[0]} />
              </SelectTrigger>
              <SelectContent>
                {f.options?.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        if (f.type === "textarea") {
          return (
            <Textarea
              key={f.name}
              className="sm:col-span-2"
              rows={2}
              placeholder={f.placeholder}
              value={value}
              onChange={(e) => set(f.name, e.target.value)}
            />
          );
        }
        return (
          <Input
            key={f.name}
            type={f.type === "date" ? "date" : "text"}
            placeholder={f.placeholder}
            value={value}
            onChange={(e) => set(f.name, e.target.value)}
          />
        );
      })}
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </form>
  );
}
