import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CHECKLIST,
  type Ceremony,
  type ChecklistItem,
  type LedgerEvent,
  type Meeting,
  type RecurringDuty,
} from "@/lib/ledger";
import type { LedgerStore } from "./store";

type DemoState = {
  items: ChecklistItem[];
  done: string[];
  duties: RecurringDuty[];
  meetings: Meeting[];
  events: LedgerEvent[];
  ceremonies: Ceremony[];
};

const KEY = "admin-ledger-demo";
const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): DemoState {
  const items: ChecklistItem[] = [];
  for (let weekday = 0; weekday < 7; weekday += 1) {
    DEFAULT_CHECKLIST.forEach((label, i) => {
      items.push({ id: uid(), weekday, label, position: i + 1 });
    });
  }
  return {
    items,
    done: [],
    duties: [
      { id: uid(), title: "Update the membership register", cadence: "Weekly", notes: null },
      { id: uid(), title: "File service attendance report", cadence: "Weekly", notes: null },
      { id: uid(), title: "Reconcile the office petty cash", cadence: "Monthly", notes: null },
    ],
    meetings: [
      {
        id: uid(),
        title: "Management Meeting",
        weekday: 2,
        start_time: "10:00",
        location: "Church office",
        notes: "Agenda circulated a day before",
        meeting_date: null,
        is_recurring: true,
      },
      {
        id: uid(),
        title: "Workers' Briefing",
        weekday: 4,
        start_time: "17:30",
        location: "Main auditorium",
        notes: null,
        meeting_date: null,
        is_recurring: true,
      },
    ],
    events: [],
    ceremonies: [],
  };
}

export function useDemoLedger(selectedWeekday: number): LedgerStore {
  const [state, setState] = useState<DemoState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setState(raw ? (JSON.parse(raw) as DemoState) : seed());
    } catch {
      setState(seed());
    }
  }, []);

  useEffect(() => {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const patch = useCallback((fn: (s: DemoState) => DemoState) => {
    setState((s) => (s ? fn(s) : s));
  }, []);

  const items = useMemo(
    () =>
      (state?.items ?? [])
        .filter((i) => i.weekday === selectedWeekday)
        .sort((a, b) => a.position - b.position),
    [state, selectedWeekday],
  );

  return {
    loading: !state,
    items,
    doneItemIds: new Set(state?.done ?? []),
    duties: state?.duties ?? [],
    meetings: state?.meetings ?? [],
    events: [...(state?.events ?? [])].sort((a, b) => a.event_date.localeCompare(b.event_date)),
    ceremonies: state?.ceremonies ?? [],
    toggleItem: (id) =>
      patch((s) => ({
        ...s,
        done: s.done.includes(id) ? s.done.filter((d) => d !== id) : [...s.done, id],
      })),
    addItem: (weekday, label) =>
      patch((s) => ({
        ...s,
        items: [...s.items, { id: uid(), weekday, label, position: s.items.length + 1 }],
      })),
    removeItem: (id) => patch((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) })),
    addDuty: (v) => patch((s) => ({ ...s, duties: [...s.duties, { ...v, id: uid() }] })),
    removeDuty: (id) => patch((s) => ({ ...s, duties: s.duties.filter((d) => d.id !== id) })),
    addMeeting: (v) => patch((s) => ({ ...s, meetings: [...s.meetings, { ...v, id: uid() }] })),
    removeMeeting: (id) =>
      patch((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== id) })),
    addEvent: (v) => patch((s) => ({ ...s, events: [...s.events, { ...v, id: uid() }] })),
    removeEvent: (id) => patch((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) })),
    addCeremony: (v) =>
      patch((s) => ({ ...s, ceremonies: [...s.ceremonies, { ...v, id: uid() }] })),
    removeCeremony: (id) =>
      patch((s) => ({ ...s, ceremonies: s.ceremonies.filter((c) => c.id !== id) })),
  };
}
