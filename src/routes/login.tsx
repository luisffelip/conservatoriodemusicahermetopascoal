import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Lock, Mail, MailCheck, Music2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { authErrorMessage, syncUser, validateSignup } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Entre ou crie sua conta no sistema do Conservatório Hermeto Pascoal." },
      { property: "og:title", content: "Entrar — Conservatório Hermeto Pascoal" },
      { property: "og:description", content: "Acesse sua conta para matrículas, reservas e colaboração." },
    ],
  }),
  component: Login,
});

function Field({ icon: I, label, ...props }: { icon: typeof Mail; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-navy">
      {label}
      <span className="relative block">
        <I className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input {...props} className="h-11 pl-9" />
      </span>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.4-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.5 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.4 2.2 15 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.6 2.8c.9-2.6 3.4-4.5 6.3-4.5z" />
    </svg>
  );
}

type Mode = "login" | "signup" | "forgot" | "sent";

function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [sentText, setSentText] = useState("");
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const finish = () => {
    const back = sessionStorage.getItem("chp-redirect") || "/";
    sessionStorage.removeItem("chp-redirect");
    router.history.push(back);
  };

  // Already signed in (or just back from Google / Lovable sign-in): continue to where the user was going.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) { await syncUser(data.session.user); finish(); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (m: Mode) => { setMode(m); setError(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
        if (error) return setError(authErrorMessage(error));
        await syncUser(data.user);
        toast.success("Bem-vindo de volta!");
        finish();
      } else if (mode === "signup") {
        const invalid = validateSignup(f);
        if (invalid) return setError(invalid);
        const { data, error } = await supabase.auth.signUp({
          email: f.email.trim(),
          password: f.password,
          options: { emailRedirectTo: window.location.origin, data: { name: f.name.trim() } },
        });
        if (error) return setError(authErrorMessage(error));
        if (data.session) {
          await syncUser(data.user);
          toast.success("Conta criada com sucesso!");
          return finish();
        }
        setSentText(`Enviamos um link de confirmação para ${f.email.trim()}. Abra o e-mail e clique no link para ativar sua conta.`);
        go("sent");
      } else if (mode === "forgot") {
        if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setError("Informe um e-mail válido.");
        const { error } = await supabase.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) return setError(authErrorMessage(error));
        setSentText(`Se houver uma conta com ${f.email.trim()}, você receberá um link para criar uma nova senha.`);
        go("sent");
      }
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: "google" | "lovable") => {
    setError("");
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) return setError("Não foi possível entrar agora. Tente novamente.");
    if (result.redirected) return;
    const { data } = await supabase.auth.getUser();
    await syncUser(data.user);
    toast.success("Bem-vindo!");
    finish();
  };

  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const titles: Record<Mode, [string, string]> = {
    login: ["Bem-vindo de volta!", "Acesse sua conta para continuar."],
    signup: ["Criar conta", "Leva menos de um minuto."],
    forgot: ["Esqueceu a senha?", "Informe seu e-mail e enviaremos um link para criar uma nova."],
    sent: ["Verifique seu e-mail", ""],
  };

  return (
    <div className="grid min-h-screen bg-card lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" aria-label="Início"><Logo tone="dark" /></Link>
          <h1 className="mt-10 text-2xl font-bold">{titles[mode][0]}</h1>
          {titles[mode][1] && <p className="mt-1 text-sm text-muted-foreground">{titles[mode][1]}</p>}

          {mode === "sent" ? (
            <div className="mt-6 space-y-4">
              <div className="flex gap-3 rounded-lg bg-accent p-4 text-sm text-accent-foreground">
                <MailCheck className="h-5 w-5 shrink-0 text-primary" />
                <p>{sentText}</p>
              </div>
              <Button variant="outline" className="h-11 w-full" onClick={() => go("login")}>Voltar para entrar</Button>
            </div>
          ) : (
            <>
              {mode !== "forgot" && (
                <>
                  <div className="mt-6 grid gap-2">
                    <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={() => social("google")}><GoogleMark /> Continuar com Google</Button>
                    <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={() => social("lovable")}><Heart className="h-4 w-4 text-eventos" /> Continuar com Lovable</Button>
                  </div>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />ou com e-mail<span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}
              <form onSubmit={submit} className={`space-y-4 ${mode === "forgot" ? "mt-6" : ""}`}>
                {mode === "signup" && <Field icon={User} label="Nome completo" autoComplete="name" value={f.name} onChange={up("name")} />}
                <Field icon={Mail} label="E-mail" type="email" autoComplete="email" value={f.email} onChange={up("email")} />
                {mode !== "forgot" && <Field icon={Lock} label="Senha" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={up("password")} />}
                {mode === "signup" && <Field icon={Lock} label="Confirmar senha" type="password" autoComplete="new-password" value={f.confirm} onChange={up("confirm")} />}
                {mode === "login" && (
                  <button type="button" className="-mt-1 block text-sm font-medium text-primary hover:underline" onClick={() => go("forgot")}>Esqueci minha senha</button>
                )}
                {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={busy} className="h-11 w-full bg-navy text-navy-foreground hover:bg-navy/90">
                  {busy ? "Aguarde…" : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm">
                {mode === "forgot" ? (
                  <button className="font-medium text-primary underline" onClick={() => go("login")}>Voltar para entrar</button>
                ) : (
                  <>
                    {mode === "login" ? "Não tem uma conta? " : "Já tem conta? "}
                    <button className="font-medium text-primary underline" onClick={() => go(mode === "login" ? "signup" : "login")}>
                      {mode === "login" ? "Cadastre-se" : "Entrar"}
                    </button>
                  </>
                )}
              </p>
            </>
          )}
          <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:underline">Voltar ao início</Link>
        </div>
      </div>
      <div aria-hidden className="relative hidden overflow-hidden bg-navy lg:block">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-formacao" />
        <div className="absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-espacos" />
        <div className="absolute bottom-[-6rem] right-10 h-72 w-72 rounded-full bg-colab" />
        <div className="absolute bottom-24 left-16 h-32 w-32 rounded-full bg-eventos" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-40 w-40 place-items-center rounded-3xl bg-navy text-navy-foreground shadow-card">
            <Music2 className="h-20 w-20" />
          </div>
        </div>
        <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-navy-foreground/70">Protótipo acadêmico com dados demonstrativos.</p>
      </div>
    </div>
  );
}
