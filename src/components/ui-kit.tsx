import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Drum, Guitar, KeyboardMusic, Mic, Music, Piano, Wind } from "lucide-react";
import { getState } from "@/lib/store";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-5 shadow-card ${className}`}>{children}</div>;
}

const tones = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
  info: "bg-accent text-accent-foreground",
  danger: "bg-destructive/10 text-destructive",
};
export function Tag({ tone = "info", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function UserAvatar({ name, src, size = 8 }: { name: string; src?: string | undefined; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const cls = size === 8 ? "h-8 w-8 text-xs" : "h-16 w-16 text-lg";
  return src ? (
    <img src={src} alt={name} className={`${cls} rounded-full object-cover`} />
  ) : (
    <span className={`${cls} grid place-items-center rounded-full bg-navy font-semibold text-navy-foreground`}>{initials}</span>
  );
}

const ICONS: Record<string, typeof Music> = { piano: Piano, teclado: KeyboardMusic, violao: Guitar, guitarra: Guitar, violino: Music, bateria: Drum, canto: Mic, flauta: Wind };
export function CourseIcon({ id, className = "h-6 w-6" }: { id: string; className?: string }) {
  const I = ICONS[id] ?? Music;
  return <I className={className} />;
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
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

export function DateBadge({ date }: { date: string }) {
  const [, m, d] = date.split("-");
  return (
    <div className="grid h-16 w-16 shrink-0 place-content-center rounded-lg bg-navy text-center text-navy-foreground">
      <span className="font-display text-2xl leading-none">{d}</span>
      <span className="text-xs tracking-wider">{MONTHS[Number(m) - 1]}</span>
    </div>
  );
}

