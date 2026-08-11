import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { todayISO, type Ceremony, type ChecklistItem, type LedgerEvent, type Meeting, type RecurringDuty } from "@/lib/ledger";
import { dateForWeekday, type LedgerStore } from "./store";

export function useCloudLedger(selectedWeekday: number): LedgerStore {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<ChecklistItem[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [duties, setDuties] = useState<RecurringDuty[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);

  const dayISO = useMemo(() => todayISO(dateForWeekday(selectedWeekday)), [selectedWeekday]);

  const fail = (message: string) => (error: { message: string } | null) => {
    if (error) toast.error(`${message}: ${error.message}`);
    return !error;
  };

  const loadAll = useCallback(async () => {
    const [i, d, m, e, c] = await Promise.all([
      supabase.from("checklist_items").select("id, weekday, label, position").order("position"),
      supabase.from("recurring_duties").select("id, title, cadence, notes").order("created_at"),
      supabase
        .from("meetings")
        .select("id, title, weekday, start_time, location, notes")
        .order("weekday"),
      supabase
        .from("events")
        .select("id, title, event_date, category, notes, remind")
        .order("event_date"),
      supabase
        .from("ceremonies")
        .select("id, kind, name, ceremony_date, officiant, status, notes")
        .order("ceremony_date", { nullsFirst: false }),
    ]);
    setAllItems(i.data ?? []);
    setDuties(d.data ?? []);
    setMeetings(m.data ?? []);
    setEvents(e.data ?? []);
    setCeremonies(c.data ?? []);
    setLoading(false);
  }, []);

  const loadDone = useCallback(async () => {
    const { data } = await supabase
      .from("checklist_completions")
      .select("item_id")
      .eq("done_on", dayISO);
    setDone((data ?? []).map((r) => r.item_id));
  }, [dayISO]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);
  useEffect(() => {
    void loadDone();
  }, [loadDone]);

  const uid = async () => (await supabase.auth.getUser()).data.user?.id ?? "";

  const items = useMemo(
    () =>
      allItems
        .filter((i) => i.weekday === selectedWeekday)
        .sort((a, b) => a.position - b.position),
    [allItems, selectedWeekday],
  );

  return {
    loading,
    items,
    doneItemIds: new Set(done),
    duties,
    meetings,
    events,
    ceremonies,
    toggleItem: async (id) => {
      if (done.includes(id)) {
        setDone((s) => s.filter((x) => x !== id));
        const { error } = await supabase
          .from("checklist_completions")
          .delete()
          .eq("item_id", id)
          .eq("done_on", dayISO);
        if (!fail("Could not update")(error)) void loadDone();
      } else {
        setDone((s) => [...s, id]);
        const { error } = await supabase
          .from("checklist_completions")
          .insert({ item_id: id, done_on: dayISO, user_id: await uid() });
        if (!fail("Could not update")(error)) void loadDone();
      }
    },
    addItem: async (weekday, label) => {
      const { error } = await supabase
        .from("checklist_items")
        .insert({ weekday, label, position: allItems.length + 1, user_id: await uid() });
      if (fail("Could not add task")(error)) void loadAll();
    },
    removeItem: async (id) => {
      const { error } = await supabase.from("checklist_items").delete().eq("id", id);
      if (fail("Could not remove task")(error)) void loadAll();
    },
    addDuty: async (v) => {
      const { error } = await supabase.from("recurring_duties").insert({ ...v, user_id: await uid() });
      if (fail("Could not add duty")(error)) void loadAll();
    },
    removeDuty: async (id) => {
      const { error } = await supabase.from("recurring_duties").delete().eq("id", id);
      if (fail("Could not remove duty")(error)) void loadAll();
    },
    addMeeting: async (v) => {
      const { error } = await supabase.from("meetings").insert({ ...v, user_id: await uid() });
      if (fail("Could not add meeting")(error)) void loadAll();
    },
    removeMeeting: async (id) => {
      const { error } = await supabase.from("meetings").delete().eq("id", id);
      if (fail("Could not remove meeting")(error)) void loadAll();
    },
    addEvent: async (v) => {
      const { error } = await supabase.from("events").insert({ ...v, user_id: await uid() });
      if (fail("Could not add event")(error)) void loadAll();
    },
    removeEvent: async (id) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (fail("Could not remove event")(error)) void loadAll();
    },
    addCeremony: async (v) => {
      const { error } = await supabase.from("ceremonies").insert({ ...v, user_id: await uid() });
      if (fail("Could not add record")(error)) void loadAll();
    },
    removeCeremony: async (id) => {
      const { error } = await supabase.from("ceremonies").delete().eq("id", id);
      if (fail("Could not remove record")(error)) void loadAll();
    },
  };
}
