// Simulation d'équilibrage (BRIEF.md, section 6.7).
// Rejoue des parties complètes avec les chiffres de shared/ et les compare au rythme
// attendu. Toute retouche d'un prix, d'un poids ou d'un seuil passe par ici.
//
// Le brief visait 750 tickets pour finir (section 5.7). Le jeu a depuis été étendu
// à huit lieux et 110 biens : la partie dure à peu près deux fois plus longtemps,
// environ 1 500 tickets pour un joueur ordinaire. Le tableau de référence ci-dessous
// est celui de cette version étendue (voir DECISIONS.md).
//
//   npm run simulate            6 000 parties par style
//   npm run simulate -- 20000   20 000 parties par style

import { CATALOG, KIOSK } from "../shared/catalog";
import { FIRST_TICKET_MULTIPLIER, HOUSE_MULTIPLIER, WEIGHT_TOTAL, drawMultiplier } from "../shared/economy";
import { formatInt } from "../shared/format";
import { PLACES } from "../shared/places";
import { START_BALANCE } from "../shared/rules";
import { TICKETS, cheapestTicket } from "../shared/tickets";
import { mulberry32 } from "../src/engines/common";

export interface Style {
  id: string;
  label: string;
  /** Part maximale du solde misée sur un ticket. */
  bet: number;
  /** Part maximale du solde dépensée pour un bien. */
  buy: number;
}

export const STYLES: readonly Style[] = [
  { id: "prudent", label: "Prudent : mise d'au plus 5 % du solde", bet: 0.05, buy: 0.2 },
  { id: "standard", label: "Standard : au plus 10 %", bet: 0.1, buy: 0.3 },
  { id: "joueur", label: "Joueur : au plus 20 %", bet: 0.2, buy: 0.4 },
  { id: "flambeur", label: "Flambeur : au plus 50 %", bet: 0.5, buy: 0.6 },
  { id: "tapis", label: "Tapis : tout le solde", bet: 1, buy: 0.6 },
];

/** Les étapes : le premier ticket acheté dans chaque lieu après le Kiosque, puis la fin. */
export const STEPS: readonly string[] = [...PLACES.slice(1).map((p) => p.short.replace(/^(le|la) /, "")), "Tout acheter, Kiosque compris"];
const LAST = STEPS.length - 1;

/** Médianes de référence : nombre de tickets grattés avant chaque étape. */
export const EXPECTED: Record<string, readonly number[]> = {
  prudent: [119, 282, 496, 795, 1072, 1411, 1736, 1900],
  standard: [81, 222, 388, 617, 831, 1092, 1351, 1515],
  joueur: [58, 185, 327, 516, 692, 911, 1130, 1296],
  flambeur: [42, 159, 304, 480, 644, 837, 1034, 1212],
  tapis: [27, 126, 272, 442, 602, 791, 994, 1173],
};

export const TOLERANCE = 0.15;

/**
 * Le coup de chance : un ticket par terre toutes les 8 minutes au plus, soit, au
 * rythme d'un ticket toutes les 24 secondes, un tous les 20 tickets.
 */
export const LUCKY_EVERY = 20;

const SHOPPING = [...CATALOG].sort((a, b) => a.price - b.price);
const THRESHOLDS = PLACES.slice(1).map((p) => p.standing);
const TICKETS_BY_PRICE = [...TICKETS].sort((a, b) => a.price - b.price);
const PLACE_INDEX = new Map(PLACES.map((p, i) => [p.id, i]));
const HOUSE_TICKETS = PLACES.map((p) => cheapestTicket(p.id));

export interface Game {
  /**
   * Tickets grattés avant chaque étape. Pour un lieu, l'étape est le premier ticket
   * que le joueur y achète ; la dernière est le rachat du Kiosque.
   */
  steps: number[];
  /** Tickets grattés avant que le Standing n'ouvre chaque lieu (l'ouverture précède le premier achat). */
  unlocks: number[];
  /** Gains d'au moins 25 fois la mise, 100 fois la mise, et jackpots (500 fois ou plus). */
  big: number;
  huge: number;
  jackpots: number;
  /** Tickets trouvés par terre parce que le joueur n'avait plus de quoi jouer. */
  houseTickets: number;
  /** Tickets trouvés par terre par chance. */
  luckyTickets: number;
}

/**
 * Une partie complète, du premier ticket ramassé au rachat du Kiosque.
 *
 * Le modèle de joueur est celui du brief, avec deux précisions (voir DECISIONS.md) :
 * - l'étape d'un lieu est le premier ticket que le joueur y achète, pas le moment
 *   où son Standing l'ouvre : un joueur prudent ouvre le Grand Café bien avant d'y miser ;
 * - le Kiosque, qui clôt la partie, est racheté dès que le solde atteint son prix,
 *   sans attendre que ce prix tienne dans la part d'achats.
 * On débarque sans un sou : le premier ticket se ramasse par terre.
 */
export function playGame(style: Style, rng: () => number, maxTickets = 400_000): Game {
  let balance = START_BALANCE;
  let standing = 0;
  let owned = 0;           // les biens sont achetés du moins cher au plus cher
  let tickets = 0;
  let placeIndex = 0;      // le meilleur lieu débloqué
  let played = 0;          // le meilleur lieu où le joueur a déjà acheté un ticket
  let lastFound = 0;       // le numéro du dernier ticket trouvé par terre
  const steps = new Array<number>(STEPS.length).fill(0);
  const unlocks = new Array<number>(THRESHOLDS.length).fill(0);
  const game: Game = { steps, unlocks, big: 0, huge: 0, jackpots: 0, houseTickets: 0, luckyTickets: 0 };

  while (tickets < maxTickets) {
    // 1. Acheter le bien le moins cher non possédé tant que son prix tient dans la part d'achats.
    while (owned < SHOPPING.length && SHOPPING[owned]!.price <= balance * style.buy) {
      const item = SHOPPING[owned]!;
      balance -= item.price;
      standing += item.standing;
      owned++;
      while (placeIndex < THRESHOLDS.length && standing >= THRESHOLDS[placeIndex]!) {
        unlocks[placeIndex] = tickets;
        placeIndex++;
      }
    }
    // La collection est complète : le Kiosque est à vendre.
    if (owned === SHOPPING.length && balance >= KIOSK.price) {
      steps[LAST] = tickets;
      for (let k = played; k < LAST; k++) steps[k] = tickets;
      return game;
    }

    // 2. Ramasser le ticket qui traîne par terre : parce qu'on n'a plus de quoi jouer
    //    (section 5.5), ou parce que la chance en a laissé un.
    const house = HOUSE_TICKETS[placeIndex]!;
    const broke = balance < house.price;
    if (broke || tickets - lastFound >= LUCKY_EVERY) {
      // Le tout premier ticket d'un compte rapporte 5 fois son prix.
      balance += house.price * (tickets === 0 ? FIRST_TICKET_MULTIPLIER : HOUSE_MULTIPLIER);
      lastFound = tickets;
      tickets++;
      if (broke) game.houseTickets++;
      else game.luckyTickets++;
      continue;
    }

    // 3. Sinon le ticket débloqué le plus cher qui tient dans la part de mise,
    //    ou à défaut le moins cher que le solde permet.
    let chosen = TICKETS_BY_PRICE[0]!;
    const cap = balance * style.bet;
    for (const t of TICKETS_BY_PRICE) {
      if (PLACE_INDEX.get(t.place)! > placeIndex) continue;
      if (t.price <= cap) chosen = t;
    }
    const where = PLACE_INDEX.get(chosen.place)!;
    for (; played < where; played++) steps[played] = tickets;
    const m = drawMultiplier(chosen.temperament, Math.floor(rng() * WEIGHT_TOTAL));
    balance += chosen.price * (m - 1);
    tickets++;
    if (m >= 25) game.big++;
    if (m >= 100) game.huge++;
    if (m >= 500) game.jackpots++;
  }
  for (let k = played; k < STEPS.length; k++) steps[k] = tickets;
  return game;
}

function quantile(sorted: readonly number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

export interface StyleReport {
  style: Style;
  games: number;
  medians: number[];
  /** Médianes de l'ouverture des lieux par le Standing. */
  unlockMedians: number[];
  /** Écart relatif à la médiane attendue, pour chaque étape. */
  gaps: number[];
  p10: number;
  p90: number;
  avgBig: number;
  avgHuge: number;
  jackpotShare: number;
  avgHouse: number;
  avgLucky: number;
  /** Aucune partie n'est restée en plan avant la fin. */
  finished: boolean;
  ok: boolean;
}

export function simulate(games = 6_000, seed = 20261126): StyleReport[] {
  return STYLES.map((style, s) => {
    const rng = mulberry32((seed + s * 7919) >>> 0);
    const runs: Game[] = [];
    for (let g = 0; g < games; g++) runs.push(playGame(style, rng));
    const medians = STEPS.map((_, i) => Math.round(quantile(runs.map((r) => r.steps[i]!).sort((a, b) => a - b), 0.5)));
    const unlockMedians = THRESHOLDS.map((_, i) => Math.round(quantile(runs.map((r) => r.unlocks[i]!).sort((a, b) => a - b), 0.5)));
    const expected = EXPECTED[style.id]!;
    const gaps = medians.map((m, i) => (expected[i]! > 0 ? (m - expected[i]!) / expected[i]! : 0));
    const finals = runs.map((r) => r.steps[LAST]!).sort((a, b) => a - b);
    const mean = (f: (g: Game) => number) => runs.reduce((sum, r) => sum + f(r), 0) / runs.length;
    return {
      style, games, medians, unlockMedians, gaps,
      p10: Math.round(quantile(finals, 0.1)),
      p90: Math.round(quantile(finals, 0.9)),
      avgBig: mean((r) => r.big),
      avgHuge: mean((r) => r.huge),
      jackpotShare: mean((r) => (r.jackpots > 0 ? 1 : 0)),
      avgHouse: mean((r) => r.houseTickets),
      avgLucky: mean((r) => r.luckyTickets),
      finished: finals[finals.length - 1]! < 400_000,
      ok: gaps.every((g) => Math.abs(g) <= TOLERANCE),
    };
  });
}

const plain = (s: string) => s.replace(/[\u00A0\u202F]/g, " ");

export function renderReport(reports: readonly StyleReport[]): string {
  const lines: string[] = [];
  lines.push(plain(`Nombre médian de tickets grattés avant chaque étape (${formatInt(reports[0]!.games)} parties par style)`));
  lines.push("");
  lines.push(`| Style de jeu | ${STEPS.join(" | ")} |`);
  lines.push(`|---|${STEPS.map(() => "---").join("|")}|`);
  for (const r of reports) {
    lines.push(`| ${r.style.label} | ${r.medians.map((m) => plain(formatInt(m))).join(" | ")} |`);
  }
  lines.push("");
  lines.push("Écart aux médianes de référence (tolérance : 15 %)");
  lines.push("");
  for (const r of reports) {
    const gaps = r.gaps.map((g) => `${g >= 0 ? "+" : ""}${(g * 100).toFixed(1)} %`).join("  ");
    lines.push(`  ${r.ok ? "ok  " : "ÉCART"}  ${r.style.id.padEnd(9)} ${gaps}`);
  }
  lines.push("");
  lines.push("Pour information, tickets grattés avant que le Standing n'ouvre chaque lieu :");
  lines.push("");
  for (const r of reports) {
    lines.push(`  ${r.style.id.padEnd(9)} ${r.unlockMedians.map((m) => plain(formatInt(m)).padStart(6)).join(" ")}`);
  }
  const std = reports.find((r) => r.style.id === "standard");
  if (std) {
    lines.push("");
    lines.push(`Style standard : 80 % des parties finissent entre ${plain(formatInt(std.p10))} et ${plain(formatInt(std.p90))} tickets.`);
    lines.push(`À 24 secondes par ticket, la partie médiane dure ${(std.medians[LAST]! * 24 / 3600).toFixed(1)} heures.`);
    lines.push(`Gains d'au moins 25 fois la mise : ${std.avgBig.toFixed(1)} par partie. Au moins 100 fois : ${std.avgHuge.toFixed(1)}.`);
    lines.push(`Parties avec au moins un jackpot : ${(std.jackpotShare * 100).toFixed(0)} %.`);
    lines.push(`Tickets trouvés par terre : ${std.avgHouse.toFixed(1)} par partie faute de quoi jouer, ${std.avgLucky.toFixed(1)} par chance.`);
  }
  lines.push("");
  lines.push(reports.every((r) => r.finished) ? "Aucune partie n'est restée bloquée : toutes vont au bout." : "ATTENTION : au moins une partie n'est pas allée au bout.");
  return lines.join("\n");
}

// Exécution en ligne de commande.
const invoked = typeof process !== "undefined" && process.argv[1] && /simulate\.[cm]?[tj]s$/.test(process.argv[1]);
if (invoked) {
  const games = Number(process.argv[2] ?? 6000);
  const started = Date.now();
  const reports = simulate(Number.isFinite(games) && games >= 100 ? Math.floor(games) : 6000);
  console.log(renderReport(reports));
  console.log(`\n${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (!reports.every((r) => r.ok)) {
    console.error("\nAu moins une médiane sort de la tolérance : shared/ ne donne plus le rythme de référence.");
    process.exit(1);
  }
}
