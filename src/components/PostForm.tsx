import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { actions } from "@/lib/store";
import type { Post } from "@/lib/seed";

const ACTIVITIES = ["Ensaio", "Gravação", "Apresentação", "Outro"];
const empty = { title: "", description: "", instrument: "", activity: "Ensaio", date: "", period: "" };

export function PostForm({ open, onOpenChange, post, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; post?: Post | null; onSaved: (id: string) => void }) {
  const [f, setF] = useState(empty);
  useEffect(() => {
    if (open) setF(post ? { title: post.title, description: post.description, instrument: post.instrument ?? "", activity: post.activity, date: post.date ?? "", period: post.period ?? "" } : empty);
  }, [open, post]);
  const up = (k: keyof typeof empty) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.title.trim().length < 5) return void toast.error("Informe um título com pelo menos 5 caracteres.");
    if (f.description.trim().length < 10) return void toast.error("Descreva sua necessidade musical (mín. 10 caracteres).");
    const id = actions.savePost({ title: f.title.trim(), description: f.description.trim(), instrument: f.instrument.trim() || undefined, activity: f.activity, date: f.date || undefined, period: f.period.trim() || undefined }, post?.id);
    toast.success(post ? "Publicação atualizada!" : "Publicação criada com sucesso!");
    onOpenChange(false);
    onSaved(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{post ? "Editar publicação" : "Nova publicação"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Título"><Input value={f.title} onChange={up("title")} placeholder="Ex.: Procuro baterista para ensaio" /></Field>
          <Field label="Descrição da necessidade musical"><Textarea rows={4} value={f.description} onChange={up("description")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instrumento procurado ou relacionado"><Input value={f.instrument} onChange={up("instrument")} placeholder="Ex.: Bateria" /></Field>
            <Field label="Tipo de atividade">
              <select value={f.activity} onChange={up("activity")} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                {ACTIVITIES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Data desejada (opcional)"><Input type="date" value={f.date} onChange={up("date")} /></Field>
            <Field label="Horário ou período (opcional)"><Input value={f.period} onChange={up("period")} placeholder="Ex.: Sábado à tarde" /></Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{post ? "Salvar" : "Publicar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium text-navy"><span>{label}</span>{children}</label>;
}
