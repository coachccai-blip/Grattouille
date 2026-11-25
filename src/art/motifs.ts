// Motifs des cinq lieux (BRIEF.md, section 4.2) : rayures de store, cannage,
// guirlande d'ampoules, capitons en losange, éventails Art déco.
//
// Chaque motif est une tuile SVG répétée en fond d'écran, par-dessus le dégradé du
// lieu. `tile` est le code SVG complet de la tuile (avec xmlns et viewBox), dessiné
// en une ou deux couleurs à faible opacité pour ne jamais gêner la lecture du texte.
// L'écran en fait une image de fond : `url("data:image/svg+xml,…")`.

export interface Motif {
  /** Code SVG de la tuile. */
  tile: string;
  /** Taille d'affichage de la tuile, en pixels. */
  width: number;
  height: number;
}

/** Identifiants attendus : kiosque, cafe, casino, salon, cercle. */
export const MOTIFS: Record<string, Motif> = {};

/** L'image de fond CSS d'un motif. */
export function motifBackground(id: string): string | undefined {
  const m = MOTIFS[id];
  return m ? `url("data:image/svg+xml,${encodeURIComponent(m.tile)}")` : undefined;
}
