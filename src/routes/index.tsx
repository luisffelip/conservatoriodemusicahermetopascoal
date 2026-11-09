import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Megaphone, MapPin, Sparkles } from "lucide-react";
import { DateBadge, MODULES, Panel, type ModuleKey } from "@/components/ui-kit";
import { fmtDate, useCurrentUser, useStore } from "@/lib/store";
import { ANNOUNCEMENTS } from "@/lib/seed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Cursos, espaços para praticar, colaboração entre músicos e eventos do Conservatório Hermeto Pascoal." },
      { property: "og:title", content: "Conservatório Hermeto Pascoal" },
      { property: "og:description", content: "Formação musical, espaços, colaboração e eventos em Arapiraca." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const QUICK: { key: ModuleKey; to: "/formacao" | "/espacos" | "/colaboracao" | "/eventos"; text: string }[] = [
  { key: "formacao", to: "/formacao", text: "Cursos e turmas" },
  { key: "espacos", to: "/espacos", text: "Consulte e reserve ambientes" },
  { key: "colab", to: "/colaboracao", text: "Encontre músicos e compartilhe necessidades musicais" },
  { key: "eventos", to: "/eventos", text: "Confira a programação" },
];

const today = () => new Date().toISOString().slice(0, 10);

function Index() {
  const user = useCurrentUser();
  const events = useStore((s) => s.events);
  const classes = useStore((s) => s.classes);
  const courses = useStore((s) => s.courses);

  const upcoming = events.filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const open = classes.filter((k) => k.enrolled < k.capacity);
  const newest = open.slice(-2).map((k) => `${courses.find((c) => c.id === k.courseId)?.name} — ${k.level}`);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold md:text-3xl">
          Olá{user ? `, ${user.name.split(" ")[0]}` : ""}! Seja bem-vindo ao Conservatório Hermeto Pascoal.
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
          Acesse cursos, reserve espaços, encontre parceiros musicais e acompanhe a programação em um só lugar.
        </p>
      </section>

      <section aria-label="Acesso rápido" className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {QUICK.map((q) => {
          const m = MODULES[q.key];
          return (
            <Link
              key={q.to}
              to={q.to}
              className={`group flex min-h-32 flex-col justify-between rounded-xl p-4 shadow-card transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:min-h-36 md:p-5 ${m.solid}`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-module-foreground/20"><m.icon className="h-5 w-5" /></span>
              <span>
                <span className="flex items-center justify-between gap-2 font-display text-base font-bold md:text-lg">
                  {m.label}
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-0.5 block text-xs leading-snug opacity-90 md:text-sm">{q.text}</span>
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel className="p-0">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <h2 className="font-semibold">Próximos eventos</h2>
            <Link to="/eventos" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Ver todos <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y">
            {upcoming.length === 0 && <p className="p-5 text-sm text-muted-foreground">Nenhum evento programado.</p>}
            {upcoming.map((e) => (
              <Link key={e.id} to="/eventos/$id" params={{ id: e.id }} className="flex items-center gap-4 px-5 py-3 hover:bg-muted">
                <DateBadge date={e.date} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{e.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{fmtDate(e.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.place}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel className="p-0">
          <div className="border-b px-5 py-3.5"><h2 className="font-semibold">Avisos</h2></div>
          <ul className="divide-y">
            <li>
              <Link to="/formacao" className="flex gap-3 px-5 py-3 hover:bg-muted">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-formacao-soft text-formacao"><Sparkles className="h-4 w-4" /></span>
                <span className="min-w-0 text-sm">
                  <span className="block font-medium text-navy">{open.length} turmas com vagas abertas</span>
                  <span className="block text-xs text-muted-foreground">Inclui {newest.join(" e ")}. Solicite sua matrícula.</span>
                </span>
              </Link>
            </li>
            {ANNOUNCEMENTS.map((a) => (
              <li key={a.id} className="flex gap-3 px-5 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-colab-soft text-colab"><Megaphone className="h-4 w-4" /></span>
                <span className="min-w-0 text-sm">
                  <span className="block font-medium text-navy">{a.title}</span>
                  <span className="block text-xs text-muted-foreground">{a.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </div>
  );
}
