// Typographie française : les espaces insécables posées à l'affichage.

import { Fragment, createElement } from "react";
import { describe, expect, it } from "vitest";
import { typo } from "../src/app/typo";
import { withTypography } from "../src/jsx/props";

const NBSP = " ";
const FINE = " ";

describe("typo", () => {
  it("laisse intact un texte sans ponctuation haute ni unité", () => {
    const text = "Gratter avec ce signe";
    expect(typo(text)).toBe(text);
    expect(typo("")).toBe("");
    expect(typo("GR-2026-1125")).toBe("GR-2026-1125");
  });

  it("espace fine insécable avant ; ! ?", () => {
    expect(typo("Ça rentre, mon grand, ça rentre !")).toBe(`Ça rentre, mon grand, ça rentre${FINE}!`);
    expect(typo("Où t'installer ?")).toBe(`Où t'installer${FINE}?`);
    expect(typo("Un ticket ; puis deux")).toBe(`Un ticket${FINE}; puis deux`);
    expect(typo("Quoi ?! Déjà ?")).toBe(`Quoi${FINE}?! Déjà${FINE}?`);
  });

  it("espace insécable à l'intérieur des guillemets", () => {
    expect(typo("« Tout va bien, Patron. »")).toBe(`«${NBSP}Tout va bien, Patron.${NBSP}»`);
    expect(typo("« Le jackpot ! »")).toBe(`«${NBSP}Le jackpot${FINE}!${NBSP}»`);
  });

  it("espace insécable avant les deux-points de ponctuation seulement", () => {
    expect(typo("Fortune : 12 €")).toBe(`Fortune${NBSP}: 12${NBSP}€`);
    expect(typo("Prochain lieu :")).toBe(`Prochain lieu${NBSP}:`);
    expect(typo("a :b")).toBe("a :b");
    expect(typo("12:30")).toBe("12:30");
  });

  it("un nombre ne quitte pas son unité", () => {
    expect(typo("avec 4 € en poche")).toBe(`avec 4${NBSP}€ en poche`);
    expect(typo("1 Md€.")).toBe(`1${NBSP}Md€.`);
    expect(typo("1 Bn€, un billion")).toBe(`1${NBSP}Bn€, un billion`);
    expect(typo("2 M€ de plus")).toBe(`2${NBSP}M€ de plus`);
    expect(typo("autour de 70 % des mises")).toBe(`autour de 70${NBSP}% des mises`);
    expect(typo("Encore 1 ★ pour le Casino")).toBe(`Encore 1${NBSP}★ pour le Casino`);
    expect(typo("de 8 h à 2 h.")).toBe(`de 8${NBSP}h à 2${NBSP}h.`);
    expect(typo("3 homards et 4 Moustaches")).toBe("3 homards et 4 Moustaches");
  });

  it("un titre de civilité ne quitte pas son nom", () => {
    expect(typo("Mme Colette vous attend")).toBe(`Mme${NBSP}Colette vous attend`);
    expect(typo("Filez chez Mlle Sidonie")).toBe(`Filez chez Mlle${NBSP}Sidonie`);
    expect(typo("M. Enzo")).toBe(`M.${NBSP}Enzo`);
    expect(typo("LE PROGRAMME. Demain")).toBe("LE PROGRAMME. Demain");
  });

  it("ne touche pas à ce qui est déjà insécable, et reste stable si on l'applique deux fois", () => {
    const once = typo("« Excellence ! Vous êtes ravissante : 1 Md€ ? »");
    expect(typo(once)).toBe(once);
    expect(typo(`250${FINE}000${NBSP}€`)).toBe(`250${FINE}000${NBSP}€`);
  });
});

describe("fabrique JSX", () => {
  it("traite le texte d'une balise et d'un fragment, pas celui d'un composant", () => {
    expect(withTypography("p", { children: "Gagné !" })).toEqual({ children: `Gagné${FINE}!` });
    expect(withTypography(Fragment, { children: "Gagné !" })).toEqual({ children: `Gagné${FINE}!` });
    const component = () => null;
    const props = { children: "Gagné !" };
    expect(withTypography(component, props)).toBe(props);
  });

  it("traite les textes d'une liste d'enfants et garde les autres enfants tels quels", () => {
    const element = createElement("b", null, "x");
    const out = withTypography("p", { className: "a", children: ["Fortune :", element, ["12 €", 3], null] }) as {
      className: string;
      children: unknown[];
    };
    expect(out.className).toBe("a");
    expect(out.children[0]).toBe(`Fortune${NBSP}:`);
    expect(out.children[1]).toBe(element);
    expect(out.children[2]).toEqual([`12${NBSP}€`, 3]);
    expect(out.children[3]).toBeNull();
  });

  it("ne modifie jamais l'objet reçu, et le rend tel quel quand rien ne change", () => {
    const props = Object.freeze({ children: "Gagné !" });
    expect(withTypography("p", props)).not.toBe(props);
    const plain = { children: ["Tout gratter", 5] };
    expect(withTypography("button", plain)).toBe(plain);
    expect(withTypography("p", null)).toBeNull();
  });

  it("laisse le contenu des balises qui ne portent pas de prose", () => {
    const css = { children: ".a { color: red !important }" };
    expect(withTypography("style", css)).toBe(css);
  });
});
