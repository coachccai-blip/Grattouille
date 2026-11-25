// Registre des illustrations (BRIEF.md, section 4.7).
// Chaque identifiant (`item:beret`, `place:kiosque`, `pnj:gaspard`, `species:renard`,
// `ticket:lucarne`, `symbole:bandit:cerise`) est associé à un composant SVG ou à
// l'URL d'une image. Remplacer plus tard un dessin par une illustration commandée
// revient à changer une ligne : ajouter l'identifiant dans OVERRIDES.

import { createElement } from "react";
import { CATALOG, KIOSK } from "../../shared/catalog";
import { PLACES } from "../../shared/places";
import { SPECIES } from "../../shared/rules";
import { TICKETS } from "../../shared/tickets";
import { Avatar, WardrobeThumb } from "./Avatar";
import type { Art, ArtProps } from "./kit";
import { PLACE_ART } from "./places";
import { PNJ } from "./pnj";
import { RESIDENCES } from "./residences";
import { SYMBOLS } from "./symbols";
import { SYMBOLS_JEUX } from "./symbols-jeux";
import { TICKET_VIGNETTES } from "./ticket-art";
import { TREASURES } from "./treasures";
import { VEHICLES } from "./vehicles";
import { WARDROBE } from "./wardrobe";

/** Un composant SVG, ou l'URL d'une image. */
export type Illustration = Art | string;

/**
 * Illustrations commandées : une ligne par remplacement.
 * Exemple : "item:beret": "/illustrations/beret.webp",
 */
const OVERRIDES: Record<string, Illustration> = {};

export const PNJ_IDS = ["piou", "gaspard", "ondine", "hector", "baron", "auguste", "sidonie", "enzo", "colette", "archibald"] as const;

function build(): Record<string, Illustration> {
  const map: Record<string, Illustration> = {};
  for (const item of [...CATALOG, KIOSK]) {
    const id = item.id;
    let art: Art | undefined;
    if (item.slot === "vehicule") art = VEHICLES[id];
    else if (item.slot === "residence") art = RESIDENCES[id];
    else if (item.slot === "tresor") art = TREASURES[id];
    else if (WARDROBE[id]) art = (props: ArtProps) => createElement(WardrobeThumb, { id, ...props });
    if (art) map[`item:${id}`] = art;
  }
  if (RESIDENCES.banc) map["decor:banc"] = RESIDENCES.banc;
  for (const place of PLACES) {
    const art = PLACE_ART[place.id];
    if (art) map[`place:${place.id}`] = art;
  }
  for (const id of PNJ_IDS) {
    const art = PNJ[id];
    if (art) map[`pnj:${id}`] = art;
  }
  for (const s of SPECIES) {
    map[`species:${s}`] = (props: ArtProps) => createElement(Avatar, { species: s, crop: "tete", ...props });
  }
  for (const t of TICKETS) {
    const art = TICKET_VIGNETTES[t.id];
    if (art) map[`ticket:${t.id}`] = art;
  }
  for (const [key, art] of Object.entries({ ...SYMBOLS, ...SYMBOLS_JEUX })) map[`symbole:${key}`] = art;
  return { ...map, ...OVERRIDES };
}

export const REGISTRY: Record<string, Illustration> = build();

export function illustration(id: string): Illustration | undefined {
  return REGISTRY[id];
}

/** Les identifiants attendus, pour que la planche de contrôle montre aussi ce qui manque. */
export function expectedIds(): string[] {
  const symbols = [
    ...["homard", "chouette", "tortue", "paon", "hippocampe", "cerf", "baleine", "papillon", "lievre", "cygne", "abeille", "escargot"].map((s) => `constellation:${s}`),
    ...["cloche", "cerise", "citron", "trefle", "fer-a-cheval", "etoile", "sept", "diamant", "couronne", "manchot"].map((s) => `bandit:${s}`),
    ...["bouton", "perle", "amethyste", "topaze", "aigue-marine", "saphir", "emeraude", "rubis", "diamant", "etoile-de-diamants"].map((s) => `pie:${s}`),
    ...["caviar", "champagne", "homard", "truffe", "macaron", "huitre"].map((s) => `mets:${s}`),
    "morpion:truffe", "morpion:gland", "morpion:moustache", "morpion:monocle",
    "carte:pique", "carte:coeur", "carte:carreau", "carte:trefle", "carte:valet", "carte:dame", "carte:roi",
    "regate:voilier", "regate:bouee", "foot:ballon", "course:drapeau",
  ];
  return [
    ...SPECIES.map((s) => `species:${s}`),
    ...PNJ_IDS.map((p) => `pnj:${p}`),
    ...PLACES.map((p) => `place:${p.id}`),
    ...TICKETS.map((t) => `ticket:${t.id}`),
    ...CATALOG.map((i) => `item:${i.id}`),
    `item:${KIOSK.id}`,
    "decor:banc",
    ...symbols.map((s) => `symbole:${s}`),
  ];
}
