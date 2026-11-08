import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Bell, CalendarDays, DoorOpen, GraduationCap, Home, LogIn, LogOut, Menu, Music2, User, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { actions, fmtDate, useCurrentUser, useStore } from "@/lib/store";
import { UserAvatar } from "./ui-kit";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/formacao", label: "Formação", icon: GraduationCap },
  { to: "/espacos", label: "Espaços", icon: DoorOpen },
  { to: "/colaboracao", label: "Colaboração", icon: Users },
  { to: "/eventos", label: "Eventos", icon: CalendarDays },
  { to: "/minha-area", label: "Minha área", icon: User },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Music2 className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg text-sidebar-accent-foreground">Hermeto Pascoal</div>
        <div className="text-xs text-sidebar-foreground/70">Conservatório · Arapiraca</div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const user = useCurrentUser();
  const navigate = useNavigate();
  return (
    <div className="staff-lines flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Brand />
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        {user ? (
          <button
            onClick={() => { actions.logout(); onNavigate?.(); navigate({ to: "/login" }); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        ) : (
          <Link to="/login" onClick={onNavigate} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogIn className="h-4 w-4" /> Entrar
          </Link>
        )}
      </div>
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
    <Popover onOpenChange={(o) => !o && unread && actions.markNotificationsRead()}>
      <PopoverTrigger aria-label="Notificações" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted">
        <Bell className="h-5 w-5 text-navy" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold text-navy">Notificações</div>
        <div className="max-h-80 overflow-auto">
          {mine.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma notificação.</p>}
          {mine.slice(0, 8).map((n) => (
            <div key={n.id} className={`border-b px-4 py-3 text-sm last:border-0 ${n.read ? "" : "bg-warning/50"}`}>
              <p>{n.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">{fmtDate(n.createdAt)}</p>
            </div>
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <NavList />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <NavList onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur md:px-8">
          <button aria-label="Abrir menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-muted lg:hidden">
            <Menu className="h-5 w-5 text-navy" />
          </button>
          <span className="font-display text-lg text-navy">Conservatório Hermeto Pascoal</span>
          <div className="ml-auto flex items-center gap-2">
            <Notifications />
            {user ? (
              <Link to="/minha-area" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-muted">
                <UserAvatar name={user.name} src={user.avatar} />
                <span className="hidden text-sm font-medium text-navy sm:inline">{user.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link to="/login" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Entrar</Link>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
        <footer className="px-8 pb-6 text-center text-xs text-muted-foreground">
          Protótipo acadêmico (IHC) com dados demonstrativos. As regras apresentadas não são oficiais do conservatório.
        </footer>
      </div>
    </div>
  );
}
