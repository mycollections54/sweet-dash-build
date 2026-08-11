import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LedgerApp } from "@/components/ledger/LedgerApp";
import { useDemoLedger } from "@/components/ledger/useDemoLedger";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Admin Ledger — Church Administration Planner" },
      {
        name: "description",
        content:
          "A daily checklist, recurring duties, meetings, events and ceremony register for church administrators. Sign in to save your ledger.",
      },
      { property: "og:title", content: "The Admin Ledger — Church Administration Planner" },
      {
        property: "og:description",
        content:
          "Daily checklist, recurring duties, meetings, events and ceremonies in one calm administrative ledger.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [weekday, setWeekday] = useState(new Date().getDay());
  const store = useDemoLedger(weekday);

  return (
    <main>
      <LedgerApp
        store={store}
        weekday={weekday}
        onWeekdayChange={setWeekday}
        headerRight={
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        }
        banner={
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-secondary/60 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              You're viewing the ledger in preview mode — changes stay on this device only.
            </p>
            <Button asChild size="sm">
              <Link to="/auth">Sign in to save your ledger</Link>
            </Button>
          </div>
        }
      />
    </main>
  );
}
