import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState, FilterPills, PageHeader, Panel, Tag } from "@/components/ui-kit";
import { canReview, loadAllEnrollments, reviewEnrollment, type AdminEnrollment, type Review } from "@/lib/admin";
import { useCurrentUser, useStore } from "@/lib/store";

export const Route = createFileRoute("/responsavel")({
  head: () => ({
    meta: [
      { title: "Responsável — Matrículas | Conservatório Hermeto Pascoal" },
      { name: "description", content: "Área do responsável para analisar solicitações de matrícula." },
      { property: "og:title", content: "Área do responsável" },
      { property: "og:description", content: "Aprovação de matrículas do conservatório." },
    ],
  }),
  component: Responsavel,
});

const FILTERS = ["Pendente", "Aprovada", "Recusada", "Cancelada", "Todas"] as const;
const fmt = (ts: string) => new Date(ts).toLocaleDateString("pt-BR");

function Responsavel() {
  const user = useCurrentUser();
  const isAdmin = useStore((s) => !!s.isAdmin);
  const classes = useStore((s) => s.classes);
  const courses = useStore((s) => s.courses);
  const [rows, setRows] = useState<AdminEnrollment[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Pendente");
  const [confirm, setConfirm] = useState<{ row: AdminEnrollment; status: Review } | null>(null);

  const refresh = useCallback(async () => {
    const r = await loadAllEnrollments();
    if (!r) toast.error("Não foi possível carregar as solicitações.");
    setRows(r ?? []);
  }, []);
  useEffect(() => { if (isAdmin) void refresh(); }, [isAdmin, refresh]);

  if (!user || !isAdmin) {
    return (
      <div>
        <PageHeader title="Área do responsável" />
        <Panel className="text-center">
          <p className="text-muted-foreground">Esta área é exclusiva para o responsável pelas matrículas.</p>
          {!user && <Button asChild className="mt-4 bg-navy text-navy-foreground hover:bg-navy/90"><Link to="/login">Entrar</Link></Button>}
        </Panel>
      </div>
    );
  }

  const list = (rows ?? []).filter((r) => filter === "Todas" || r.status === filter);
  const pending = (rows ?? []).filter((r) => r.status === "Pendente").length;

  const apply = async () => {
    if (!confirm) return;
    const err = await reviewEnrollment(confirm.row.id, confirm.status);
    if (err) toast.error(err);
    else toast.success(confirm.status === "Aprovada" ? "Matrícula aprovada. O aluno foi avisado." : "Solicitação recusada. O aluno foi avisado.");
    setConfirm(null);
    await refresh();
  };

  return (
    <div>
      <PageHeader module="formacao" title="Solicitações de matrícula" subtitle={`${pending} pendente(s) aguardando análise.`} />
      <div className="mb-5"><FilterPills label="Situação" options={FILTERS} value={filter} onChange={setFilter} /></div>
      {rows === null ? <EmptyState text="Carregando…" /> : list.length === 0 ? <EmptyState text="Nenhuma solicitação nesta situação." /> : (
        <div className="space-y-3">
          {list.map((r) => {
            const k = classes.find((x) => x.id === r.classId);
            const c = k && courses.find((x) => x.id === k.courseId);
            return (
              <Panel key={r.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{r.studentName}{r.instrument && <span className="font-normal text-muted-foreground"> · {r.instrument}</span>}</p>
                  <p className="text-sm">{c ? `${c.name} — ${k!.level}` : `Turma ${r.classId}`}{k && <span className="text-muted-foreground"> · {k.days} · {k.time} · {k.teacher} · {k.enrolled}/{k.capacity} vagas</span>}</p>
                  <p className="text-xs text-muted-foreground">Solicitada em {fmt(r.createdAt)}{r.reviewedAt && ` · analisada em ${fmt(r.reviewedAt)}`}{r.cancelledAt && ` · cancelada em ${fmt(r.cancelledAt)}`}</p>
                </div>
                <Tag tone={r.status === "Aprovada" ? "success" : r.status === "Pendente" ? "warning" : "muted"}>{r.status}</Tag>
                {canReview(r.status) && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-navy text-navy-foreground hover:bg-navy/90" onClick={() => setConfirm({ row: r, status: "Aprovada" })}><Check className="h-4 w-4" /> Aprovar</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirm({ row: r, status: "Recusada" })}><X className="h-4 w-4" /> Recusar</Button>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.status === "Aprovada" ? "Aprovar matrícula?" : "Recusar solicitação?"}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.row.studentName} receberá uma notificação com a decisão.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={apply}>{confirm?.status === "Aprovada" ? "Aprovar" : "Recusar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
