import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  CEREMONY_KINDS,
  CEREMONY_STATUSES,
  formatTime12,
  prettyDate,
} from "@/lib/ledger";
import type { LedgerStore } from "./store";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="label-mono mb-1 block text-muted-foreground">{children}</span>;
}

export function LifeEventsTab({ store }: { store: LedgerStore }) {
  const [kind, setKind] = useState("Wedding");
  const [customKind, setCustomKind] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [officiant, setOfficiant] = useState("");
  const [status, setStatus] = useState("Enquiry");
  const [notes, setNotes] = useState("");

  const isOther = kind === "Other";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    store.addCeremony({
      kind: (isOther ? customKind.trim() : kind) || "Other",
      name: name.trim(),
      ceremony_date: date || null,
      ceremony_time: time || null,
      officiant: officiant.trim() || null,
      status,
      notes: notes.trim() || null,
    });
    setName("");
    setDate("");
    setTime("");
    setOfficiant("");
    setNotes("");
    setCustomKind("");
  }

  return (
    <section className="paper p-5 sm:p-7">
      <h2 className="text-2xl text-foreground">Life Events</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Weddings, naming ceremonies, burials, thanksgiving services and anything else — with their
        date, time and progress.
      </p>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="block">
          <Label>Type of event</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CEREMONY_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k === "Other" ? "Other (type it in)" : k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {isOther ? (
          <label className="block">
            <Label>Name of event</Label>
            <Input
              value={customKind}
              onChange={(e) => setCustomKind(e.target.value)}
              placeholder="e.g. House dedication"
              required
            />
          </label>
        ) : (
          <label className="block">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CEREMONY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}

        <label className="block">
          <Label>Family / couple name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label className="block">
          <Label>Officiating minister</Label>
          <Input value={officiant} onChange={(e) => setOfficiant(e.target.value)} />
        </label>

        <label className="block">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="block">
          <Label>Time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>

        {isOther && (
          <label className="block">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CEREMONY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}

        <label className="block sm:col-span-2">
          <Label>Notes (optional)</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <div className="sm:col-span-2">
          <Button type="submit">
            <Plus className="size-4" /> Add record
          </Button>
        </div>
      </form>

      <div className="mt-6">
        {store.ceremonies.length === 0 && (
          <p className="text-sm italic text-muted-foreground">No life events recorded.</p>
        )}
        {store.ceremonies.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-start gap-3 border-b border-border/70 py-3 last:border-b-0"
          >
            <div className="min-w-[12rem] flex-1">
              <p className="font-medium">
                {c.kind} — {c.name}
              </p>
              <p className="label-mono text-muted-foreground">
                {prettyDate(c.ceremony_date)}
                {c.ceremony_time ? ` · ${formatTime12(c.ceremony_time)}` : ""}
                {c.officiant ? ` · ${c.officiant}` : ""}
              </p>
              {c.notes && <p className="text-sm text-muted-foreground">{c.notes}</p>}
            </div>
            <span className="label-mono rounded-full border border-border px-3 py-1 text-muted-foreground">
              {c.status}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete record"
              onClick={() => store.removeCeremony(c.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
