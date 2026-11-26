// Passe typographique de la fabrique JSX : tout texte posé dans une balise (ou dans
// un fragment) reçoit ses espaces insécables. Les composants, eux, reçoivent leurs
// textes tels quels : ils finiront dans une balise, où ils seront traités.
// Ces espaces sont ceux de la typographie française : en anglais, la passe ne fait rien.

import { Fragment } from "react";
import { typo } from "../app/typo";
import { lang } from "../i18n";

/** Balises dont le contenu n'est pas de la prose. */
const RAW = new Set(["style", "script", "textarea", "pre", "code"]);

function fix(child: unknown): unknown {
  if (typeof child === "string") return typo(child);
  if (!Array.isArray(child)) return child;
  let copy: unknown[] | null = null;
  for (let i = 0; i < child.length; i++) {
    const before: unknown = child[i];
    const after = fix(before);
    if (after !== before) {
      copy ??= child.slice();
      copy[i] = after;
    }
  }
  return copy ?? child;
}

/** Rend les mêmes propriétés, ou une copie quand un texte a changé. Ne modifie jamais l'objet reçu. */
export function withTypography(type: unknown, props: unknown): unknown {
  if (props === null || typeof props !== "object" || lang() !== "fr") return props;
  if (typeof type === "string" ? RAW.has(type) : type !== Fragment) return props;
  const children = (props as { children?: unknown }).children;
  const fixed = fix(children);
  return fixed === children ? props : { ...props, children: fixed };
}
