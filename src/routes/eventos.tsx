import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Clock, MapPin } from "lucide-react";
import { DateBadge, EmptyState, FilterPills, PageHeader, Tag } from "@/components/ui-kit";
import { fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos e apresentações — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Recitais, apresentações de alunos e encontros culturais do conservatório." },
      { property: "og:title", content: "Eventos e apresentações" },
      { property: "og:description", content: "Confira a programação cultural do conservatório." },
    ],
  }),
  component: Eventos,
});

function Eventos() {
  const events = useStore((s) => s.events);
  const types = ["Todos", ...new Set(events.map((e) => e.type))];
  const [type, setType] = useState("Todos");
  const list = events.filter((e) => type === "Todos" || e.type === type).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <PageHeader module="eventos" title="Eventos" subtitle="Programação cultural do conservatório (dados demonstrativos)." />
      <div className="mb-5"><FilterPills label="Tipo de evento" options={types} value={type} onChange={setType} /></div>
      {list.length === 0 ? <EmptyState text="Nenhum evento deste tipo." /> : (
        <div className="space-y-3">
          {list.map((e) => (
            <Link
              key={e.id}
              to="/eventos/$id"
              params={{ id: e.id }}
              className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card transition-colors hover:border-eventos/40"
            >
              <DateBadge date={e.date} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">{e.name}</h2>
                  <Tag tone="muted">{e.type}</Tag>
                  {e.free && <Tag tone="success">Gratuito</Tag>}
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{e.description}</p>
                <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{fmtDate(e.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-eventos" /> {e.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-eventos" /> {e.place}</span>
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">Ver detalhes <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground sm:hidden" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
