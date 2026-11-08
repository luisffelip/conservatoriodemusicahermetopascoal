import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { DateBadge, Panel, Tag } from "@/components/ui-kit";
import { fmtDate, useStore } from "@/lib/store";
import { createSeed } from "@/lib/seed";

export const Route = createFileRoute("/eventos_/$id")({
  loader: ({ params }) => {
    const e = createSeed().events.find((x) => x.id === params.id);
    if (!e) throw notFound();
    return { name: e.name, description: e.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Evento"} — Conservatório Hermeto Pascoal` },
      { name: "description", content: loaderData?.description ?? "Detalhes do evento." },
      { property: "og:title", content: loaderData?.name ?? "Evento" },
      { property: "og:description", content: loaderData?.description ?? "" },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const e = useStore((s) => s.events).find((x) => x.id === id)!;
  return (
    <div>
      <Link to="/eventos" className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar aos eventos</Link>
      <Panel className="flex flex-col gap-6 md:flex-row">
        <DateBadge date={e.date} />
        <div>
          <div className="flex flex-wrap gap-2"><Tag>{e.type}</Tag>{e.free && <Tag tone="success">Entrada gratuita</Tag>}</div>
          <h1 className="mt-2 font-display text-3xl">{e.name}</h1>
          <p className="mt-3 max-w-2xl">{e.description}</p>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {fmtDate(e.date)}</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {e.time}</span>
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {e.place}</span>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Evento fictício para demonstração. Não há venda de ingressos neste sistema.</p>
        </div>
      </Panel>
    </div>
  );
}
