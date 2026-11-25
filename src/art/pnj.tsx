// Les dix personnages de Grattouille-les-Bains (BRIEF.md, section 4.3).
//
// Portrait en buste, de face, affiché dans un médaillon rond. viewBox 0 0 120 120.
// Le fond est un aplat qui remplit tout le carré (le médaillon le rogne en cercle) :
// garder le visage dans le cercle de rayon 52 centré en (60, 60). Tête vers y = 50,
// épaules qui sortent par le bas. Deux points pour les yeux, pas de bouche :
// le caractère passe par les sourcils, la posture et la tenue.

import { C, Svg, shade, type Art } from "./kit";

/** Gaspard : vieux renard argenté, gilet et visière de buraliste. Bonimenteur au grand cœur. */
const gaspard: Art = (props) => {
  const pelage = "#AEB6BD";
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.ciel} />
      {/* Oreilles */}
      <path d="M28 46L24 10L54 32Z" fill={pelage} />
      <path d="M92 46L96 10L66 32Z" fill={pelage} />
      <path d="M24 10L27 24L36 19Z" fill={C.grisFonce} />
      <path d="M96 10L93 24L84 19Z" fill={C.grisFonce} />
      {/* Épaules : chemise, gilet bordeaux */}
      <path d="M14 120V104Q14 88 34 88H86Q106 88 106 104V120Z" fill={C.craie} />
      <path d="M14 120V104Q14 88 34 88H46L60 112L74 88H86Q106 88 106 104V120Z" fill={C.bordeaux} />
      <path d="M86 88Q106 88 106 104V120H92V92Z" fill={shade(C.bordeaux, -0.25)} />
      <circle cx="60" cy="116" r="2.5" fill={C.mimosa} />
      <rect x="50" y="76" width="20" height="16" fill={pelage} />
      <path d="M50 80H70V88Q60 94 50 88Z" fill={shade(pelage, -0.2)} />
      {/* Tête */}
      <ellipse cx="60" cy="52" rx="33" ry="31" fill={pelage} />
      <path d="M26 60Q44 60 60 46Q76 60 94 60Q92 84 60 84Q28 84 26 60Z" fill={C.blanc} />
      <ellipse cx="60" cy="66" rx="6" ry="4.5" fill={C.noir} />
      <circle cx="48" cy="50" r="2.6" fill={C.nuit} />
      <circle cx="72" cy="50" r="2.6" fill={C.nuit} />
      {/* Sourcils broussailleux et relevés : le bonimenteur */}
      <path d="M40 43Q47 37 55 42L54 45Q47 41 41 46Z" fill={C.blanc} />
      <path d="M80 43Q73 37 65 42L66 45Q73 41 79 46Z" fill={C.blanc} />
      {/* Visière verte de buraliste */}
      <path d="M28 34Q60 16 92 34L90 40Q60 26 30 40Z" fill={C.persFonce} />
      <path d="M22 44Q60 26 98 44Q60 36 22 44Z" fill={C.persienne} />
    </Svg>
  );
};

/**
 * Identifiants attendus : piou, gaspard, ondine, hector, baron, auguste, sidonie,
 * enzo, colette, archibald.
 */
export const PNJ: Record<string, Art> = {
  gaspard,
};
