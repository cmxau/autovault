import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search as SearchIcon,
  Car,
  ClipboardList,
  BriefcaseBusiness,
  NotebookPen,
} from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { Row, RowGroup } from "@/components/autovault/row";
import { EmptyState } from "@/components/autovault/empty-state";
import { useVehicles, useTimeline, useDocs, useNotes } from "@/hooks/use-garage-data";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · AutoVault" },
      {
        name: "description",
        content: "Search across every vehicle, timeline entry, document and note in your garage.",
      },
    ],
  }),
  component: SearchPage,
});

function matches(query: string, ...fields: (string | undefined)[]) {
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function SearchPage() {
  const vehicles = useVehicles();
  const timeline = useTimeline();
  const docs = useDocs();
  const notes = useNotes();
  const [query, setQuery] = useState("");

  const nicknameFor = (vehicleId: string) =>
    vehicles.find((v) => v.id === vehicleId)?.nickname ?? "Unknown vehicle";

  const results = useMemo(() => {
    if (!query.trim()) return null;

    const vehicleMatches = vehicles.filter((v) =>
      matches(query, v.nickname, v.make, v.model, v.variant, v.registration),
    );
    const timelineMatches = timeline.filter((e) => matches(query, e.title, e.note));
    const docMatches = docs.filter((d) => matches(query, d.title, d.issuer, d.category, d.number));
    const noteMatches = notes.filter((n) => matches(query, n.text));

    return { vehicleMatches, timelineMatches, docMatches, noteMatches };
  }, [query, vehicles, timeline, docs, notes]);

  const totalResults = results
    ? results.vehicleMatches.length +
      results.timelineMatches.length +
      results.docMatches.length +
      results.noteMatches.length
    : 0;

  return (
    <div>
      <PageHeader title="Search" />

      <div className="surface-tinted flex items-center gap-3 rounded-[16px] px-4 py-3">
        <SearchIcon className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vehicles, entries, documents, notes"
          className="focus-ring w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </div>

      {!results && (
        <p className="mt-6 px-1 text-[13px] leading-relaxed text-muted-foreground">
          Search across every vehicle, fuel/service/expense entry, glovebox document and driving
          note in your garage.
        </p>
      )}

      {results && totalResults === 0 && (
        <EmptyState
          icon={SearchIcon}
          title="No matches."
          description={`Nothing found for "${query}".`}
        />
      )}

      {results && results.vehicleMatches.length > 0 && (
        <section className="mt-7">
          <SectionHeader title="Vehicles" />
          <RowGroup>
            {results.vehicleMatches.map((v) => (
              <Row
                key={v.id}
                icon={Car}
                title={v.nickname}
                detail={`${v.year} ${v.make} ${v.model}`}
                to="/vehicle/$vehicleId"
                params={{ vehicleId: v.id }}
              />
            ))}
          </RowGroup>
        </section>
      )}

      {results && results.timelineMatches.length > 0 && (
        <section className="mt-7">
          <SectionHeader title="Timeline" />
          <RowGroup>
            {results.timelineMatches.map((e) => (
              <Row
                key={e.id}
                icon={ClipboardList}
                title={e.title}
                detail={`${nicknameFor(e.vehicleId)} · ${e.date}`}
                to="/vehicle/$vehicleId"
                params={{ vehicleId: e.vehicleId }}
              />
            ))}
          </RowGroup>
        </section>
      )}

      {results && results.docMatches.length > 0 && (
        <section className="mt-7">
          <SectionHeader title="Glovebox" />
          <RowGroup>
            {results.docMatches.map((d) => (
              <Row
                key={d.id}
                icon={BriefcaseBusiness}
                title={d.title}
                detail={`${nicknameFor(d.vehicleId)} · ${d.issuer}`}
                to="/glovebox/$docId"
                params={{ docId: d.id }}
              />
            ))}
          </RowGroup>
        </section>
      )}

      {results && results.noteMatches.length > 0 && (
        <section className="mt-7">
          <SectionHeader title="Driving Notes" />
          <RowGroup>
            {results.noteMatches.map((n) => (
              <Row
                key={n.id}
                icon={NotebookPen}
                title={n.text}
                detail={nicknameFor(n.vehicleId)}
                to="/vehicle/$vehicleId"
                params={{ vehicleId: n.vehicleId }}
              />
            ))}
          </RowGroup>
        </section>
      )}
    </div>
  );
}
