import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseIcon, Panel, Tag, useAuthGuard } from "@/components/ui-kit";
import { actions, useCurrentUser, useStore } from "@/lib/store";
import { createSeed, type ClassGroup } from "@/lib/seed";

export const Route = createFileRoute("/formacao_/$id")({
  loader: ({ params }) => {
    const c = createSeed().courses.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return { name: c.name, description: c.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Curso"} — Formação · Conservatório Hermeto Pascoal` },
      { name: "description", content: loaderData?.description ?? "Detalhes do curso." },
      { property: "og:title", content: `Curso de ${loaderData?.name ?? ""}` },
      { property: "og:description", content: loaderData?.description ?? "" },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { id } = Route.useParams();
  const course = useStore((s) => s.courses).find((c) => c.id === id)!;
  const classes = useStore((s) => s.classes).filter((k) => k.courseId === id);
  const enrollments = useStore((s) => s.enrollments);
  const user = useCurrentUser();
  const guard = useAuthGuard();
  const [selected, setSelected] = useState<ClassGroup | null>(null);
  const [done, setDone] = useState(false);

  const open = (k: ClassGroup) => {
    if (k.enrolled >= k.capacity) return void toast.error("Não há vagas disponíveis nesta turma.");
    if (!guard(`/formacao/${id}`)) return;
    setDone(false);
    setSelected(k);
  };
  const confirm = () => {
    const err = actions.enroll(selected!.id);
    if (err) { toast.error(err); setSelected(null); return; }
    setDone(true);
  };

  return (
    <div>
      <Link to="/formacao" className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar aos cursos</Link>
      <Panel className="mb-8 flex flex-col gap-6 md:flex-row">
        <div className="grid h-32 w-full shrink-0 place-items-center rounded-lg bg-beige text-navy md:w-40"><CourseIcon id={id} className="h-12 w-12" /></div>
        <div>
          <Tag tone="muted">{course.category}</Tag>
          <h1 className="mt-2 font-display text-3xl">{course.name}</h1>
          <p className="mt-2 text-muted-foreground">{course.description}</p>
          <p className="mt-2 text-sm">{course.info}</p>
        </div>
      </Panel>

      <h2 className="mb-4 text-xl font-semibold">Turmas disponíveis</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((k) => {
          const vagas = k.capacity - k.enrolled;
          const mine = user && enrollments.some((e) => e.classId === k.id && e.userId === user.id);
          return (
            <Panel key={k.id}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{course.name} — {k.level}</h3>
                {vagas > 0 ? <Tag tone="success">{vagas} {vagas === 1 ? "vaga" : "vagas"}</Tag> : <Tag tone="warning">Sem vagas</Tag>}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {k.days} · {k.time}</li>
                <li className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {k.teacher}</li>
              </ul>
              {vagas <= 0 && <p className="mt-3 text-sm text-warning-foreground">Não há vagas disponíveis nesta turma.</p>}
              <Button className="mt-4 w-full" disabled={vagas <= 0 || !!mine} onClick={() => open(k)}>
                {mine ? "Matrícula solicitada" : "Solicitar matrícula"}
              </Button>
            </Panel>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && !done && (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar solicitação de matrícula</DialogTitle>
                <DialogDescription>Confira os dados da turma escolhida.</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-muted p-4 text-sm">
                <dt className="text-muted-foreground">Curso</dt><dd className="font-medium">{course.name}</dd>
                <dt className="text-muted-foreground">Nível</dt><dd>{selected.level}</dd>
                <dt className="text-muted-foreground">Horário</dt><dd>{selected.days} · {selected.time}</dd>
                <dt className="text-muted-foreground">Professor</dt><dd>{selected.teacher}</dd>
                <dt className="text-muted-foreground">Aluno</dt><dd>{user?.name}</dd>
              </dl>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
                <Button onClick={confirm}>Confirmar matrícula</Button>
              </DialogFooter>
            </>
          )}
          {selected && done && (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success-foreground" />
              <DialogTitle className="mt-3 text-xl">Solicitação de matrícula realizada!</DialogTitle>
              <p className="mt-2 text-muted-foreground">Você solicitou matrícula na turma de {course.name} — {selected.level}.</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
                <Button asChild><Link to="/minha-area">Ver minhas matrículas</Link></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
