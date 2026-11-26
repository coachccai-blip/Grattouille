// Le cœur de l'API, indépendant de Netlify : une requête, des dépendances, une réponse.
// La fonction Netlify (router.ts), les tests, le serveur de développement et le mode
// bac à sable passent tous par ici (BRIEF.md, section 15.5).

import { ApiError, fail } from "./errors";
import { ackTickets, buyTickets, foundTicket } from "./handlers/tickets";
import { ban, health, leaderboard } from "./handlers/misc";
import { createPlayer, deleteMe, getMe, openSession } from "./handlers/players";
import { createPokerTable, joinPokerTable, pokerAct, pokerLobby, pokerTable } from "./handlers/poker";
import { buyItem, setLook } from "./handlers/shop";
import { errorResponse, type Deps } from "./http";

type Handler = (req: Request, deps: Deps) => Promise<Response>;

const ROUTES: Record<string, Handler> = {
  "GET /api/health": health,
  "POST /api/players": createPlayer,
  "POST /api/session": openSession,
  "GET /api/me": getMe,
  "DELETE /api/me": deleteMe,
  "POST /api/tickets/buy": buyTickets,
  "POST /api/tickets/found": foundTicket,
  // L'ancien nom de la route, pour une page restée ouverte pendant une mise à jour.
  "POST /api/tickets/house": foundTicket,
  "POST /api/tickets/ack": ackTickets,
  "POST /api/shop/buy": buyItem,
  "POST /api/look": setLook,
  "GET /api/leaderboard": leaderboard,
  // Le Poker Tricheur (POKER.md, section 4).
  "GET /api/poker": pokerLobby,
  "POST /api/poker/tables": createPokerTable,
  "POST /api/poker/join": joinPokerTable,
  "GET /api/poker/table": pokerTable,
  "POST /api/poker/act": pokerAct,
  "POST /api/admin/ban": ban,
};

export async function handle(req: Request, deps: Deps): Promise<Response> {
  let route = "";
  try {
    const url = new URL(req.url);
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
    route = `${req.method.toUpperCase()} ${path}`;
    const handler = ROUTES[route];
    // Aucun en-tête CORS : aucune requête d'une autre origine n'est servie.
    if (!handler) fail("NOT_FOUND");
    return await handler(req, deps);
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error);
    // Les journaux ne contiennent ni code de récupération ni empreinte : seulement la route et l'erreur.
    console.error("[grattouille]", route, error instanceof Error ? `${error.name}: ${error.message}` : "erreur inconnue");
    return errorResponse(new ApiError("SERVER_ERROR"));
  }
}

export type { Deps } from "./http";
