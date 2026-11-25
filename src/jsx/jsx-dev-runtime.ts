// La même fabrique, pour le serveur de développement (voir jsx-runtime.ts).

import type { ElementType, Key, ReactElement } from "react";
import { Fragment, jsxDEV as reactJsxDEV, type JSXSource } from "react/jsx-dev-runtime";
import { withTypography } from "./props";

export { Fragment };

export function jsxDEV(
  type: ElementType,
  props: unknown,
  key: Key | undefined,
  isStatic: boolean,
  source?: JSXSource,
  self?: unknown,
): ReactElement {
  return reactJsxDEV(type, withTypography(type, props), key, isStatic, source, self);
}
