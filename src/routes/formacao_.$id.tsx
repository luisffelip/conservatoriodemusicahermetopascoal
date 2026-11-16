import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Check, Clock, User, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseIcon, Panel, Tag, useAuthGuard } from "@/components/ui-kit";
import { useCurrentUser, useStore } from "@/lib/store";
import { enroll } from "@/lib/records";
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
  const confirm = async () => {
    const err = await enroll(selected!.id);
    if (err) { toast.error(err); setSelected(null); return; }
    setDone(true);
  };

  return (
    <div>
      <Link to="/formacao" className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar aos cursos</Link>
      <Panel className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-formacao-soft text-formacao"><CourseIcon id={id} className="h-10 w-10" /></div>
        <div className="min-w-0">
          <Tag tone="muted">{course.category}</Tag>
          <h1 className="mt-1.5 text-2xl font-bold md:text-3xl">{course.name}</h1>
          <p className="mt-1 text-muted-foreground">{course.description}</p>
        </div>
      </Panel>

      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Descrição</h2>
        <p className="mt-1.5 max-w-3xl">{course.info}</p>
      </div>

      <h2 className="mb-3 text-lg font-bold">Turmas disponíveis</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((k) => {
          const vagas = k.capacity - k.enrolled;
          const mine = user && enrollments.some((e) => e.classId === k.id && e.userId === user.id && e.status !== "Cancelada");
          return (
            <Panel key={k.id} className="flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold">{course.name} — {k.level}</h3>
                <Tag>{k.level}</Tag>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 rounded-lg border p-3 text-sm sm:grid-cols-3 sm:divide-x sm:p-0">
                <div className="flex gap-2 sm:p-3">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-formacao" />
                  <div><dt className="text-xs font-semibold text-navy">Professor</dt><dd className="text-muted-foreground">{k.teacher}</dd></div>
                </div>
                <div className="flex gap-2 sm:p-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-formacao" />
                  <div><dt className="text-xs font-semibold text-navy">Horário</dt><dd className="text-muted-foreground">{k.days}<br />{k.time}</dd></div>
                </div>
                <div className="flex gap-2 sm:p-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-formacao" />
                  <div><dt className="text-xs font-semibold text-navy">Vagas</dt><dd className="text-muted-foreground">{Math.max(0, vagas)} de {k.capacity}</dd></div>
                </div>
              </dl>
              <div className="mt-4 flex-1">
                {vagas > 0 ? (
                  <p className="flex items-center justify-center gap-2 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground"><Check className="h-4 w-4" /> Ainda há vagas nesta turma!</p>
                ) : (
                  <p className="flex items-center justify-center gap-2 rounded-lg bg-warning px-3 py-2 text-sm font-medium text-warning-foreground"><AlertCircle className="h-4 w-4" /> Não há vagas disponíveis nesta turma.</p>
                )}
              </div>
              <Button className="mt-3 w-full bg-navy text-navy-foreground hover:bg-navy/90" disabled={vagas <= 0 || !!mine} onClick={() => open(k)}>
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
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-espacos text-module-foreground"><Check className="h-8 w-8" strokeWidth={3} /></span>
              <DialogTitle className="mt-4 text-xl">Solicitação de matrícula realizada!</DialogTitle>
              <p className="mt-2 text-muted-foreground">Você solicitou matrícula na turma de {course.name} — {selected.level}. Acompanhe a situação em Minha área.</p>
              <div className="mt-6 flex flex-col items-center gap-2">
                <Button className="bg-navy text-navy-foreground hover:bg-navy/90" onClick={() => setSelected(null)}>Voltar para as turmas</Button>
                <Link to="/minha-area" className="text-sm font-medium text-primary underline">Ver minhas matrículas</Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
