import { useMemo, useState } from "react";
import { CalendarPlus, Plus } from "lucide-react";
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
  formatTime12,
  googleCalendarUrl,
  meetingDateInWeek,
  prettyDate,
  todayISO,
  WEEKDAYS_LONG,
  weekRange,
  type Meeting,
} from "@/lib/ledger";
import type { LedgerStore } from "./store";

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="paper p-5 sm:p-7">
      <h2 className="text-2xl text-foreground">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="label-mono mb-1 block text-muted-foreground">{children}</span>;
}

function GoogleLink({ meeting, date }: { meeting: Meeting; date: string }) {
  return (
    <a
      href={googleCalendarUrl({
        title: meeting.title,
        date,
        time: meeting.start_time,
        location: meeting.location,
        details: meeting.notes,
        recurringWeekly: meeting.is_recurring,
      })}
      target="_blank"
      rel="noreferrer"
      className="label-mono inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 underline decoration-gold underline-offset-4 transition-colors hover:border-ink/40"
    >
      <CalendarPlus className="size-4" /> Add to Google Calendar
    </a>
  );
}

export function MeetingsTab({ store }: { store: LedgerStore }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("One-time");
  const [date, setDate] = useState("");
  const [day, setDay] = useState<string>(WEEKDAYS_LONG[new Date().getDay()] as string);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const recurring = type === "Weekly (recurring)";

  const { start, end } = useMemo(() => weekRange(), []);
  const startISO = todayISO(start);
  const endISO = todayISO(end);

  const thisWeek = useMemo(() => {
    return store.meetings
      .map((m) => ({ m, date: meetingDateInWeek(m) }))
      .filter(
        (x): x is { m: Meeting; date: string } =>
          !!x.date && x.date >= startISO && x.date <= endISO,
      )
      .sort((a, b) =>
        a.date === b.date
          ? (a.m.start_time ?? "").localeCompare(b.m.start_time ?? "")
          : a.date.localeCompare(b.date),
      );
  }, [store.meetings, startISO, endISO]);

  const standing = store.meetings.filter((m) => m.is_recurring);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!recurring && !date) return;
    store.addMeeting({
      title: title.trim(),
      weekday: recurring
        ? Math.max(0, WEEKDAYS_LONG.indexOf(day as never))
        : new Date(`${date}T00:00:00`).getDay(),
      start_time: time || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
      meeting_date: recurring ? null : date,
      is_recurring: recurring,
    });
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <Card
        title="Add a meeting"
        subtitle="One-off meetings on a specific date, or standing meetings that repeat weekly on the same day. Both show up on the day they fall, in Daily Checklist, and both get a real Google Calendar link."
      >
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <label className="block">
            <Label>Meeting</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Management meeting"
              required
            />
          </label>

          <label className="block">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="One-time">One-time</SelectItem>
                <SelectItem value="Weekly (recurring)">Weekly (recurring)</SelectItem>
              </SelectContent>
            </Select>
          </label>

          {recurring ? (
            <label className="block">
              <Label>Day of week</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS_LONG.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ) : (
            <label className="block">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          )}

          <label className="block">
            <Label>Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>

          <label className="block sm:col-span-2">
            <Label>Location / Zoom link (optional)</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Vestry office, or a Zoom link"
            />
          </label>

          <label className="block sm:col-span-2">
            <Label>Notes / reminders (optional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to remember: agenda, who to call, what to bring"
            />
          </label>

          <div className="sm:col-span-2">
            <Button type="submit">
              <Plus className="size-4" /> Add meeting
            </Button>
          </div>
        </form>
      </Card>

      <Card
        title="This week"
        subtitle="Every meeting landing between this Monday and Sunday, in day order."
      >
        {thisWeek.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Nothing scheduled this week.</p>
        ) : (
          <ul className="space-y-4">
            {thisWeek.map(({ m, date: d }, i) => {
              const showHeader = i === 0 || thisWeek[i - 1]?.date !== d;
              return (
                <li key={m.id}>
                  {showHeader && (
                    <p className="label-mono mb-2 text-muted-foreground">{prettyDate(d)}</p>
                  )}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
                    <div className="min-w-[12rem] flex-1">
                      <p className="font-medium">{m.title}</p>
                      <p className="label-mono text-muted-foreground">
                        {m.is_recurring ? "Weekly" : "One-time"}
                        {m.location ? ` · ${m.location}` : ""}
                      </p>
                      {m.notes && <p className="mt-1 text-sm text-muted-foreground">{m.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {m.start_time && (
                        <span className="label-mono rounded-full bg-secondary px-3 py-1">
                          {formatTime12(m.start_time)}
                        </span>
                      )}
                      <GoogleLink meeting={m} date={d} />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => store.removeMeeting(m.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Standing weekly meetings" subtitle="Your recurring meetings, regardless of week.">
        {standing.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">No standing weekly meetings yet.</p>
        ) : (
          <ul className="space-y-3">
            {standing.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-3 last:border-b-0"
              >
                <div className="min-w-[12rem] flex-1">
                  <p className="font-medium">{m.title}</p>
                  <p className="label-mono text-muted-foreground">
                    Every {WEEKDAYS_LONG[m.weekday]}
                    {m.start_time ? ` · ${formatTime12(m.start_time)}` : ""}
                    {m.location ? ` · ${m.location}` : ""}
                  </p>
                  {m.notes && <p className="mt-1 text-sm text-muted-foreground">{m.notes}</p>}
                </div>
                <Button variant="destructive" size="sm" onClick={() => store.removeMeeting(m.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
