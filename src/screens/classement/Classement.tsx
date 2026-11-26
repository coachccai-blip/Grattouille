// Classement (BRIEF.md, section 10). Le score est la fortune. Les 100 premiers sont
// affichés : un podium pour les trois premiers, puis une plaque par joueur.
// La ligne du joueur est toujours visible, épinglée en bas quand elle est hors de l'écran.

import { useCallback, useEffect, useRef, useState } from "react";
import { formatEuros, formatInt } from "../../../shared/format";
import { BOARD_SHOWN, BOARD_SIZE } from "../../../shared/rules";
import type { Board, BoardEntry } from "../../../shared/types";
import { api } from "../../app/api";
import { toast, useGame } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Etoile, Icon } from "../../art/icons";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Entete } from "../../ui/Commun";
import "./classement.css";

/** Au plus un rafraîchissement toutes les 20 secondes. */
const MIN_REFRESH_MS = 20_000;
let cache: { board: Board; at: number } | null = null;

/** Ce qu'un lecteur d'écran lit d'une plaque ou d'une marche du podium : une phrase, d'une traite. */
function lecture(entry: BoardEntry, rank: number, me: boolean): string {
  const vars = {
    rang: formatInt(rank),
    nom: me ? t("Toi") : entry.pseudo,
    etoiles: formatInt(entry.standing),
    fortune: formatEuros(entry.fortune),
  };
  return entry.kiosk
    ? t("{rang}. {nom}, propriétaire du Kiosque : {fortune}, {etoiles} étoiles.", vars)
    : t("{rang}. {nom} : {fortune}, {etoiles} étoiles.", vars);
}

function Plaque({ entry, rank, me }: { entry: BoardEntry; rank: number; me: boolean }) {
  return (
    <div className={cx("plaque", me && "plaque--toi", entry.kiosk && "plaque--kiosque")}>
      <span className="invisible">{lecture(entry, rank, me)}</span>
      <span className="plaque__rang chiffres" aria-hidden="true">{formatInt(rank)}</span>
      <span className="plaque__avatar" aria-hidden="true">
        <Avatar species={entry.species} look={{ chapeau: entry.look.chapeau, lunettes: entry.look.lunettes }} crop="tete" />
      </span>
      {/* Le nom d'abord, seul sur sa ligne ; dessous, le Standing et la fortune. */}
      <span className="plaque__qui" aria-hidden="true">
        <span className="plaque__nom">{me ? t("Toi") : entry.pseudo}</span>
        <span className="plaque__chiffres">
          <span className="plaque__standing"><Etoile />{formatInt(entry.standing)}</span>
          <span className="plaque__fortune chiffres">{formatEuros(entry.fortune)}</span>
        </span>
      </span>
    </div>
  );
}

export function Classement() {
  const player = useGame((s) => s.player);
  const [board, setBoard] = useState<Board | null>(cache?.board ?? null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pull, setPull] = useState(0);
  const [mineVisible, setMineVisible] = useState(true);
  const mine = useRef<HTMLLIElement>(null);

  const load = useCallback(async (asked: boolean) => {
    if (cache && Date.now() - cache.at < MIN_REFRESH_MS) {
      setBoard(cache.board);
      if (asked) toast(t("Le classement vient d'être mis à jour."));
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const fresh = await api.leaderboard();
      cache = { board: fresh, at: Date.now() };
      setBoard(fresh);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Rafraîchissement à l'ouverture de l'onglet.
  useEffect(() => {
    void load(false);
  }, [load]);

  // « Tirer pour rafraîchir ».
  useEffect(() => {
    let startY: number | null = null;
    let distance = 0;
    const onStart = (e: TouchEvent) => {
      startY = window.scrollY <= 0 ? e.touches[0]!.clientY : null;
      distance = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      distance = Math.max(0, e.touches[0]!.clientY - startY);
      setPull(window.scrollY <= 0 ? Math.min(distance, 110) : 0);
    };
    const onEnd = () => {
      if (startY !== null && distance > 80 && window.scrollY <= 0) void load(true);
      startY = null;
      setPull(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [load]);

  const entries = board?.entries ?? [];
  const myIndex = player ? entries.findIndex((e) => e.id === player.id) : -1;
  const myEntry = myIndex >= 0 ? entries[myIndex]! : null;
  const shown = entries.slice(0, BOARD_SHOWN);
  const podium = shown.slice(0, 3);
  const rest = shown.slice(3);

  // Ma ligne : épinglée en bas quand elle est hors de l'écran.
  useEffect(() => {
    const el = mine.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setMineVisible(false);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setMineVisible(entry?.isIntersecting ?? false), { threshold: 0.6 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [myIndex, board]);

  const lastFortune = entries.length >= BOARD_SIZE ? entries[entries.length - 1]!.fortune : null;

  return (
    <main className="ecran ecran--onglets classement">
      <Entete
        titre={t("Classement")}
        droite={
          <button type="button" className="entete__bouton" onClick={() => void load(true)} aria-label={t("Rafraîchir le classement")} disabled={loading}>
            <Icon name="rafraichir" className={loading ? "classement__tourne" : undefined} />
          </button>
        }
      />
      <p className="classement__tirer" style={{ height: pull * 0.5, opacity: pull / 80 }} aria-hidden="true">
        {pull > 80 ? t("Relâche pour rafraîchir") : t("Tire pour rafraîchir")}
      </p>

      {failed && entries.length === 0 && (
        <div className="classement__vide" role="alert">
          <p>{t("Le classement ne répond pas.")}</p>
          <Bouton onClick={() => void load(true)}>{t("Réessayer")}</Bouton>
        </div>
      )}
      {!failed && board && entries.length === 0 && (
        <p className="classement__vide">{t("Personne encore. La première place est à prendre.")}</p>
      )}
      {!board && loading && <p className="classement__vide" role="status">{t("Le classement arrive…")}</p>}

      {podium.length > 0 && (
        <ol className="podium cascade" aria-label={t("Les trois premiers")}>
          {podium.map((entry, i) => {
            const me = entry.id === player?.id;
            return (
              <li key={entry.id} className={cx("podium__place", `podium__place--${i + 1}`, me && "podium__place--toi", entry.kiosk && "podium__place--kiosque")}
                ref={me ? mine : undefined}>
                <span className="invisible">{lecture(entry, i + 1, me)}</span>
                <span className="podium__rang" aria-hidden="true">{i + 1}</span>
                <span className="podium__avatar" aria-hidden="true">
                  <Avatar species={entry.species} look={entry.look} />
                </span>
                <span className="podium__nom" aria-hidden="true">{me ? t("Toi") : entry.pseudo}</span>
                <span className="podium__fortune chiffres" aria-hidden="true">{formatEuros(entry.fortune)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {rest.length > 0 && (
        <ol className="plaques cascade" start={4} aria-label={t("La suite du classement")}>
          {rest.map((entry, i) => {
            const me = entry.id === player?.id;
            return (
              <li key={entry.id} ref={me ? mine : undefined}>
                <Plaque entry={entry} rank={i + 4} me={me} />
              </li>
            );
          })}
        </ol>
      )}

      {board && player && (
        myEntry ? (
          (!mineVisible || myIndex >= BOARD_SHOWN) && (
            // Ma plaque est déjà dans la liste quand je suis parmi les premiers : la copie épinglée ne se relit pas.
            <div className="classement__epingle" aria-hidden={myIndex < BOARD_SHOWN || undefined}>
              <Plaque entry={myEntry} rank={myIndex + 1} me />
            </div>
          )
        ) : (
          <div className="classement__epingle">
            <p className="classement__hors" role="status">
              {lastFortune !== null && player.fortune <= lastFortune
                ? t("Tu n'es pas encore classé. Il te manque {montant} pour entrer dans les {n} premiers.", {
                  montant: formatEuros(lastFortune - player.fortune + 1), n: BOARD_SIZE,
                })
                : t("Tu n'es pas encore classé. Ta fortune y sera inscrite d'ici une minute.")}
            </p>
          </div>
        )
      )}
    </main>
  );
}
