// Les expériences de vie de l'Agence Carpe Diem : trente choses à vivre une fois, de la
// glace face à la mer aux vacances offertes à toute la ville.
//
// Ce ne sont pas des biens. Elles ne donnent pas de Standing, n'entrent pas dans la
// collection (toujours 110 biens) et ne comptent pour rien dans le rachat du Kiosque :
// rien de ce qui existait avant elles ne change. Une expérience se vit une fois ; ce
// qu'elle a coûté reste compté dans la fortune, comme le prix d'un bien.
//
// Les identifiants et les prix font foi : on n'y touche pas une fois le jeu en ligne.

const M = 1_000_000;
const MD = 1_000 * M;
/** Un billion : mille milliards. */
const BN = 1_000 * MD;

export interface ExperienceDef {
  id: string;
  /** Le nom français, tel qu'il s'affiche à l'agence. */
  name: string;
  price: number;
}

/** Par prix croissant : de pas cher à astronomiquement cher. */
export const EXPERIENCES: readonly ExperienceDef[] = [
  // À portée du port
  { id: "glace", name: "Une glace trois boules face à la mer", price: 3 },
  { id: "balade-en-pedalo", name: "Une heure de pédalo au soleil couchant", price: 8 },
  { id: "cerf-volant", name: "Un cerf-volant géant par grand vent", price: 20 },
  { id: "pique-nique", name: "Un pique-nique de gala sur la plage", price: 60 },
  { id: "plongee", name: "Une plongée chez les poissons-clowns", price: 150 },
  { id: "montgolfiere", name: "Une montgolfière au petit matin", price: 400 },
  { id: "parachute", name: "Un saut en parachute (parachute compris)", price: 1_000 },
  // Les grands voyages
  { id: "australie", name: "Un roadtrip en Australie", price: 3_500 },
  { id: "japon-coree", name: "Un voyage au Japon et en Corée", price: 8_000 },
  { id: "safari", name: "Un safari photo dans la savane", price: 20_000 },
  { id: "aurores", name: "Une nuit sous les aurores boréales", price: 45_000 },
  { id: "transatlantique", name: "La traversée de l'Atlantique à la voile", price: 120_000 },
  { id: "tour-du-monde", name: "Le tour du monde", price: 350_000 },
  { id: "antarctique", name: "Une expédition chez les manchots", price: 900_000 },
  // Les folies
  { id: "everest", name: "L'Everest en chaise à porteurs", price: 2_500_000 },
  { id: "ile-deserte", name: "Un mois sur une île déserte, tout compris", price: 7 * M },
  { id: "train", name: "Un train de légende rien que pour toi", price: 20 * M },
  { id: "film", name: "Un film dont tu es la vedette", price: 60 * M },
  { id: "abysses", name: "Une descente dans la fosse des Mariannes", price: 200 * M },
  { id: "parc", name: "Un parc d'attractions pour toi tout seul", price: 600 * M },
  // Plus haut que le ciel
  { id: "apesanteur", name: "Une sieste en apesanteur", price: 1_500 * M },
  { id: "orbite", name: "Une semaine en orbite", price: 5 * MD },
  { id: "feu-artifice", name: "Un feu d'artifice visible de l'espace", price: 15 * MD },
  { id: "tour-de-lune", name: "Le tour de la Lune", price: 50 * MD },
  { id: "pas-sur-la-lune", name: "Un petit pas sur la Lune", price: 150 * MD },
  { id: "soiree-lune", name: "Une soirée sur la Lune", price: 500 * MD },
  { id: "mars", name: "Un pique-nique sur Mars", price: 2 * BN },
  { id: "saturne", name: "Du surf sur les anneaux de Saturne", price: 10 * BN },
  { id: "dos-de-comete", name: "Une balade à dos de comète", price: 60 * BN },
  // La dernière
  { id: "toute-la-ville", name: "Des vacances pour toute la ville", price: 500 * BN },
];

/** Le nombre d'expériences à vivre : trente. */
export const EXPERIENCE_COUNT = EXPERIENCES.length;

const BY_ID = new Map(EXPERIENCES.map((experience) => [experience.id, experience]));

export function experienceById(id: string): ExperienceDef | undefined {
  return BY_ID.get(id);
}

/** Ce qu'ont coûté les expériences vécues. Un identifiant inconnu ne compte pour rien. */
export function experiencesValue(lived: readonly string[]): number {
  let sum = 0;
  for (const id of new Set(lived)) sum += BY_ID.get(id)?.price ?? 0;
  return sum;
}

/** Les expériences vécues, sans doublon ni identifiant inconnu, dans l'ordre où elles l'ont été. */
export function knownExperiences(lived: unknown): string[] {
  if (!Array.isArray(lived)) return [];
  const out: string[] = [];
  for (const id of lived) if (typeof id === "string" && BY_ID.has(id) && !out.includes(id)) out.push(id);
  return out;
}
