// L'avatar du joueur (BRIEF.md, section 4.6).
// Gabarit commun aux huit espèces : viewBox 0 0 400 480.
// Ordre des calques, du fond vers l'avant : buste, tenue, oreilles, tête,
// accessoire, lunettes, chapeau.

import { itemById } from "../../shared/catalog";
import type { Slot } from "../../shared/types";
import { BUSTE, C, COU, Svg, shade, type ArtProps } from "./kit";
import { speciesArt } from "./species";
import { GARDE_ROBE } from "./garde-robe";

export type AvatarLook = Partial<Record<"chapeau" | "lunettes" | "tenue" | "accessoire", string | null>>;

interface AvatarProps extends ArtProps {
  species: string;
  look?: AvatarLook;
  /** `buste` : l'avatar entier. `tete` : tête, chapeau et lunettes, pour les plaques du classement. */
  crop?: "buste" | "tete";
}

function Layer({ id }: { id: string | null | undefined }) {
  if (!id) return null;
  const art = GARDE_ROBE[id];
  return art ? <art.Layer /> : null;
}

/** Le corps nu : buste, cou, oreilles, tête, museau, yeux. Les vêtements s'intercalent. */
function Body({ species, look }: { species: string; look: AvatarLook }) {
  const sp = speciesArt(species);
  const { pelage, ventre } = sp.colors;
  const oeil = sp.colors.oeil ?? C.nuit;
  const ombre = shade(pelage, -0.22);
  return (
    <>
      {/* Buste */}
      <path d={BUSTE} fill={pelage} />
      <ellipse cx="200" cy="436" rx="64" ry="84" fill={ventre} />
      <path d="M330 372V480H296V336Q330 344 330 372Z" fill={ombre} />
      <path d={COU} fill={pelage} />
      {/* L'ombre du menton sur le cou. */}
      <path d="M168 262H232V296Q204 318 176 300Z" fill={ombre} />
      <Layer id={look.tenue} />
      <sp.Ears />
      {/* Tête */}
      <ellipse cx="200" cy="172" rx="98" ry="93" fill={pelage} />
      <g clipPath="url(#av-tete)">
        <sp.Muzzle />
      </g>
      <circle cx="165" cy="165" r="7.5" fill={oeil} />
      <circle cx="235" cy="165" r="7.5" fill={oeil} />
      <path d="M149 142Q165 133 181 141L180 147Q165 140 150 148Z" fill={oeil} />
      <path d="M251 142Q235 133 219 141L220 147Q235 140 250 148Z" fill={oeil} />
      <Layer id={look.accessoire} />
      <Layer id={look.lunettes} />
      <Layer id={look.chapeau} />
    </>
  );
}

export function Avatar({ species, look = {}, crop = "buste", className, title }: AvatarProps) {
  return (
    <Svg viewBox={crop === "tete" ? "60 0 280 280" : "0 0 400 480"} className={className} title={title}>
      <Body species={species} look={look} />
    </Svg>
  );
}

/** Cadrage par défaut de la vignette de boutique, selon l'emplacement. */
export const THUMB_BY_SLOT: Partial<Record<Slot, string>> = {
  chapeau: "80 0 240 150",
  lunettes: "100 115 200 100",
  tenue: "50 250 300 230",
  accessoire: "120 240 160 110",
};

/** Un article de garde-robe seul, pour l'étiquette de boutique. */
export function WardrobeThumb({ id, className, title }: ArtProps & { id: string }) {
  const art = GARDE_ROBE[id];
  const slot = itemById(id)?.slot;
  const viewBox = art?.thumb ?? (slot ? THUMB_BY_SLOT[slot] : undefined) ?? "0 0 400 480";
  return (
    <Svg viewBox={viewBox} className={className} title={title}>
      {art ? <art.Layer /> : null}
    </Svg>
  );
}
