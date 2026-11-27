// Anglais — l'Agence Carpe Diem : le catalogue des expériences de vie, la fiche d'une
// expérience, le film qu'on en rapporte.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Ce dictionnaire-ci ne pèse pas sur le démarrage : il n'est chargé qu'avec l'agence, dont
// les écrans passent par le `t()` de src/screens/agence/mots.ts (LOT4.md, section 11).
// L'enseigne de l'onglet Boutiques, elle, est traduite dans `./boutiques.ts`, et les refus
// du magasin d'état dans `./suite.ts`. Les noms des trente expériences, les boniments de
// Madame Diem et les légendes des cartes postales ont leurs deux versions côte à côte dans
// src/screens/agence/textes.ts.
// « Vivre » une expérience se dit « to live » ; la revivre, « to relive ».

export const EN_EXPERIENCES: Record<string, string> = {
  // --- Le catalogue (src/screens/agence/Agence.tsx)
  "Expériences vécues : {n} sur {total}": "Experiences lived: {n} of {total}",
  "vécue": "lived",
  "Revivre": "Relive",
  "{nom}, {prix}, {etat}": "{nom}, {prix}, {etat}",
  "{nom}, vécue. Revivre": "{nom}, lived. Relive it",

  // --- La fiche d'une expérience (src/screens/agence/FicheExperience.tsx)
  "Vécue": "Lived",
  "{nom}, vécue": "{nom}, lived",
  "Vivre l'expérience": "Live the experience",
  "Autant de fois que tu veux : c'est la maison qui offre.": "As many times as you like: it's on the house.",
  "Le film de ce souvenir n'arrive pas. Vérifie ta connexion, puis réessaie.":
    "This memory's film won't load. Check your connection, then try again.",

  // --- Le film, et la carte postale (src/screens/agence/Film.tsx)
  "Souvenir {n} sur {total}": "Memory {n} of {total}",
  "Passer l'animation": "Skip the animation",
  "Touche l'écran pour passer": "Tap the screen to skip",
};
