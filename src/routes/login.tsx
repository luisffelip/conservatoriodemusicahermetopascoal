import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Music2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="staff-lines hidden flex-col justify-between bg-navy p-12 text-navy-foreground lg:flex">
        <div className="flex items-center gap-3"><Music2 className="h-6 w-6" /><span className="font-display text-xl">Hermeto Pascoal</span></div>
        <div>
          <h1 className="font-display text-4xl text-navy-foreground">Conservatório de Música Hermeto Pascoal</h1>
          <p className="mt-4 max-w-md text-navy-foreground/80">Formação musical, espaços para praticar e colaboração entre músicos em Arapiraca, Alagoas.</p>
        </div>
        <p className="text-xs text-navy-foreground/60">Protótipo acadêmico com dados demonstrativos.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Acesse sua conta para continuar." : "Leva menos de um minuto."}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && <label className="block space-y-1.5 text-sm font-medium text-navy">Nome completo<Input value={f.name} onChange={up("name")} /></label>}
            <label className="block space-y-1.5 text-sm font-medium text-navy">E-mail<Input type="email" value={f.email} onChange={up("email")} /></label>
            <label className="block space-y-1.5 text-sm font-medium text-navy">Senha<Input type="password" value={f.password} onChange={up("password")} /></label>
            {mode === "signup" && <label className="block space-y-1.5 text-sm font-medium text-navy">Confirmar senha<Input type="password" value={f.confirm} onChange={up("confirm")} /></label>}
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">{mode === "login" ? "Entrar" : "Criar conta"}</Button>
          </form>
          <p className="mt-4 text-center text-sm">
            {mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
            <button className="font-medium text-primary hover:underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
              {mode === "login" ? "Criar conta" : "Entrar"}
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
    </div>
  );
}
