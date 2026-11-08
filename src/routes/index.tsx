import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, DoorOpen, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseIcon, Panel, Tag } from "@/components/ui-kit";
import { fmtDate, useCurrentUser, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Cursos, espaços para praticar, colaboração entre músicos e eventos do Conservatório Hermeto Pascoal." },
      { property: "og:title", content: "Conservatório Hermeto Pascoal" },
      { property: "og:description", content: "Formação musical, espaços, colaboração e eventos em Arapiraca." },
    ],
  }),
  component: Index,
});

const QUICK = [
  { to: "/formacao", title: "Formação", text: "Conheça nossos cursos e instrumentos.", cta: "Ver cursos", icon: GraduationCap },
  { to: "/espacos", title: "Espaços", text: "Encontre espaços para estudar, ensaiar e gravar.", cta: "Consultar espaços", icon: DoorOpen },
  { to: "/colaboracao", title: "Colaboração", text: "Encontre músicos para seus projetos.", cta: "Acessar mural", icon: Users },
  { to: "/eventos", title: "Eventos", text: "Confira apresentações e atividades culturais.", cta: "Ver eventos", icon: CalendarDays },
] as const;

function Index() {
  const user = useCurrentUser();
  const courses = useStore((s) => s.courses);
  const events = useStore((s) => s.events);
  const posts = useStore((s) => s.posts);

  return (
    <div className="space-y-10">
      <section className="staff-lines relative overflow-hidden rounded-2xl bg-navy p-8 text-navy-foreground md:p-10">
        <h1 className="font-display text-3xl text-navy-foreground md:text-4xl">
          Olá{user ? `, ${user.name.split(" ")[0]}` : ""}! Seja bem-vindo ao Conservatório Hermeto Pascoal.
        </h1>
        <p className="mt-3 max-w-2xl text-navy-foreground/80">
          Explore nossas atividades, encontre espaços para praticar música e descubra oportunidades de colaboração.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK.map((q) => (
          <Panel key={q.to} className="flex flex-col">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-accent text-primary"><q.icon className="h-5 w-5" /></div>
            <h2 className="text-lg font-semibold">{q.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{q.text}</p>
            <Button asChild className="mt-4 w-full"><Link to={q.to}>{q.cta}</Link></Button>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <SectionTitle title="Cursos em destaque" to="/formacao" />
          <div className="space-y-2">
            {courses.slice(0, 4).map((c) => (
              <Link key={c.id} to="/formacao/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-beige text-navy"><CourseIcon id={c.id} className="h-4 w-4" /></span>
                <span className="text-sm font-medium text-navy">{c.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.category}</span>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle title="Próximos eventos" to="/eventos" />
          <div className="space-y-2">
            {events.slice(0, 3).map((e) => (
              <Link key={e.id} to="/eventos/$id" params={{ id: e.id }} className="block rounded-lg p-2 hover:bg-muted">
                <p className="text-sm font-medium text-navy">{e.name}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(e.date)} · {e.time} · {e.place}</p>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle title="Últimas publicações" to="/colaboracao" />
          <div className="space-y-2">
            {posts.slice(0, 3).map((p) => (
              <Link key={p.id} to="/colaboracao" className="block rounded-lg p-2 hover:bg-muted">
                <p className="text-sm font-medium text-navy">{p.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">{p.authorName} <Tag>{p.activity}</Tag></p>
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function SectionTitle({ title, to }: { title: string; to: "/formacao" | "/eventos" | "/colaboracao" }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-semibold">{title}</h2>
      <Link to={to} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Ver tudo <ArrowRight className="h-3 w-3" /></Link>
    </div>
  );
}
