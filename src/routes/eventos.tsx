import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateBadge, PageHeader, Panel, Tag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

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
  return (
    <div>
      <PageHeader title="Eventos e apresentações" subtitle="Programação cultural do conservatório (dados demonstrativos)." />
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e) => (
          <Panel key={e.id} className="flex gap-4">
            <DateBadge date={e.date} />
            <div className="flex flex-1 flex-col">
              <div className="flex flex-wrap gap-2"><Tag>{e.type}</Tag>{e.free && <Tag tone="success">Entrada gratuita</Tag>}</div>
              <h2 className="mt-2 text-lg font-semibold">{e.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {e.time}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" /> {e.place}</span>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4 self-start"><Link to="/eventos/$id" params={{ id: e.id }}>Ver detalhes</Link></Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
