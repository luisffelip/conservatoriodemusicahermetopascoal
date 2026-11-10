import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, Music2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/AppShell";
import { actions } from "@/lib/store";

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

function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  const finish = () => {
    const back = sessionStorage.getItem("chp-redirect") || "/";
    sessionStorage.removeItem("chp-redirect");
    router.history.push(back);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      const err = actions.login(f.email, f.password);
      if (err) return setError(err);
      toast.success("Bem-vindo de volta!");
    } else {
      if (f.name.trim().length < 3) return setError("Informe seu nome completo.");
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError("Informe um e-mail válido.");
      if (f.password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");
      if (f.password !== f.confirm) return setError("As senhas não coincidem.");
      const err = actions.register(f.name, f.email, f.password);
      if (err) return setError(err);
      toast.success("Conta criada com sucesso!");
    }
    finish();
  };
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid min-h-screen bg-card lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" aria-label="Início"><Logo tone="dark" /></Link>
          <h1 className="mt-10 text-2xl font-bold">{mode === "login" ? "Bem-vindo de volta!" : "Criar conta"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Acesse sua conta para continuar." : "Leva menos de um minuto."}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && <Field icon={User} label="Nome completo" value={f.name} onChange={up("name")} />}
            <Field icon={Mail} label="E-mail" type="email" value={f.email} onChange={up("email")} />
            <Field icon={Lock} label="Senha" type="password" value={f.password} onChange={up("password")} />
            {mode === "signup" && <Field icon={Lock} label="Confirmar senha" type="password" value={f.confirm} onChange={up("confirm")} />}
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-11 w-full bg-navy text-navy-foreground hover:bg-navy/90">{mode === "login" ? "Entrar" : "Criar conta"}</Button>
          </form>
          <p className="mt-4 text-center text-sm">
            {mode === "login" ? "Não tem uma conta? " : "Já tem conta? "}
            <button className="font-medium text-primary underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
          {mode === "login" && (
            <div className="mt-6 rounded-lg bg-warning p-3 text-xs text-warning-foreground">
              Conta de demonstração: <b>joao@demo.com</b> / <b>123456</b>
              <button className="ml-2 underline" onClick={() => setF({ ...f, email: "joao@demo.com", password: "123456" })}>preencher</button>
            </div>
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
