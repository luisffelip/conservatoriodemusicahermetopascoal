import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Check, Hand, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState, FilterPills, PageHeader, Tag, UserAvatar, useAuthGuard } from "@/components/ui-kit";
import { PostForm } from "@/components/PostForm";
import { actions, fmtDate, useCurrentUser, useStore } from "@/lib/store";
import type { Post } from "@/lib/seed";

export const Route = createFileRoute("/colaboracao")({
  head: () => ({
    meta: [
      { title: "Colaboração Musical — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Mural para encontrar músicos para ensaios, gravações e apresentações." },
      { property: "og:title", content: "Colaboração Musical" },
      { property: "og:description", content: "Conecte-se com outros músicos e desenvolva seus projetos." },
    ],
  }),
  component: Colaboracao,
});

const FILTERS = ["Todas", "Ensaio", "Gravação", "Apresentação", "Outro"] as const;

function Colaboracao() {
  const posts = useStore((s) => s.posts);
  const users = useStore((s) => s.users);
  const user = useCurrentUser();
  const guard = useAuthGuard();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todas");
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    if (!highlight) return;
    document.getElementById(`post-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlight(null), 3000);
    return () => clearTimeout(t);
  }, [highlight]);

  const list = posts.filter((p) => filter === "Todas" || p.activity === filter);

  const interest = (p: Post) => {
    if (!guard("/colaboracao")) return;
    const err = actions.showInterest(p.id);
    if (err) toast.error(err);
    else toast.success(`Interesse registrado! ${p.authorName} será notificado(a).`);
  };

  return (
    <div>
      <PageHeader
        module="colab"
        title="Colaboração Musical"
        subtitle="Encontre músicos, compartilhe suas necessidades e faça parcerias."
        action={<Button className="bg-navy text-navy-foreground hover:bg-navy/90" onClick={() => { if (guard("/colaboracao")) { setEditing(null); setFormOpen(true); } }}><Plus className="h-4 w-4" /> Nova publicação</Button>}
      />
      <div className="mb-5"><FilterPills label="Tipo de atividade" options={FILTERS} value={filter} onChange={setFilter} /></div>

      {list.length === 0 ? <EmptyState text="Nenhuma publicação nesta categoria." /> : (
        <div className="space-y-3">
          {list.map((p) => {
            const mine = user?.id === p.authorId;
            const already = !!user && p.interested.includes(user.id);
            const author = users.find((u) => u.id === p.authorId);
            const count = p.interested.length;
            return (
              <article
                key={p.id}
                id={`post-${p.id}`}
                className={`rounded-xl border bg-card p-4 shadow-card transition-shadow md:p-5 ${highlight === p.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar name={p.authorName} src={author?.avatar} size={10} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-semibold text-navy">{p.authorName}{mine && " (você)"}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</p>
                    </div>
                    {(author?.instrument || p.instrument) && <p className="text-xs text-muted-foreground">{author?.instrument ?? p.instrument}</p>}
                  </div>
                </div>
                <h2 className="mt-3 text-base font-bold">{p.title}</h2>
                <p className="mt-1 text-sm">{p.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Tag>{p.activity}</Tag>
                  {p.instrument && <Tag tone="muted">{p.instrument}</Tag>}
                  {(p.date || p.period) && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {[p.date && fmtDate(p.date), p.period].filter(Boolean).join(" · ")}</span>}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label={`${count} pessoas demonstraram interesse`}>
                    <Hand className="h-4 w-4 text-colab" /> {count} {count === 1 ? "interessado" : "interessados"}
                  </span>
                  <div className="ml-auto flex gap-2">
                    {mine ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleting(p)}><Trash2 className="h-3.5 w-3.5" /> Excluir</Button>
                      </>
                    ) : already ? (
                      <span className="flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-sm font-medium text-success-foreground"><Check className="h-4 w-4" /> Interesse registrado</span>
                    ) : (
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => interest(p)}><Hand className="h-4 w-4" /> Tenho interesse</Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PostForm open={formOpen} onOpenChange={setFormOpen} post={editing} onSaved={(id) => { setFilter("Todas"); setHighlight(id); }} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>“{deleting?.title}” será removida do mural.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { actions.deletePost(deleting!.id); toast.success("Publicação excluída."); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
