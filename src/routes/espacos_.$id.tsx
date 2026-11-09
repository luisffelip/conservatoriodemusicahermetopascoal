import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarDays, Check, Info, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel, Tag, useAuthGuard } from "@/components/ui-kit";
import { SpacePhoto } from "@/components/space-icon";
import { actions, fmtDate, useStore } from "@/lib/store";
import { createSeed, SLOTS } from "@/lib/seed";

export const Route = createFileRoute("/espacos_/$id")({
  loader: ({ params }) => {
    const s = createSeed().spaces.find((x) => x.id === params.id);
    if (!s) throw notFound();
    return { name: s.name, description: s.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Espaço"} — Conservatório Hermeto Pascoal` },
      { name: "description", content: loaderData?.description ?? "Detalhes do espaço." },
      { property: "og:title", content: loaderData?.name ?? "Espaço" },
      { property: "og:description", content: loaderData?.description ?? "" },
    ],
  }),
  component: SpaceDetail,
});

const PURPOSES = ["Estudo individual", "Ensaio musical", "Gravação", "Outra atividade"];
const today = () => new Date().toISOString().slice(0, 10);

function SpaceDetail() {
  const { id } = Route.useParams();
  const space = useStore((s) => s.spaces).find((x) => x.id === id)!;
  const reservations = useStore((s) => s.reservations);
  const guard = useAuthGuard();
  const [step, setStep] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [other, setOther] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const taken = new Set(reservations.filter((r) => r.spaceId === id && r.date === date && r.status !== "Cancelada").map((r) => r.time));
  const finalPurpose = purpose === "Outra atividade" ? other.trim() || "Outra atividade" : purpose;

  const start = () => { if (guard(`/espacos/${id}`)) setStep(true); };
  const review = () => {
    if (!date || !time || !purpose) return void toast.error("Selecione data, horário e finalidade.");
    if (date < today()) return void toast.error("Escolha uma data a partir de hoje.");
    setDone(false);
    setConfirming(true);
  };
  const confirm = () => {
    const err = actions.reserve(id, date, time, finalPurpose);
    if (err) { toast.error(err); setConfirming(false); setTime(""); return; }
    setDone(true);
    setTime("");
  };

  return (
    <div>
      <Link to="/espacos" className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar aos espaços</Link>
      <h1 className="mb-4 text-2xl font-bold md:text-3xl">{space.name}</h1>
      <Panel className="mb-5 grid gap-5 md:grid-cols-[minmax(0,320px)_1fr]">
        <SpacePhoto id={id} name={space.name} className="aspect-[4/3] w-full rounded-lg" />
        <div className="min-w-0">
          <Tag tone="muted">{space.type}</Tag>
          <h2 className="mt-3 text-sm font-semibold text-navy">Descrição</h2>
          <p className="mt-1 text-muted-foreground">{space.description}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-espacos" /> <b className="font-semibold text-navy">Capacidade:</b> {space.capacity}</p>
            <p className="flex items-start gap-2"><Wrench className="mt-0.5 h-4 w-4 shrink-0 text-espacos" /> <span><b className="font-semibold text-navy">Equipamentos:</b> {space.resources.join(", ")}</span></p>
            <p className="pl-6 text-muted-foreground">Finalidade: {space.purpose}</p>
          </div>
          {!step && <Button className="mt-5 bg-navy text-navy-foreground hover:bg-navy/90" onClick={start}>Consultar disponibilidade</Button>}
        </div>
      </Panel>

      {step && (
        <Panel>
          <h2 className="text-lg font-bold">Disponibilidade</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-[240px_1fr]">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-navy" htmlFor="date"><CalendarDays className="h-4 w-4" /> 1. Escolha a data</label>
              <Input id="date" type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="mt-2" />
            </div>
            <div>
              <p className="text-sm font-medium text-navy">2. Selecione o horário</p>
              {!date ? <p className="mt-2 text-sm text-muted-foreground">Escolha uma data para ver os horários.</p> : (
                <>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {SLOTS.map((t) => {
                      const busy = taken.has(t);
                      const sel = time === t;
                      return (
                        <button
                          key={t}
                          disabled={busy}
                          onClick={() => setTime(t)}
                          aria-label={`${t} ${busy ? "indisponível" : "disponível"}`}
                          aria-pressed={sel}
                          className={`rounded-lg border px-2 py-2.5 text-sm font-semibold transition-colors ${busy ? "cursor-not-allowed bg-muted text-muted-foreground line-through" : sel ? "border-navy bg-navy text-navy-foreground" : "bg-card text-navy hover:border-primary hover:bg-accent"}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border bg-card" /> Disponível</span>
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-navy" /> Selecionado</span>
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted" /> Indisponível</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium text-navy">3. Finalidade da utilização</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <button key={p} onClick={() => setPurpose(p)} aria-pressed={purpose === p} className={`flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm ${purpose === p ? "border-primary bg-accent font-medium text-navy" : "bg-card hover:bg-muted"}`}>
                  {purpose === p && <Check className="h-3.5 w-3.5" />}{p}
                </button>
              ))}
            </div>
            {purpose === "Outra atividade" && <Input className="mt-3 max-w-md" placeholder="Descreva a atividade" value={other} onChange={(e) => setOther(e.target.value)} />}
          </div>
          <Button className="mt-6 w-full bg-navy text-navy-foreground hover:bg-navy/90 sm:w-auto sm:px-10" onClick={review}>Reservar espaço</Button>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> As condições de utilização dependem das regras administrativas do conservatório.</p>
        </Panel>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          {!done ? (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar solicitação de reserva</DialogTitle>
                <DialogDescription>Verifique os dados antes de confirmar.</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-muted p-4 text-sm">
                <dt className="text-muted-foreground">Espaço</dt><dd className="font-medium">{space.name}</dd>
                <dt className="text-muted-foreground">Data</dt><dd>{fmtDate(date)}</dd>
                <dt className="text-muted-foreground">Horário</dt><dd>{time}</dd>
                <dt className="text-muted-foreground">Finalidade</dt><dd>{finalPurpose}</dd>
              </dl>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirming(false)}>Voltar</Button>
                <Button onClick={confirm}>Confirmar reserva</Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-4 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-espacos text-module-foreground"><Check className="h-8 w-8" strokeWidth={3} /></span>
              <DialogTitle className="mt-4 text-xl">Solicitação de reserva realizada com sucesso!</DialogTitle>
              <p className="mt-2 text-muted-foreground">{space.name} · {fmtDate(date)}</p>
              <div className="mt-6 flex flex-col items-center gap-2">
                <Button className="bg-navy text-navy-foreground hover:bg-navy/90" onClick={() => setConfirming(false)}>Fechar</Button>
                <Link to="/minha-area" className="text-sm font-medium text-primary underline">Ver minhas reservas</Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
