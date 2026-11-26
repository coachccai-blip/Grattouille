// Les sons du récit et du décor, et la retenue qui va avec : on doit pouvoir jouer une
// heure sans vouloir couper le son. Piou ne pépie que lorsqu'il a quelque chose de
// nouveau à dire, un ticket par terre ne scintille qu'en apparaissant, et la mouette,
// signature du jeu, se fait rare une fois qu'on a débarqué.

import { playChirp, playGull, playSparkle } from "./audio";

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

let lastWords = "";

/** Piou parle. Il pépie une fois par phrase : redire la même en revenant sur l'écran ne le fait pas répéter. */
export function piouParle(words: string): void {
  if (!words || words === lastWords) return;
  lastWords = words;
  playChirp();
}

/** Le ticket par terre a déjà scintillé, et quand. */
let announcedAt = 0;
/** Un ticket qu'on laisse traîner se rappelle au souvenir du joueur, mais pas plus d'une fois par minute. */
const REMIND_MS = 60_000;

/**
 * Un ticket traîne par terre : il scintille quand il apparaît, une fois, quel que soit
 * l'écran où on le voit d'abord. `present` : il y en a un ; `shown` : cet écran le montre.
 */
export function ticketParTerre(present: boolean, shown: boolean): void {
  if (!present) {
    announcedAt = 0;
    return;
  }
  if (!shown) return;
  if (announcedAt !== 0 && now() - announcedAt < REMIND_MS) return;
  announcedAt = now();
  playSparkle();
}

/** Le ticket vient d'être ramassé : le prochain scintillera. */
export function ticketRamasse(): void {
  announcedAt = 0;
}

/** Trois minutes au moins entre deux mouettes. */
const GULL_REST_MS = 180_000;
let lastGull = 0;

/** La mouette de l'arrivée au port, et celle de l'épilogue. */
export function mouette(): void {
  lastGull = now();
  playGull();
}

/** Sur la Promenade, une mouette passe de temps en temps : une fois sur huit, et jamais deux de suite. */
export function mouetteParfois(): void {
  if (lastGull !== 0 && now() - lastGull < GULL_REST_MS) return;
  if (Math.random() < 0.125) mouette();
}
