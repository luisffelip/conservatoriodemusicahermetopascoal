// Demonstration data (fictional). Not official conservatory rules.
export type Level = "Iniciante" | "Intermediário" | "Avançado";
export interface User { id: string; name: string; email: string; password: string; instrument?: string | undefined; avatar?: string | undefined }
export interface Course { id: string; name: string; category: string; description: string; info: string }
export interface ClassGroup { id: string; courseId: string; level: Level; days: string; time: string; teacher: string; capacity: number; enrolled: number }
export interface Space { id: string; name: string; type: string; description: string; capacity: string; purpose: string; resources: string[] }
export interface Reservation { id: string; spaceId: string; date: string; time: string; purpose: string; userId: string; status: "Pendente" | "Confirmada" | "Cancelada" }
export interface Enrollment { id: string; classId: string; userId: string; status: "Em análise" | "Aprovada"; createdAt: string }
export interface Post { id: string; authorId: string; authorName: string; title: string; description: string; instrument?: string | undefined; activity: string; date?: string | undefined; period?: string | undefined; createdAt: string; interested: string[] }
export interface EventItem { id: string; name: string; date: string; time: string; place: string; description: string; type: string; free?: boolean }
export interface Notification { id: string; userId: string; text: string; createdAt: string; read: boolean }

export interface State {
  users: User[]; currentUserId: string | null; courses: Course[]; classes: ClassGroup[]; spaces: Space[];
  reservations: Reservation[]; enrollments: Enrollment[]; posts: Post[]; events: EventItem[]; notifications: Notification[];
}

export const SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export function createSeed(): State {
  return {
    users: [
      { id: "u1", name: "João Silva", email: "joao@demo.com", password: "123456", instrument: "Piano" },
      { id: "u2", name: "Maria Oliveira", email: "maria@demo.com", password: "123456", instrument: "Violão" },
      { id: "u3", name: "Pedro Santos", email: "pedro@demo.com", password: "123456", instrument: "Baixo" },
      { id: "u4", name: "Ana Costa", email: "ana@demo.com", password: "123456", instrument: "Canto" },
      { id: "u5", name: "Carlos Lima", email: "carlos@demo.com", password: "123456", instrument: "Bateria" },
    ],
    currentUserId: null,
    courses: [
      { id: "piano", name: "Piano", category: "Teclas", description: "Técnica, leitura de partitura e repertório erudito e popular.", info: "Aulas práticas com foco em postura, coordenação das mãos e leitura musical." },
      { id: "violao", name: "Violão", category: "Cordas", description: "Do acompanhamento ao violão solo, com ritmos brasileiros.", info: "Acordes, levadas, dedilhado e introdução à harmonia." },
      { id: "guitarra", name: "Guitarra", category: "Cordas", description: "Técnica, improvisação e linguagem do rock, blues e jazz.", info: "Escalas, timbres, efeitos e prática em grupo." },
      { id: "bateria", name: "Bateria", category: "Percussão", description: "Coordenação, groove e leitura rítmica.", info: "Rudimentos, ritmos brasileiros e prática com play-along." },
      { id: "violino", name: "Violino", category: "Cordas", description: "Base técnica para música de câmara e orquestra.", info: "Postura, arco, afinação e leitura." },
      { id: "canto", name: "Canto", category: "Voz", description: "Respiração, afinação e interpretação vocal.", info: "Técnica vocal, saúde da voz e repertório." },
      { id: "teclado", name: "Teclado", category: "Teclas", description: "Harmonia funcional e acompanhamento popular.", info: "Cifras, ritmos e uso de timbres." },
      { id: "flauta", name: "Flauta", category: "Sopro", description: "Flauta doce e transversal, do básico ao choro.", info: "Respiração, sonoridade e repertório brasileiro." },
    ],
    classes: [
      { id: "c1", courseId: "piano", level: "Iniciante", days: "Seg e Qua", time: "14:00 – 15:00", teacher: "Prof.ª Helena Duarte", capacity: 8, enrolled: 5 },
      { id: "c2", courseId: "piano", level: "Intermediário", days: "Ter e Qui", time: "16:00 – 17:00", teacher: "Prof.ª Helena Duarte", capacity: 6, enrolled: 6 },
      { id: "c3", courseId: "violao", level: "Iniciante", days: "Seg e Qua", time: "09:00 – 10:00", teacher: "Prof. Rafael Moura", capacity: 12, enrolled: 7 },
      { id: "c4", courseId: "violao", level: "Avançado", days: "Sex", time: "15:00 – 17:00", teacher: "Prof. Rafael Moura", capacity: 8, enrolled: 3 },
      { id: "c5", courseId: "guitarra", level: "Iniciante", days: "Ter e Qui", time: "10:00 – 11:00", teacher: "Prof. Diego Farias", capacity: 10, enrolled: 10 },
      { id: "c6", courseId: "bateria", level: "Iniciante", days: "Sáb", time: "09:00 – 11:00", teacher: "Prof. Marcos Teles", capacity: 6, enrolled: 2 },
      { id: "c7", courseId: "bateria", level: "Intermediário", days: "Qua", time: "17:00 – 18:00", teacher: "Prof. Marcos Teles", capacity: 6, enrolled: 4 },
      { id: "c8", courseId: "violino", level: "Iniciante", days: "Ter e Qui", time: "14:00 – 15:00", teacher: "Prof.ª Lívia Prado", capacity: 8, enrolled: 4 },
      { id: "c9", courseId: "canto", level: "Iniciante", days: "Seg", time: "18:00 – 19:30", teacher: "Prof.ª Clara Nunes", capacity: 15, enrolled: 9 },
      { id: "c10", courseId: "canto", level: "Avançado", days: "Qui", time: "18:00 – 19:30", teacher: "Prof.ª Clara Nunes", capacity: 10, enrolled: 10 },
      { id: "c11", courseId: "teclado", level: "Iniciante", days: "Qua e Sex", time: "10:00 – 11:00", teacher: "Prof. Bruno Alves", capacity: 10, enrolled: 6 },
      { id: "c12", courseId: "flauta", level: "Iniciante", days: "Ter", time: "15:00 – 16:00", teacher: "Prof.ª Sofia Ramos", capacity: 10, enrolled: 3 },
    ],
    spaces: [
      { id: "individual", name: "Sala individual", type: "Estudo", description: "Ambiente destinado ao estudo individual e à prática de instrumentos.", capacity: "1 a 2 pessoas", purpose: "Estudo individual", resources: ["Piano vertical", "Estante de partitura", "Cadeira ajustável"] },
      { id: "ensaio", name: "Sala de ensaio", type: "Ensaio", description: "Espaço adequado para ensaios individuais ou em grupo.", capacity: "Até 8 pessoas", purpose: "Ensaios musicais", resources: ["Bateria acústica", "Amplificadores", "Mesa de som", "Tratamento acústico"] },
      { id: "estudio", name: "Estúdio de gravação", type: "Gravação", description: "Ambiente voltado à gravação e produção musical.", capacity: "Até 5 pessoas", purpose: "Gravação e produção", resources: ["Interface de áudio", "Microfones", "Monitores de referência", "Cabine isolada"] },
      { id: "pratica", name: "Sala de aulas práticas", type: "Aulas", description: "Sala ampla para aulas práticas e oficinas em grupo.", capacity: "Até 20 pessoas", purpose: "Aulas e oficinas", resources: ["Quadro pautado", "Teclado", "Cadeiras", "Projetor"] },
      { id: "auditorio", name: "Auditório", type: "Apresentações", description: "Espaço destinado a apresentações, encontros e atividades culturais.", capacity: "Aprox. 150 pessoas", purpose: "Apresentações e encontros", resources: ["Palco", "Piano de cauda", "Sistema de som", "Iluminação cênica"] },
      { id: "anfiteatro", name: "Anfiteatro", type: "Apresentações", description: "Espaço aberto para apresentações ao ar livre e encontros culturais.", capacity: "Aprox. 300 pessoas", purpose: "Eventos ao ar livre", resources: ["Arquibancada", "Ponto de energia", "Som portátil"] },
    ],
    reservations: [
      { id: "r1", spaceId: "individual", date: day(1), time: "09:00", purpose: "Estudo individual", userId: "u2", status: "Confirmada" },
      { id: "r2", spaceId: "individual", date: day(1), time: "14:00", purpose: "Estudo individual", userId: "u3", status: "Confirmada" },
      { id: "r3", spaceId: "individual", date: day(2), time: "10:00", purpose: "Estudo individual", userId: "u4", status: "Pendente" },
      { id: "r4", spaceId: "ensaio", date: day(1), time: "15:00", purpose: "Ensaio musical", userId: "u5", status: "Confirmada" },
      { id: "r5", spaceId: "estudio", date: day(3), time: "13:00", purpose: "Gravação", userId: "u2", status: "Confirmada" },
    ],
    enrollments: [],
    posts: [
      { id: "p1", authorId: "u1", authorName: "João Silva", title: "Preciso de um baterista para ensaio", description: "Estou preparando uma música no piano e gostaria de encontrar um baterista para complementar o arranjo. Preferência por sábado à tarde.", instrument: "Piano", activity: "Ensaio", period: "Sábado à tarde", createdAt: day(-2), interested: ["u5"] },
      { id: "p2", authorId: "u2", authorName: "Maria Oliveira", title: "Procuro guitarrista para gravação", description: "Estou desenvolvendo uma composição e preciso de alguém para gravar uma base de guitarra.", instrument: "Violão", activity: "Gravação", createdAt: day(-3), interested: [] },
      { id: "p3", authorId: "u3", authorName: "Pedro Santos", title: "Baixista disponível para colaboração", description: "Tenho disponibilidade para participar de ensaios e projetos musicais.", instrument: "Baixo", activity: "Ensaio", createdAt: day(-4), interested: ["u2"] },
      { id: "p4", authorId: "u4", authorName: "Ana Costa", title: "Cantora procura pianista para recital", description: "Preparando repertório de MPB para um recital e procuro pianista acompanhador.", instrument: "Canto", activity: "Apresentação", period: "Noites de semana", createdAt: day(-5), interested: [] },
      { id: "p5", authorId: "u5", authorName: "Carlos Lima", title: "Formando grupo de forró instrumental", description: "Procuro sanfoneiro e zabumbeiro para montar um trio e ensaiar semanalmente.", instrument: "Bateria", activity: "Ensaio", createdAt: day(-6), interested: [] },
    ],
    events: [
      { id: "e1", name: "Apresentação dos alunos de piano", date: day(5), time: "19:00", place: "Auditório", description: "Alunos das turmas de piano apresentam peças estudadas ao longo do semestre.", type: "Apresentação", free: true },
      { id: "e2", name: "Recital de violão", date: day(9), time: "18:30", place: "Auditório", description: "Recital com repertório brasileiro para violão solo e duos.", type: "Recital" },
      { id: "e3", name: "Encontro de música instrumental", date: day(14), time: "17:00", place: "Anfiteatro", description: "Encontro aberto com grupos instrumentais da região, em homenagem à obra de Hermeto Pascoal.", type: "Encontro", free: true },
      { id: "e4", name: "Apresentação da orquestra jovem", date: day(21), time: "20:00", place: "Auditório", description: "A orquestra jovem apresenta seu concerto de fim de ano.", type: "Concerto" },
    ],
    notifications: [
      { id: "n1", userId: "u1", text: "Carlos Lima demonstrou interesse na sua publicação “Preciso de um baterista para ensaio”.", createdAt: day(-1), read: false },
    ],
  };
}
