import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CourseIcon, EmptyState, PageHeader, Panel, Tag } from "@/components/ui-kit";
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

const selectCls = "h-10 rounded-md border border-input bg-card px-3 text-sm";

function Formacao() {
  const courses = useStore((s) => s.courses);
  const classes = useStore((s) => s.classes);
  const [q, setQ] = useState("");
  const [instrument, setInstrument] = useState("");
  const [category, setCategory] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const categories = [...new Set(courses.map((c) => c.category))];

  const list = courses.filter((c) => {
    const cls = classes.filter((k) => k.courseId === c.id);
    const open = cls.some((k) => k.enrolled < k.capacity);
    return (
      c.name.toLowerCase().includes(q.toLowerCase().trim()) &&
      (!instrument || c.id === instrument) &&
      (!category || c.category === category) &&
      (!onlyOpen || open)
    );
  });

  return (
    <div>
      <PageHeader title="Formação Musical" subtitle="Descubra nossos cursos e encontre o instrumento ideal para sua jornada musical." />
      <Panel className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Pesquisar curso" placeholder="Pesquisar curso pelo nome..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <select aria-label="Instrumento" className={selectCls} value={instrument} onChange={(e) => setInstrument(e.target.value)}>
          <option value="">Todos os instrumentos</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Categoria" className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="h-4 w-4 accent-primary" /> Com vagas
        </label>
      </Panel>

      {list.length === 0 ? <EmptyState text="Nenhum curso encontrado com esses filtros." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((c) => {
            const vagas = classes.filter((k) => k.courseId === c.id).reduce((a, k) => a + Math.max(0, k.capacity - k.enrolled), 0);
            return (
              <Panel key={c.id} className="flex flex-col">
                <div className="mb-4 grid h-24 place-items-center rounded-lg bg-beige text-navy"><CourseIcon id={c.id} className="h-10 w-10" /></div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  <Tag tone="muted">{c.category}</Tag>
                </div>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3">{vagas > 0 ? <Tag tone="success">{vagas} vagas</Tag> : <Tag tone="warning">Sem vagas</Tag>}</div>
                <Button asChild className="mt-4"><Link to="/formacao/$id" params={{ id: c.id }}>Ver turmas</Link></Button>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
