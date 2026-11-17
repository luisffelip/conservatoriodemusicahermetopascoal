import { markRead } from "@/lib/records";
import { toast } from "sonner";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Bell, CalendarDays, DoorOpen, GraduationCap, Home, LogIn, LogOut, Menu, Music2, Search, ShieldCheck, User, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fmtDate, useCurrentUser, useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "./ui-kit";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/formacao", label: "Formação", icon: GraduationCap },
  { to: "/espacos", label: "Espaços", icon: DoorOpen },
  { to: "/colaboracao", label: "Colaboração", icon: Users },
  { to: "/eventos", label: "Eventos", icon: CalendarDays },
  { to: "/minha-area", label: "Minha área", icon: User },
] as const;

export function Logo({ tone = "light", compact = false }: { tone?: "light" | "dark"; compact?: boolean }) {
  const light = tone === "light";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${light ? "bg-navy-foreground text-navy" : "bg-navy text-navy-foreground"}`}>
        <Music2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className={`truncate font-display text-[13px] font-bold ${light ? "text-navy-foreground" : "text-navy"}`}>Conservatório</div>
        <div className={`truncate font-display text-[13px] font-bold ${light ? "text-navy-foreground" : "text-navy"}`}>Hermeto Pascoal</div>
        {!compact && <div className={`truncate text-[11px] ${light ? "text-sidebar-foreground/70" : "text-muted-foreground"}`}>Arapiraca · AL</div>}
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const user = useCurrentUser();
  const isAdmin = useStore((s) => !!s.isAdmin);
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-5"><Logo /></div>
      <nav aria-label="Menu principal" className="flex-1 space-y-1 px-3 pt-2">
        {NAV.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
            >
              <n.icon className="h-[18px] w-[18px] shrink-0" />
              {n.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link to="/responsavel" onClick={onNavigate} aria-current={path.startsWith("/responsavel") ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${path.startsWith("/responsavel") ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
            <ShieldCheck className="h-[18px] w-[18px] shrink-0" /> Responsável
          </Link>
        )}
      </nav>
      <Link to="/privacidade" onClick={onNavigate} className="px-6 pb-2 text-xs text-sidebar-foreground/70 hover:underline">Política de Privacidade</Link>
      <div className="border-t border-sidebar-border p-3">
        {user ? (
          <div className="space-y-1">
            <Link to="/minha-area" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent">
              <UserAvatar name={user.name} src={user.avatar} className="bg-sidebar-primary text-sidebar-primary-foreground" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</span>
                <span className="block truncate text-xs text-sidebar-foreground/70">{user.email}</span>
              </span>
            </Link>
            <button
              onClick={async () => { onNavigate?.(); await supabase.auth.signOut(); navigate({ to: "/login", replace: true }); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" /> Sair da conta
            </button>
          </div>
        ) : (
          <Link to="/login" onClick={onNavigate} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogIn className="h-4 w-4" /> Entrar
          </Link>
        )}
      </div>
    </div>
  );
}

/** Header search over courses, spaces and events; each result opens its page. */
function QuickSearch() {
  const courses = useStore((s) => s.courses);
  const spaces = useStore((s) => s.spaces);
  const events = useStore((s) => s.events);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const term = q.toLowerCase().trim();
  const results = !term ? [] : [
    ...courses.filter((c) => c.name.toLowerCase().includes(term)).map((c) => ({ key: `c-${c.id}`, label: c.name, kind: "Curso", to: "/formacao/$id" as const, id: c.id })),
    ...spaces.filter((s) => s.name.toLowerCase().includes(term)).map((s) => ({ key: `s-${s.id}`, label: s.name, kind: "Espaço", to: "/espacos/$id" as const, id: s.id })),
    ...events.filter((e) => e.name.toLowerCase().includes(term)).map((e) => ({ key: `e-${e.id}`, label: e.name, kind: "Evento", to: "/eventos/$id" as const, id: e.id })),
  ].slice(0, 8);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        aria-label="Buscar cursos, espaços e eventos"
        placeholder="Buscar cursos, espaços ou eventos..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="h-10 w-full rounded-lg border border-input bg-muted pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card"
      />
      {focused && term && (
        <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border bg-popover shadow-card">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nada encontrado para “{q}”.</p>
          ) : results.map((r) => (
            <Link key={r.key} to={r.to} params={{ id: r.id }} onClick={() => setQ("")} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted">
              <span className="truncate font-medium text-navy">{r.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{r.kind}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const user = useCurrentUser();
  const all = useStore((s) => s.notifications);
  if (!user) return null;
  const mine = all.filter((n) => n.userId === user.id);
  const unread = mine.filter((n) => !n.read).length;
  return (
    <Popover>
      <PopoverTrigger aria-label="Notificações" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-muted">
        <Bell className="h-5 w-5 text-navy" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold text-navy">Notificações</span>
          {unread > 0 && <button className="text-xs font-medium text-primary hover:underline" onClick={() => void markRead(mine.filter((n) => !n.read).map((n) => n.id)).then((e) => e && toast.error(e))}>Marcar todas como lidas</button>}
        </div>
        <div className="max-h-80 overflow-auto">
          {mine.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma notificação.</p>}
          {mine.slice(0, 8).map((n) => (
            <button key={n.id} type="button" disabled={n.read} onClick={() => void markRead([n.id]).then((e) => e && toast.error(e))}
              className={`flex w-full gap-2 border-b px-4 py-3 text-left text-sm last:border-0 ${n.read ? "text-muted-foreground" : "bg-accent/60 font-medium hover:bg-accent"}`}>
              <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`} />
              <span className="flex-1">
                <span className="block">{n.text}</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">{fmtDate(n.createdAt)}{n.read ? " · lida" : " · toque para marcar como lida"}</span>
              </span>
            </button>
          ))}
        </div>
        <Link to="/minha-area" className="block border-t px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-muted">Ver todas</Link>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 lg:block">
        <NavList />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <NavList onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-card">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <button aria-label="Abrir menu" onClick={() => setOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg hover:bg-muted lg:hidden">
              <Menu className="h-5 w-5 text-navy" />
            </button>
            <Link to="/" className="shrink-0 lg:hidden" aria-label="Início"><Logo tone="dark" compact /></Link>
            <div className="hidden flex-1 md:block"><QuickSearch /></div>
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <Notifications />
              {user ? (
                <Link to="/minha-area" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 hover:bg-muted sm:pr-3">
                  <UserAvatar name={user.name} src={user.avatar} />
                  <span className="hidden text-sm font-medium text-navy sm:inline">{user.name.split(" ")[0]}</span>
                </Link>
              ) : (
                <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy/90">
                  <LogIn className="h-4 w-4" /> Entrar
                </Link>
              )}
            </div>
          </div>
          <div className="px-4 pb-3 md:hidden"><QuickSearch /></div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <footer className="px-8 pb-6 text-center text-xs text-muted-foreground">
          Protótipo acadêmico (IHC) com dados demonstrativos. As regras apresentadas não são oficiais do conservatório.
        </footer>
      </div>
    </div>
  );
}
