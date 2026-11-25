// Point d'entrée unique de l'API (BRIEF.md, section 16.2).
// Toute la logique vit dans server/, hors de ce dossier, pour que Netlify ne prenne
// pas un fichier utilitaire pour une fonction.

import type { Config, Context } from "@netlify/functions";
import { route } from "../../server/router";

export default async (req: Request, context: Context) => route(req, context);

export const config: Config = { path: "/api/*" };
