import { Armchair, DoorClosed, Drum, Mic2, Presentation, Theater } from "lucide-react";

const MAP = { individual: DoorClosed, ensaio: Drum, estudio: Mic2, pratica: Presentation, auditorio: Armchair, anfiteatro: Theater };

export function SpaceIcon({ id, className }: { id: string; className?: string }) {
  const I = MAP[id as keyof typeof MAP] ?? DoorClosed;
  return <I className={className} />;
}
