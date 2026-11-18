import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail, MailCheck, Music2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { authErrorMessage, syncUser, usesManagedOAuth, validateSignup } from "@/lib/auth";

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
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

  // Already signed in (or just back from Google sign-in): continue to where the user was going.
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

  const google = async () => {
    setError("");
    if (!usesManagedOAuth(window.location.hostname)) {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
      if (error) setError("Não foi possível entrar com Google agora. Tente novamente.");
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
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
                    <Button type="button" variant="outline" className="h-11 w-full gap-2.5 border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#F2F2F2] hover:text-[#1F1F1F]" onClick={google}><GoogleMark /> Continuar com Google</Button>
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
