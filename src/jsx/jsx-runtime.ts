// Fabrique JSX du projet (voir vite.config.ts) : celle de React, plus la passe
// typographique de props.ts. Tout le JSX de src/ passe par ici à la construction.

import type { ElementType, Key, ReactElement } from "react";
import { Fragment, jsx as reactJsx, jsxs as reactJsxs } from "react/jsx-runtime";
import { withTypography } from "./props";

export { Fragment };

export function jsx(type: ElementType, props: unknown, key?: Key): ReactElement {
  return reactJsx(type, withTypography(type, props), key);
}

export function jsxs(type: ElementType, props: unknown, key?: Key): ReactElement {
  return reactJsxs(type, withTypography(type, props), key);
}
