import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Check, Hand, Music, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState, PageHeader, Panel, Tag, UserAvatar, useAuthGuard } from "@/components/ui-kit";
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

function Colaboracao() {
  const posts = useStore((s) => s.posts);
  const users = useStore((s) => s.users);
  const user = useCurrentUser();
  const guard = useAuthGuard();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [filter, setFilter] = useState("Todas");
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
        title="Colaboração Musical"
        subtitle="Conecte-se com outros músicos e encontre pessoas para desenvolver seus projetos."
        action={<Button size="lg" onClick={() => { if (guard("/colaboracao")) { setEditing(null); setFormOpen(true); } }}><Plus className="h-4 w-4" /> Nova publicação</Button>}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {["Todas", "Ensaio", "Gravação", "Apresentação", "Outro"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-1.5 text-sm ${filter === f ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{f}</button>
        ))}
      </div>

      {list.length === 0 ? <EmptyState text="Nenhuma publicação nesta categoria." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const mine = user?.id === p.authorId;
            const already = !!user && p.interested.includes(user.id);
            const author = users.find((u) => u.id === p.authorId);
            return (
              <div key={p.id} id={`post-${p.id}`} className={`rounded-xl transition-shadow ${highlight === p.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                <Panel className="flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={p.authorName} src={author?.avatar} />
                    <div className="text-sm">
                      <p className="font-medium text-navy">{p.authorName}{mine && " (você)"}</p>
                      <p className="text-xs text-muted-foreground">Publicado em {fmtDate(p.createdAt)}</p>
                    </div>
                    <div className="ml-auto"><Tag>{p.activity}</Tag></div>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{p.title}</h2>
                  <p className="mt-1 flex-1 text-sm">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {p.instrument && <span className="flex items-center gap-1"><Music className="h-3.5 w-3.5" /> {p.instrument}</span>}
                    {(p.date || p.period) && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {[p.date && fmtDate(p.date), p.period].filter(Boolean).join(" · ")}</span>}
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t pt-4">
                    {mine ? (
                      <>
                        <span className="text-sm text-muted-foreground">{p.interested.length} {p.interested.length === 1 ? "interessado" : "interessados"}</span>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleting(p)}><Trash2 className="h-3.5 w-3.5" /> Excluir</Button>
                      </>
                    ) : already ? (
                      <span className="flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-success-foreground"><Check className="h-4 w-4" /> Interesse registrado</span>
                    ) : (
                      <Button size="sm" onClick={() => interest(p)}><Hand className="h-4 w-4" /> Tenho interesse</Button>
                    )}
                  </div>
                </Panel>
              </div>
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
