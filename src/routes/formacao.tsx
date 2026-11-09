import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CourseIcon, EmptyState, FilterPills, PageHeader, Panel, Tag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/formacao")({
  head: () => ({
    meta: [
      { title: "Formação Musical — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Cursos de piano, violão, guitarra, bateria, violino, canto, teclado e flauta." },
      { property: "og:title", content: "Formação Musical — Conservatório Hermeto Pascoal" },
      { property: "og:description", content: "Descubra nossos cursos e encontre o instrumento ideal." },
    ],
  }),
  component: Formacao,
});

const selectCls = "h-10 rounded-lg border border-input bg-card px-3 text-sm";

function Formacao() {
  const courses = useStore((s) => s.courses);
  const classes = useStore((s) => s.classes);
  const [q, setQ] = useState("");
  const [instrument, setInstrument] = useState("");
  const [category, setCategory] = useState("Todas");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const categories = ["Todas", ...new Set(courses.map((c) => c.category))];

  const list = courses.filter((c) => {
    const cls = classes.filter((k) => k.courseId === c.id);
    const open = cls.some((k) => k.enrolled < k.capacity);
    return (
      c.name.toLowerCase().includes(q.toLowerCase().trim()) &&
      (!instrument || c.id === instrument) &&
      (category === "Todas" || c.category === category) &&
      (!onlyOpen || open)
    );
  });

  return (
    <div>
      <PageHeader module="formacao" title="Cursos e Turmas" subtitle="Descubra nossos cursos e encontre o instrumento ideal para sua jornada musical." />
      <Panel className="mb-5 space-y-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Pesquisar curso" placeholder="Buscar curso ou instrumento..." value={q} onChange={(e) => setQ(e.target.value)} className="h-10 pl-9" />
          </div>
          <select aria-label="Instrumento" className={selectCls} value={instrument} onChange={(e) => setInstrument(e.target.value)}>
            <option value="">Todos os instrumentos</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="h-4 w-4 accent-primary" /> Somente com vagas
          </label>
        </div>
        <FilterPills label="Categoria" options={categories} value={category} onChange={setCategory} />
      </Panel>

      {list.length === 0 ? <EmptyState text="Nenhum curso encontrado com esses filtros." /> : (
        <div className="space-y-3">
          {list.map((c) => {
            const cls = classes.filter((k) => k.courseId === c.id);
            const vagas = cls.reduce((a, k) => a + Math.max(0, k.capacity - k.enrolled), 0);
            const levels = [...new Set(cls.map((k) => k.level))].join(" · ");
            const teachers = [...new Set(cls.map((k) => k.teacher))].join(", ");
            return (
              <Link
                key={c.id}
                to="/formacao/$id"
                params={{ id: c.id }}
                className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card transition-colors hover:border-formacao/40"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-formacao-soft text-formacao"><CourseIcon id={c.id} className="h-7 w-7" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold">{c.name}</h2>
                    <Tag tone="muted">{c.category}</Tag>
                    {vagas > 0 ? <Tag tone="success">{vagas} vagas</Tag> : <Tag tone="warning">Sem vagas</Tag>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.description}</p>
                  <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{cls.length} {cls.length === 1 ? "turma" : "turmas"} · {levels}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {teachers}</span>
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">Ver turmas <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground sm:hidden" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
