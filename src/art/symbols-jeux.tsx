// Symboles des jeux de plateau, de cartes et de course (BRIEF.md, section 7.10).
//
// Même contrat que symbols.tsx : viewBox 0 0 48 48, fond transparent, le dessin tient
// dans le carré de 4 à 44 et se reconnaît à 28 px de côté. Ces symboles sont
// imprimés sur des cases ivoire.
// Clés : « famille:identifiant ».

import type { Art } from "./kit";

/**
 * Clés attendues :
 * - morpion:truffe, morpion:gland (Tic-Tac-Truffe), morpion:moustache, morpion:monocle (Moustache d'Or)
 * - carte:pique, carte:coeur, carte:carreau, carte:trefle (les enseignes),
 *   carte:valet (un lièvre), carte:dame (une chatte), carte:roi (un ours)
 * - regate:voilier, regate:bouee
 * - foot:ballon
 * - course:drapeau (un drapeau à damier)
 */
export const SYMBOLS_JEUX: Record<string, Art> = {};
