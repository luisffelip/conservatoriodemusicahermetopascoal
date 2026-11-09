import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Users } from "lucide-react";
import { EmptyState, FilterPills, PageHeader, Tag } from "@/components/ui-kit";
import { SpacePhoto } from "@/components/space-icon";
import { useStore } from "@/lib/store";
import { SLOTS } from "@/lib/seed";

export const Route = createFileRoute("/espacos")({
  head: () => ({
    meta: [
      { title: "Espaços — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Salas individuais, de ensaio, estúdio, auditório e anfiteatro para reserva." },
      { property: "og:title", content: "Espaços do Conservatório" },
      { property: "og:description", content: "Encontre o ambiente ideal para estudar, ensaiar ou gravar." },
    ],
  }),
  component: Espacos,
});

const CATEGORIES = ["Todos", "Salas", "Estúdios", "Auditório e anfiteatro"] as const;
type Category = (typeof CATEGORIES)[number];
const CATEGORY_OF: Record<string, Category> = { Estudo: "Salas", Ensaio: "Salas", Aulas: "Salas", Gravação: "Estúdios", Apresentações: "Auditório e anfiteatro" };
const today = () => new Date().toISOString().slice(0, 10);

function Espacos() {
  const spaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const [cat, setCat] = useState<Category>("Todos");
  const list = spaces.filter((s) => cat === "Todos" || CATEGORY_OF[s.type] === cat);

  return (
    <div>
      <PageHeader module="espacos" title="Espaços" subtitle="Encontre o espaço ideal para estudar, ensaiar, gravar ou se apresentar." />
      <div className="mb-5"><FilterPills label="Categoria de espaço" options={CATEGORIES} value={cat} onChange={setCat} /></div>

      {list.length === 0 ? <EmptyState text="Nenhum espaço nesta categoria." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => {
            const busy = reservations.filter((r) => r.spaceId === s.id && r.date === today() && r.status !== "Cancelada").length;
            const free = SLOTS.length - busy;
            return (
              <Link
                key={s.id}
                to="/espacos/$id"
                params={{ id: s.id }}
                className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-colors hover:border-espacos/40"
              >
                <SpacePhoto id={s.id} name={s.name} className="aspect-[16/9] w-full" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold">{s.name}</h2>
                    <Tag tone="muted">{s.type}</Tag>
                  </div>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5 text-espacos" /> {s.capacity}</span>
                    {free > 0 ? <Tag tone="success">Disponível hoje</Tag> : <Tag tone="warning">Lotado hoje</Tag>}
                  </div>
                  <span className="mt-4 rounded-lg bg-navy py-2 text-center text-sm font-medium text-navy-foreground transition-colors group-hover:bg-navy/90">Ver detalhes e reservar</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <p className="mt-6 flex items-start gap-2 rounded-lg bg-warning p-4 text-sm text-warning-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" /> As condições de utilização dos espaços dependem das regras administrativas do conservatório.
      </p>
    </div>
  );
}
