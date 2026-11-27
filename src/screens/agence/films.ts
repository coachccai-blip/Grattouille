// Les trente films de l'agence forment un morceau à part du catalogue : leurs décors, leurs
// mouvements et leur lecteur (Film.tsx) pèsent bien plus que la liste, et l'on peut flâner
// devant le catalogue sans en regarder un seul. Ils arrivent quand on ouvre une première
// fiche, et sont alors prêts avant qu'on ait fini de lire le boniment.

type Films = typeof import("./Film");

let films: Films | null = null;
let attente: Promise<Films | null> | null = null;

/** Les films, s'ils sont déjà arrivés. */
export function filmsPrets(): Films | null {
  return films;
}

/** Fait venir les films. Rend `null` s'ils n'arrivent pas (plus de réseau) : on pourra redemander. */
export function chargerFilms(): Promise<Films | null> {
  if (films) return Promise.resolve(films);
  attente ??= import("./Film").then(
    (morceau) => {
      films = morceau;
      return morceau;
    },
    () => {
      attente = null;
      return null;
    },
  );
  return attente;
}
