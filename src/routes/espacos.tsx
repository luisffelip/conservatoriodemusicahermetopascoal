import { createFileRoute, Link } from "@tanstack/react-router";
import { Info, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Tag } from "@/components/ui-kit";
import { SpaceIcon } from "@/components/space-icon";
import { useStore } from "@/lib/store";

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

function Espacos() {
  const spaces = useStore((s) => s.spaces);
  return (
    <div>
      <PageHeader title="Espaços do Conservatório" subtitle="Encontre o ambiente ideal para estudar, ensaiar ou desenvolver seus projetos musicais." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((s) => (
          <Panel key={s.id} className="flex flex-col">
            <div className="mb-4 grid h-24 place-items-center rounded-lg bg-beige text-navy"><SpaceIcon id={s.id} className="h-10 w-10" /></div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <Tag tone="muted">{s.type}</Tag>
            </div>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description}</p>
            <p className="mt-3 flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" /> {s.capacity}</p>
            <Button asChild className="mt-4"><Link to="/espacos/$id" params={{ id: s.id }}>Ver detalhes</Link></Button>
          </Panel>
        ))}
      </div>
      <p className="mt-8 flex items-start gap-2 rounded-lg bg-warning p-4 text-sm text-warning-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" /> As condições de utilização dos espaços dependem das regras administrativas do conservatório.
      </p>
    </div>
  );
}
