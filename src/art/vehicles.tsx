// Les véhicules de Chez Enzo, du vélo au jet (BRIEF.md, annexe A).
//
// Vue de profil, nez vers la droite. viewBox 0 0 240 140. Le sol est à y = 128 :
// les roues (ou la coque, ou le train d'atterrissage) le touchent. Fond transparent.
// Une ombre portée plate au sol, en `nuit` à 18 % d'opacité, assoit le véhicule.

import { C, Svg, shade, type Art } from "./kit";

const velo: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="92" ry="6" fill={C.nuit} fillOpacity="0.18" />
    {/* Roues */}
    <circle cx="58" cy="98" r="27" fill="none" stroke={C.noir} strokeWidth="6" />
    <circle cx="182" cy="98" r="27" fill="none" stroke={C.noir} strokeWidth="6" />
    <circle cx="58" cy="98" r="20" fill="none" stroke={C.grisClair} strokeWidth="2" />
    <circle cx="182" cy="98" r="20" fill="none" stroke={C.grisClair} strokeWidth="2" />
    {/* Cadre */}
    <path d="M58 98L96 52H158L182 98M96 52L118 98H58M118 98L158 52" fill="none" stroke={C.persienne} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M118 98L158 52" fill="none" stroke={shade(C.persienne, -0.3)} strokeWidth="7" strokeLinecap="round" />
    {/* Selle et guidon */}
    <path d="M96 52L90 38" fill="none" stroke={C.grisFonce} strokeWidth="5" strokeLinecap="round" />
    <path d="M76 34H104Q108 40 100 42H80Q72 40 76 34Z" fill={C.boisFonce} />
    <path d="M158 52L152 30H170" fill="none" stroke={C.grisFonce} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Panier en osier */}
    <path d="M166 34H204L198 62H172Z" fill={C.kraft} />
    <path d="M186 34H204L198 62H186Z" fill={shade(C.kraft, -0.2)} />
    <circle cx="118" cy="98" r="7" fill={C.grisFonce} />
  </Svg>
);

/**
 * Identifiants attendus : velo, scooter, citadine, cabriolet, berline, coupe,
 * supercar, hypercar, yacht, jet.
 */
export const VEHICLES: Record<string, Art> = {
  velo,
};
