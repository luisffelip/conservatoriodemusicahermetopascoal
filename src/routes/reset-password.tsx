import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, validateNewPassword } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Crie uma nova senha para sua conta no Conservatório Hermeto Pascoal." },
      { property: "og:title", content: "Nova senha — Conservatório Hermeto Pascoal" },
      { property: "og:description", content: "Crie uma nova senha para sua conta." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [f, setF] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => setReady((r) => r || (isRecovery || !!s.session)));
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validateNewPassword(f.password, f.confirm);
    if (invalid) return setError(invalid);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: f.password });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    toast.success("Senha atualizada!");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-card p-6">
      <div className="w-full max-w-sm">
        <Link to="/" aria-label="Início"><Logo tone="dark" /></Link>
        <h1 className="mt-10 text-2xl font-bold">Criar nova senha</h1>
        {ready === false ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Este link é inválido ou expirou. Peça um novo link na tela de entrada.</p>
            <Button asChild className="h-11 w-full bg-navy text-navy-foreground hover:bg-navy/90"><Link to="/login">Ir para entrar</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {(["password", "confirm"] as const).map((k) => (
              <label key={k} className="block space-y-1.5 text-sm font-medium text-navy">
                {k === "password" ? "Nova senha" : "Confirmar nova senha"}
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" autoComplete="new-password" className="h-11 pl-9" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
                </span>
              </label>
            ))}
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || ready === null} className="h-11 w-full bg-navy text-navy-foreground hover:bg-navy/90">{busy ? "Aguarde…" : "Salvar nova senha"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
