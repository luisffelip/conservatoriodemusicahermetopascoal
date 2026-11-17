import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, DoorOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseIcon, EmptyState, PageHeader, Panel, Tag, UserAvatar } from "@/components/ui-kit";
import { actions, fmtDate, useCurrentUser, useStore } from "@/lib/store";
import { authErrorMessage, saveProfile } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { importLegacyPosts, legacyPosts } from "@/lib/posts";
import { cancelEnrollment, cancelReservation, markRead } from "@/lib/records";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/minha-area")({
  head: () => ({
    meta: [
      { title: "Minha área — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Acompanhe suas matrículas, reservas, colaborações e notificações." },
      { property: "og:title", content: "Minha área" },
      { property: "og:description", content: "Sua área pessoal no conservatório." },
    ],
  }),
  component: MinhaArea,
});

const tabCls = "rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-navy data-[state=active]:text-navy-foreground data-[state=active]:shadow-none";

function MinhaArea() {
  const user = useCurrentUser();
  if (!user) {
    return (
      <div>
        <PageHeader title="Minha área" />
        <Panel className="text-center">
          <p className="text-muted-foreground">Entre na sua conta para acompanhar matrículas, reservas e colaborações.</p>
          <Button asChild className="mt-4 bg-navy text-navy-foreground hover:bg-navy/90"><Link to="/login">Entrar</Link></Button>
        </Panel>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <UserAvatar name={user.name} src={user.avatar} size={16} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold md:text-[1.75rem]">Minha área</h1>
          <p className="truncate text-sm text-muted-foreground">Acompanhe suas atividades, {user.name.split(" ")[0]}.</p>
        </div>
      </div>
      <Tabs defaultValue="matriculas">
        <TabsList className="mb-5 flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger className={tabCls} value="matriculas">Minhas matrículas</TabsTrigger>
          <TabsTrigger className={tabCls} value="reservas">Minhas reservas</TabsTrigger>
          <TabsTrigger className={tabCls} value="colab">Minhas publicações</TabsTrigger>
          <TabsTrigger className={tabCls} value="notif">Notificações</TabsTrigger>
          <TabsTrigger className={tabCls} value="dados">Dados pessoais</TabsTrigger>
        </TabsList>
        <TabsContent value="matriculas"><Matriculas /></TabsContent>
        <TabsContent value="reservas"><Reservas /></TabsContent>
        <TabsContent value="colab"><Colabs /></TabsContent>
        <TabsContent value="notif"><Notifs /></TabsContent>
        <TabsContent value="dados"><Dados /></TabsContent>
      </Tabs>
    </div>
  );
}

function ConfirmCancel({ label, title, text, onConfirm }: { label: string; title: string; text: string; onConfirm: () => Promise<string | null> }) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="outline" size="sm">{label}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{text}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={async () => { setBusy(true); const e = await onConfirm(); setBusy(false); if (e) toast.error(e); }}>Confirmar cancelamento</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const ENROLL_LABEL = { Pendente: "Pendente — aguardando autorização", Aprovada: "Aprovada", Recusada: "Recusada", Cancelada: "Cancelada" } as const;

function Matriculas() {
  const user = useCurrentUser()!;
  const enrollments = useStore((s) => s.enrollments);
  const classes = useStore((s) => s.classes);
  const courses = useStore((s) => s.courses);
  const mine = enrollments.filter((e) => e.userId === user.id);
  if (!mine.length) return <EmptyState text="Você ainda não solicitou matrículas. Explore a página Formação." />;
  const active = mine.filter((e) => e.status === "Pendente" || e.status === "Aprovada");
  const past = mine.filter((e) => e.status === "Cancelada" || e.status === "Recusada");
  const row = (e: (typeof mine)[number]) => {
    const k = classes.find((x) => x.id === e.classId);
    const c = k && courses.find((x) => x.id === k.courseId);
    if (!k || !c) return null;
    return (
      <Panel key={e.id} className={`flex flex-wrap items-center gap-4 p-4 ${e.status === "Cancelada" || e.status === "Recusada" ? "opacity-70" : ""}`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-formacao-soft text-formacao"><CourseIcon id={c.id} className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy">{c.name} — {k.level}</p>
          <p className="text-sm text-muted-foreground">{k.days} · {k.time} · {k.teacher} · solicitada em {fmtDate(e.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tag tone={e.status === "Aprovada" ? "success" : e.status === "Pendente" ? "warning" : "muted"}>{ENROLL_LABEL[e.status]}</Tag>
          {(e.status === "Pendente" || e.status === "Aprovada") && (
            <ConfirmCancel
              label={e.status === "Pendente" ? "Cancelar solicitação" : "Desistir da matrícula"}
              title={e.status === "Pendente" ? "Cancelar solicitação de matrícula?" : "Desistir da matrícula?"}
              text={`${c.name} — ${k.level}. O registro continua no seu histórico e a vaga é liberada.`}
              onConfirm={async () => { const err = await cancelEnrollment(e.id); if (!err) toast.success(e.status === "Pendente" ? "Solicitação cancelada." : "Matrícula cancelada."); return err; }}
            />
          )}
        </div>
      </Panel>
    );
  };
  return (
    <div className="space-y-3">
      {active.length ? active.map(row) : <EmptyState text="Nenhuma matrícula ativa." />}
      {past.length > 0 && <><h2 className="pt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Histórico</h2>{past.map(row)}</>}
    </div>
  );
}

function Reservas() {
  const user = useCurrentUser()!;
  const reservations = useStore((s) => s.reservations);
  const spaces = useStore((s) => s.spaces);
  const mine = reservations.filter((r) => r.userId === user.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (!mine.length) return <EmptyState text="Nenhuma reserva ainda. Consulte a página Espaços." />;
  const active = mine.filter((r) => r.status !== "Cancelada");
  const past = mine.filter((r) => r.status === "Cancelada");
  const row = (r: (typeof mine)[number]) => {
    const name = spaces.find((s) => s.id === r.spaceId)?.name;
    return (
      <Panel key={r.id} className={`flex flex-wrap items-center gap-4 p-4 ${r.status === "Cancelada" ? "opacity-70" : ""}`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-espacos-soft text-espacos"><DoorOpen className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy">{name}</p>
          <p className="text-sm text-muted-foreground">{fmtDate(r.date)} às {r.time} · {r.purpose}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tag tone={r.status === "Cancelada" ? "muted" : r.status === "Confirmada" ? "success" : "warning"}>{r.status}</Tag>
          {r.status !== "Cancelada" && (
            <ConfirmCancel label="Cancelar" title="Cancelar reserva?" text={`${name}, ${fmtDate(r.date)} às ${r.time}. O horário será liberado.`}
              onConfirm={async () => { const err = await cancelReservation(r.id); if (!err) toast.success("Reserva cancelada. O horário foi liberado."); return err; }} />
          )}
        </div>
      </Panel>
    );
  };
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reservas ativas</h2>
      {active.length ? active.map(row) : <EmptyState text="Nenhuma reserva ativa." />}
      {past.length > 0 && <><h2 className="pt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Canceladas</h2>{past.map(row)}</>}
    </div>
  );
}

function Colabs() {
  const user = useCurrentUser()!;
  const posts = useStore((s) => s.posts);
  const mine = posts.filter((p) => p.authorId === user.id);
  const [legacy, setLegacy] = useState<number>(0);
  useEffect(() => setLegacy(legacyPosts(user.id).length), [user.id]);
  const runImport = async () => {
    const r = await importLegacyPosts(user.id);
    if (r.error) return void toast.error(r.error);
    setLegacy(legacyPosts(user.id).length);
    toast.success(r.imported ? `${r.imported} publicação(ões) antigas salvas online.` : "Nada novo para importar — essas publicações já estavam salvas.");
  };
  const interested = posts.filter((p) => p.interested.includes(user.id));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-3 font-semibold">Minhas publicações</h2>
        {legacy > 0 && (
          <Panel className="mb-3 flex flex-wrap items-center gap-3 p-4 text-sm">
            <p className="flex-1">Encontramos {legacy} publicação(ões) suas guardadas só neste navegador, de antes do salvamento online.</p>
            <Button size="sm" variant="outline" onClick={runImport}>Salvar online</Button>
          </Panel>
        )}
        {!mine.length ? <EmptyState text="Você não criou publicações." /> : (
          <div className="space-y-3">
            {mine.map((p) => (
              <Panel key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-navy">{p.title}</p>
                  <Tag tone={p.interestCount ? "success" : "muted"}>{p.interestCount ?? 0} interessado(s)</Tag>
                </div>
                {!!p.interestedNames?.length && (
                  <p className="mt-2 text-sm text-muted-foreground">Interessados: {p.interestedNames.join(", ")}</p>
                )}
              </Panel>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="mb-3 font-semibold">Publicações em que demonstrei interesse</h2>
        {!interested.length ? <EmptyState text="Nenhuma manifestação de interesse ainda." /> : (
          <div className="space-y-3">
            {interested.map((p) => (
              <Panel key={p.id} className="flex items-center gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-colab-soft text-colab"><Users className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="font-medium text-navy">{p.title}</p><p className="text-sm text-muted-foreground">por {p.authorName} · {p.activity}</p></div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Notifs() {
  const user = useCurrentUser()!;
  const all = useStore((s) => s.notifications);
  const mine = all.filter((n) => n.userId === user.id);
  if (!mine.length) return <EmptyState text="Nenhuma notificação." />;
  return (
    <div className="space-y-2">
      {mine.some((n) => !n.read) && <Button variant="outline" size="sm" onClick={async () => { const e = await markRead(mine.filter((n) => !n.read).map((n) => n.id)); if (e) toast.error(e); }}>Marcar todas como lidas</Button>}
      {mine.map((n) => (
        <Panel key={n.id} className={`flex items-center gap-3 p-4 ${n.read ? "" : "border-primary/30 bg-accent/50"}`}>
          <Bell className={`h-4 w-4 shrink-0 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
          <p className="flex-1 text-sm">{n.text}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(n.createdAt)}</span>
          {n.read ? <span className="shrink-0 text-xs text-muted-foreground">Lida</span> : <Button variant="ghost" size="sm" onClick={async () => { const e = await markRead([n.id]); if (e) toast.error(e); }}>Marcar como lida</Button>}
        </Panel>
      ))}
    </div>
  );
}

function Dados() {
  const user = useCurrentUser()!;
  const [f, setF] = useState({ name: user.name, email: user.email, instrument: user.instrument ?? "", avatar: user.avatar });
  useEffect(() => setF({ name: user.name, email: user.email, instrument: user.instrument ?? "", avatar: user.avatar }), [user]);

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 1_000_000) return void toast.error("Escolha uma imagem de até 1 MB.");
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, avatar: String(r.result) }));
    r.readAsDataURL(file);
  };
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 3) return void toast.error("Informe seu nome completo.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return void toast.error("Informe um e-mail válido.");
    setSaving(true);
    const data = { name: f.name.trim(), instrument: f.instrument.trim() || undefined, avatar: f.avatar };
    const err = await saveProfile(user.id, data);
    if (err) { setSaving(false); return void toast.error("Não foi possível salvar. Tente novamente."); }
    actions.updateProfile(data);
    if (f.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const { error } = await supabase.auth.updateUser({ email: f.email.trim() }, { emailRedirectTo: window.location.origin });
      setSaving(false);
      if (error) return void toast.error(authErrorMessage(error));
      return void toast.success("Dados salvos! Confirme o novo e-mail pelo link que enviamos.");
    }
    setSaving(false);
    toast.success("Dados atualizados!");
  };

  return (
    <Panel className="max-w-xl">
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-4">
          <UserAvatar name={f.name || "?"} src={f.avatar} size={16} />
          <div className="flex gap-2">
            <label className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              Alterar foto<input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {f.avatar && <Button type="button" variant="ghost" size="sm" onClick={() => setF({ ...f, avatar: undefined })}>Remover</Button>}
          </div>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-navy">Nome<Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block space-y-1.5 text-sm font-medium text-navy">E-mail<Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="block space-y-1.5 text-sm font-medium text-navy">Instrumento de interesse (opcional)<Input value={f.instrument} onChange={(e) => setF({ ...f, instrument: e.target.value })} /></label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving} className="bg-navy text-navy-foreground hover:bg-navy/90">{saving ? "Salvando…" : "Salvar alterações"}</Button>
        </div>
      </form>
    </Panel>
  );
}
