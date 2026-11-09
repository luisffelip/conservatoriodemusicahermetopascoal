import { Armchair, DoorClosed, Drum, Mic2, Presentation, Theater } from "lucide-react";
import individual from "@/assets/spaces/individual.jpg";
import ensaio from "@/assets/spaces/ensaio.jpg";
import estudio from "@/assets/spaces/estudio.jpg";
import pratica from "@/assets/spaces/pratica.jpg";
import auditorio from "@/assets/spaces/auditorio.jpg";
import anfiteatro from "@/assets/spaces/anfiteatro.jpg";

const MAP = { individual: DoorClosed, ensaio: Drum, estudio: Mic2, pratica: Presentation, auditorio: Armchair, anfiteatro: Theater };
const PHOTOS: Record<string, string> = { individual, ensaio, estudio, pratica, auditorio, anfiteatro };

export function SpaceIcon({ id, className }: { id: string; className?: string }) {
  const I = MAP[id as keyof typeof MAP] ?? DoorClosed;
  return <I className={className} />;
}

/** Photo of the space, falling back to its icon when no photo exists. */
export function SpacePhoto({ id, name, className = "" }: { id: string; name: string; className?: string }) {
  const src = PHOTOS[id];
  if (!src) return <div className={`grid place-items-center bg-espacos-soft text-espacos ${className}`}><SpaceIcon id={id} className="h-10 w-10" /></div>;
  return <img src={src} alt={name} loading="lazy" width={992} height={672} className={`object-cover ${className}`} />;
}
