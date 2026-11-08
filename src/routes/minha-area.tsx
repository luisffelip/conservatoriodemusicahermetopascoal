import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, Panel, Tag, UserAvatar } from "@/components/ui-kit";
import { actions, fmtDate, useCurrentUser, useStore } from "@/lib/store";

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

function MinhaArea() {
  const user = useCurrentUser();
  if (!user) {
    return (
      <div>
        <PageHeader title="Minha área" />
        <Panel className="text-center">
          <p className="text-muted-foreground">Entre na sua conta para acompanhar matrículas, reservas e colaborações.</p>
          <Button asChild className="mt-4"><Link to="/login">Entrar</Link></Button>
        </Panel>
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Minha área" subtitle={`Acompanhe suas atividades, ${user.name.split(" ")[0]}.`} />
      <Tabs defaultValue="matriculas">
        <TabsList className="mb-6 flex h-auto flex-wrap justify-start">
          <TabsTrigger value="matriculas">Matrículas</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="colab">Colaborações</TabsTrigger>
          <TabsTrigger value="notif">Notificações</TabsTrigger>
          <TabsTrigger value="dados">Dados pessoais</TabsTrigger>
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

function Matriculas() {
  const user = useCurrentUser()!;
  const enrollments = useStore((s) => s.enrollments);
  const classes = useStore((s) => s.classes);
  const courses = useStore((s) => s.courses);
  const mine = enrollments.filter((e) => e.userId === user.id);
  if (!mine.length) return <EmptyState text="Você ainda não solicitou matrículas. Explore a página Formação." />;
  return (
    <div className="space-y-3">
      {mine.map((e) => {
        const k = classes.find((x) => x.id === e.classId)!;
        const c = courses.find((x) => x.id === k.courseId)!;
        return (
          <Panel key={e.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-semibold text-navy">Curso de {c.name}</p>
              <p className="text-sm text-muted-foreground">Instrumento: {c.name} · Turma: {k.level} · {k.teacher} · {k.days} {k.time}</p>
            </div>
            <Tag tone={e.status === "Aprovada" ? "success" : "warning"}>{e.status}</Tag>
          </Panel>
        );
      })}
    </div>
  );
}

function Reservas() {
  const user = useCurrentUser()!;
  const reservations = useStore((s) => s.reservations);
  const spaces = useStore((s) => s.spaces);
  const mine = reservations.filter((r) => r.userId === user.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (!mine.length) return <EmptyState text="Nenhuma reserva ainda. Consulte a página Espaços." />;
  return (
    <div className="space-y-3">
      {mine.map((r) => (
        <Panel key={r.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-semibold text-navy">{spaces.find((s) => s.id === r.spaceId)?.name}</p>
            <p className="text-sm text-muted-foreground">{fmtDate(r.date)} às {r.time} · {r.purpose}</p>
          </div>
          <Tag tone={r.status === "Cancelada" ? "muted" : r.status === "Confirmada" ? "success" : "warning"}>{r.status}</Tag>
          {r.status !== "Cancelada" && (
            <Button variant="outline" size="sm" onClick={() => { actions.cancelReservation(r.id); toast.success("Reserva cancelada. O horário foi liberado."); }}>Cancelar</Button>
          )}
        </Panel>
      ))}
    </div>
  );
}

function Colabs() {
  const user = useCurrentUser()!;
  const posts = useStore((s) => s.posts);
  const users = useStore((s) => s.users);
  const mine = posts.filter((p) => p.authorId === user.id);
  const interested = posts.filter((p) => p.interested.includes(user.id));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-3 font-semibold">Minhas publicações</h2>
        {!mine.length ? <EmptyState text="Você não criou publicações." /> : (
          <div className="space-y-3">
            {mine.map((p) => (
              <Panel key={p.id}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-navy">{p.title}</p>
                  <Tag tone={p.interested.length ? "success" : "muted"}>{p.interested.length} interessado(s)</Tag>
                </div>
                {p.interested.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">Interessados: {p.interested.map((id) => users.find((u) => u.id === id)?.name).join(", ")}</p>
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
              <Panel key={p.id}><p className="font-medium text-navy">{p.title}</p><p className="text-sm text-muted-foreground">por {p.authorName} · {p.activity}</p></Panel>
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
      {mine.some((n) => !n.read) && <Button variant="outline" size="sm" onClick={actions.markNotificationsRead}>Marcar todas como lidas</Button>}
      {mine.map((n) => (
        <Panel key={n.id} className={`flex items-center gap-3 ${n.read ? "" : "bg-warning/40"}`}>
          <p className="flex-1 text-sm">{n.text}</p>
          <span className="text-xs text-muted-foreground">{fmtDate(n.createdAt)}</span>
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
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 3) return void toast.error("Informe seu nome completo.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return void toast.error("Informe um e-mail válido.");
    actions.updateProfile({ name: f.name.trim(), email: f.email.trim(), instrument: f.instrument.trim() || undefined, avatar: f.avatar });
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
          <Button type="submit">Salvar alterações</Button>
          <Button type="button" variant="ghost" onClick={() => { actions.resetDemo(); toast.success("Dados de demonstração restaurados."); }}>Restaurar dados de demonstração</Button>
        </div>
      </form>
    </Panel>
  );
}
