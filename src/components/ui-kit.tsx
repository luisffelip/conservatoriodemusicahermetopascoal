import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CalendarDays, DoorOpen, Drum, GraduationCap, Guitar, KeyboardMusic, Mic, Music, Piano, Users, Wind } from "lucide-react";
import { getState } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Visual identity of each module: solid color, soft tint and icon. */
export const MODULES = {
  formacao: { label: "Formação", icon: GraduationCap, solid: "bg-formacao text-module-foreground", soft: "bg-formacao-soft text-formacao", text: "text-formacao" },
  espacos: { label: "Espaços", icon: DoorOpen, solid: "bg-espacos text-module-foreground", soft: "bg-espacos-soft text-espacos", text: "text-espacos" },
  colab: { label: "Colaboração", icon: Users, solid: "bg-colab text-module-foreground", soft: "bg-colab-soft text-colab", text: "text-colab" },
  eventos: { label: "Eventos", icon: CalendarDays, solid: "bg-eventos text-module-foreground", soft: "bg-eventos-soft text-eventos", text: "text-eventos" },
} as const;
export type ModuleKey = keyof typeof MODULES;

export function PageHeader({ title, subtitle, action, module }: { title: string; subtitle?: string; action?: ReactNode; module?: ModuleKey }) {
  const m = module ? MODULES[module] : null;
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {m && <span className={`hidden h-11 w-11 shrink-0 place-items-center rounded-xl sm:grid ${m.soft}`}><m.icon className="h-5 w-5" /></span>}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold md:text-[1.75rem]">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-card p-5 shadow-card", className)}>{children}</div>;
}

const tones = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
  info: "bg-accent text-accent-foreground",
  danger: "bg-destructive/10 text-destructive",
};
export function Tag({ tone = "info", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

/** Pill-style single-choice filter used across listing pages. */
export function FilterPills<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${value === o ? "bg-navy text-navy-foreground" : "border bg-card text-foreground hover:bg-muted"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function UserAvatar({ name, src, size = 8, className = "" }: { name: string; src?: string | undefined; size?: number; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const cls = size === 8 ? "h-8 w-8 text-xs" : size === 10 ? "h-10 w-10 text-sm" : "h-16 w-16 text-lg";
  return src ? (
    <img src={src} alt={name} className={cn(cls, "shrink-0 rounded-full object-cover", className)} />
  ) : (
    <span className={cn(cls, "grid shrink-0 place-items-center rounded-full bg-navy font-semibold text-navy-foreground", className)}>{initials}</span>
  );
}

const ICONS: Record<string, typeof Music> = { piano: Piano, teclado: KeyboardMusic, violao: Guitar, guitarra: Guitar, violino: Music, bateria: Drum, canto: Mic, flauta: Wind };
export function CourseIcon({ id, className = "h-6 w-6" }: { id: string; className?: string }) {
  const I = ICONS[id] ?? Music;
  return <I className={className} />;
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">{text}</p>;
}

/** Returns a guard: true when logged in; otherwise sends the user to the login page and returns to `back` after. */
export function useAuthGuard() {
  const navigate = useNavigate();
  return (back: string) => {
    if (getState().currentUserId) return true;
    sessionStorage.setItem("chp-redirect", back);
    navigate({ to: "/login" });
    return false;
  };
}

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function DateBadge({ date, size = "md" }: { date: string; size?: "sm" | "md" }) {
  const [, m, d] = date.split("-");
  const box = size === "sm" ? "h-12 w-12" : "h-16 w-16";
  const num = size === "sm" ? "text-lg" : "text-2xl";
  return (
    <div className={`grid ${box} shrink-0 place-content-center rounded-xl bg-eventos-soft text-center text-eventos`}>
      <span className={`font-display ${num} font-bold leading-none`}>{d}</span>
      <span className="text-[10px] font-semibold tracking-wider">{MONTHS[Number(m) - 1]}</span>
    </div>
  );
}
