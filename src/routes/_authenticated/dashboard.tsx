import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LedgerApp } from "@/components/ledger/LedgerApp";
import { useCloudLedger } from "@/components/ledger/useCloudLedger";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — The Admin Ledger" },
      {
        name: "description",
        content: "Your saved church administration dashboard: checklists, duties, meetings, events and ceremonies.",
      },
      { property: "og:title", content: "Dashboard — The Admin Ledger" },
      { property: "og:description", content: "Your saved church administration dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [weekday, setWeekday] = useState(new Date().getDay());
  const [name, setName] = useState<string>("");
  const store = useCloudLedger(weekday);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setName(
        (data.user?.user_metadata?.['display_name'] as string) ??
          data.user?.email?.split("@")[0] ??
          "",
      );
    });
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main>
      <LedgerApp
        store={store}
        weekday={weekday}
        onWeekdayChange={setWeekday}
        headerRight={
          <div className="flex items-center gap-2">
            {name && <span className="label-mono text-ink-foreground/70">{name}</span>}
            <Button variant="secondary" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        }
      />
    </main>
  );
}
