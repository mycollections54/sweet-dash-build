import type {
  Ceremony,
  ChecklistItem,
  LedgerEvent,
  Meeting,
  RecurringDuty,
} from "@/lib/ledger";

export type LedgerStore = {
  loading: boolean;
  items: ChecklistItem[];
  doneItemIds: Set<string>;
  duties: RecurringDuty[];
  meetings: Meeting[];
  events: LedgerEvent[];
  ceremonies: Ceremony[];
  toggleItem: (id: string) => void;
  addItem: (weekday: number, label: string) => void;
  removeItem: (id: string) => void;
  addDuty: (v: Omit<RecurringDuty, "id">) => void;
  removeDuty: (id: string) => void;
  addMeeting: (v: Omit<Meeting, "id">) => void;
  removeMeeting: (id: string) => void;
  addEvent: (v: Omit<LedgerEvent, "id">) => void;
  removeEvent: (id: string) => void;
  addCeremony: (v: Omit<Ceremony, "id">) => void;
  removeCeremony: (id: string) => void;
};

export function dateForWeekday(weekday: number) {
  const now = new Date();
  const diff = weekday - now.getDay();
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d;
}
