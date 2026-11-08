import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Info, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel, Tag, useAuthGuard } from "@/components/ui-kit";
import { SpaceIcon } from "@/components/space-icon";
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
      <Link to="/espacos" className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar aos espaços</Link>
      <Panel className="mb-6 flex flex-col gap-6 md:flex-row">
        <div className="grid h-36 w-full shrink-0 place-items-center rounded-lg bg-beige text-navy md:w-48"><SpaceIcon id={id} className="h-14 w-14" /></div>
        <div className="flex-1">
          <Tag tone="muted">{space.type}</Tag>
          <h1 className="mt-2 font-display text-3xl">{space.name}</h1>
          <p className="mt-2 text-muted-foreground">{space.description}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Capacidade: {space.capacity}</p>
            <p>Finalidade: {space.purpose}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{space.resources.map((r) => <Tag key={r}>{r}</Tag>)}</div>
          {!step && <Button className="mt-5" onClick={start}>Consultar disponibilidade</Button>}
        </div>
      </Panel>

      {step && (
        <Panel>
          <h2 className="text-xl font-semibold">Solicitar reserva</h2>
          <div className="mt-5 grid gap-6 lg:grid-cols-[260px_1fr]">
            <div>
              <label className="text-sm font-medium text-navy" htmlFor="date">1. Escolha a data</label>
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
                          className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors ${busy ? "cursor-not-allowed bg-muted text-muted-foreground line-through" : sel ? "border-primary bg-primary text-primary-foreground" : "border-success-foreground/30 bg-success text-success-foreground hover:border-primary"}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-success" /> Disponível</span>
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
                <button key={p} onClick={() => setPurpose(p)} className={`flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm ${purpose === p ? "border-primary bg-accent text-navy" : "hover:bg-muted"}`}>
                  {purpose === p && <Check className="h-3.5 w-3.5" />}{p}
                </button>
              ))}
            </div>
            {purpose === "Outra atividade" && <Input className="mt-3 max-w-md" placeholder="Descreva a atividade" value={other} onChange={(e) => setOther(e.target.value)} />}
          </div>
          <Button className="mt-6" onClick={review}>Revisar e confirmar</Button>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5" /> As condições de utilização dependem das regras administrativas do conservatório.</p>
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
              <CheckCircle2 className="mx-auto h-12 w-12 text-success-foreground" />
              <DialogTitle className="mt-3 text-xl">Solicitação de reserva realizada com sucesso!</DialogTitle>
              <p className="mt-2 text-muted-foreground">{space.name} · {fmtDate(date)}</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" onClick={() => setConfirming(false)}>Fechar</Button>
                <Button asChild><Link to="/minha-area">Ver minhas reservas</Link></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
