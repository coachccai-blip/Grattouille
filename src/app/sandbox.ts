// Mode bac à sable (BRIEF.md, section 15.9) : avec ?bac-a-sable dans l'adresse, le
// client parle à une fausse API en mémoire. C'est le vrai code de server/, branché
// sur le stockage en mémoire : mêmes règles, mêmes tableaux de lots, tirés localement.
// Il sert aux démonstrations hors ligne et n'écrit jamais sur le serveur. Tout
// disparaît au rechargement de la page.
//
// Pour les démonstrations, trois raccourcis s'ajoutent à l'adresse :
//   ?bac-a-sable&solde=5000000     solde de départ du compte créé
//   ?bac-a-sable&biens=30          possède d'emblée les 30 biens les moins chers
//   ?bac-a-sable&palier=jackpot    chaque ticket acheté tombe sur ce palier de résultat
//                                  (perdu, rembourse, petit, joli, gros, enorme, jackpot)
// Et pour la suite de l'histoire, sans avoir à tout rejouer :
//   &kiosque=1     le Kiosque est déjà à lui (il est Patron, le premier générique est passé)
//   &defis=8       les N premiers défis de poker sont déjà relevés
//   &maitres=1     la Table des Maîtres déjà remportée N fois
//   &vraiefin=1    la vraie fin déjà vue
//   &semes=40      N tickets déjà semés (d'une valeur de 100 € pièce)
//   &joues=1600    N tickets déjà joués ; &record=2000000 : son plus gros gain sur un ticket
//   &jackpots=5    N jackpots ; &demasques=10 : N tricheurs démasqués au poker

import { handle, type Deps } from "../../server/app";
import { cryptoRandom32 } from "../../server/auth";
import { toState } from "../../server/player";
import { MemoryStorage } from "../../server/storage";
import { CATALOG } from "../../shared/catalog";
import { PLACES } from "../../shared/places";
import { multipliers } from "../../shared/economy";
import { tierOf, type Tier } from "../../shared/rules";
import { ticketById } from "../../shared/tickets";
import type { CreatePlayerResponse, TicketsResponse } from "../../shared/types";
import type { Transport } from "./api";

const TIERS: readonly Tier[] = ["perdu", "rembourse", "petit", "joli", "gros", "enorme", "jackpot"];

/** Le plus gros multiplicateur du tableau de lots qui tombe dans ce palier. */
function multiplierFor(tier: Tier, type: string): number | null {
  const def = ticketById(type);
  if (!def) return null;
  if (tier === "perdu") return 0;
  const fits = multipliers(def.temperament).filter((m) => tierOf(m, 1) === tier);
  return fits.length > 0 ? fits[fits.length - 1]! : null;
}

export function createSandboxTransport(params: URLSearchParams): Transport {
  const storage = new MemoryStorage();
  const deps: Deps = {
    storage,
    context: "bac-a-sable",
    adminKey: null,
    now: Date.now,
    random32: cryptoRandom32,
  };
  const solde = Number(params.get("solde"));
  const biens = Number(params.get("biens"));
  const palier = TIERS.find((t) => t === params.get("palier")) ?? null;
  /** Un entier positif de l'adresse, ou 0. */
  const whole = (name: string): number => {
    const value = Number(params.get(name));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  };
  const suite = {
    kiosque: whole("kiosque") > 0, defis: whole("defis"), maitres: whole("maitres"), vraieFin: whole("vraiefin") > 0,
    semes: whole("semes"), joues: whole("joues"), record: whole("record"), jackpots: whole("jackpots"),
    demasques: whole("demasques"),
  };
  const wantsSuite = Object.values(suite).some((value) => value !== false && value !== 0);
  const cheap = [...CATALOG].sort((a, b) => a.price - b.price);

  return async ({ method, path, body, auth }) => {
    const headers: Record<string, string> = {};
    if (auth) headers.authorization = `Bearer ${auth.playerId}.${auth.code}`;
    if (body !== undefined) headers["content-type"] = "application/json";
    const req = new Request(`https://bac-a-sable.invalid${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // Un court délai, comme un vrai réseau : le distributeur a le temps de tourner.
    await new Promise((resolve) => setTimeout(resolve, 120));
    const res = await handle(req, deps);
    const data = (await res.json()) as unknown;

    if (method === "POST" && path === "/api/players" && res.status === 201) {
      const created = data as CreatePlayerResponse;
      const wantsMoney = Number.isFinite(solde) && solde > 0;
      const wantsGoods = Number.isFinite(biens) && biens > 0;
      if (wantsMoney || wantsGoods || wantsSuite) {
        storage.poke(created.playerId, (p) => {
          if (wantsMoney) p.balance = Math.floor(solde);
          if (wantsGoods) p.owned = cheap.slice(0, Math.min(Math.floor(biens), cheap.length)).map((i) => i.id);
          if (suite.kiosque) p.kiosk = true;
          if (suite.defis > 0) p.pokerWins = PLACES.slice(0, suite.defis).map((place) => place.id);
          if (suite.maitres > 0) p.masters = suite.maitres;
          if (suite.vraieFin) p.vraieFin = true;
          if (suite.semes > 0) {
            p.stats.sown = suite.semes;
            p.stats.sownValue = suite.semes * 100;
          }
          if (suite.joues > 0) p.stats.tickets = suite.joues;
          if (suite.record > 0) {
            p.stats.bestGain = suite.record;
            p.stats.bestTicket = "gratte-ciel";
          }
          if (suite.jackpots > 0) p.stats.jackpots = suite.jackpots;
          if (suite.demasques > 0) p.pokerStats = { ...p.pokerStats, unmasked: suite.demasques };
        });
        created.state = toState(storage.peek(created.playerId)!);
      }
    }

    // Démonstration d'un palier : le gain des tickets vendus est réécrit dans le bac à sable.
    if (palier && method === "POST" && path === "/api/tickets/buy" && res.status === 200 && auth) {
      const sold = data as TicketsResponse;
      const ids = new Set(sold.tickets.map((t) => t.id));
      storage.poke(auth.playerId, (p) => {
        for (const t of p.pending) {
          if (!ids.has(t.id)) continue;
          const m = multiplierFor(palier, t.type);
          const def = ticketById(t.type);
          if (m !== null && def) t.gain = m * def.price;
        }
      });
      const record = storage.peek(auth.playerId)!;
      sold.tickets = record.pending.filter((t) => ids.has(t.id));
      sold.state = toState(record);
    }
    return { status: res.status, data };
  };
}
