// Réglages (BRIEF.md, sections 3, 11 et 12.2) : langue, son, vibrations, animations
// réduites, code de récupération, carnet de bord, à propos, suppression du compte.

import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { formatEuros, formatInt } from "../../../shared/format";
import { formatCode, pseudoKey } from "../../../shared/rules";
import { ticketById } from "../../../shared/tickets";
import { deleteAccount, failureText, patchSettings, toast, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { playClick, playRefuse } from "../../fx/audio";
import { hapticsAvailable } from "../../fx/haptics";
import { LANGS, t, type Lang } from "../../i18n";
import { ticketName } from "../../i18n/noms";
import { Bouton } from "../../ui/Bouton";
import { Entete, Interrupteur } from "../../ui/Commun";
import "./reglages.css";
import "../bienvenue/bienvenue.css";

/** Chaque langue se nomme dans sa propre langue : on retrouve la sienne sans savoir lire l'autre. */
const NOMS_DES_LANGUES: Record<Lang, string> = { fr: "Français", en: "English" };

const VERSION = "2.1";

/**
 * Changer de langue remonte tout l'écran (main.tsx). Ce que les réglages avaient en
 * main à cet instant passe par ici, pour qu'ils se rouvrent au même endroit.
 */
interface Reprise {
  y: number;
  codeShown: boolean;
  deleting: boolean;
  confirm: string;
}
let reprise: Reprise | null = null;

export function Reglages() {
  const player = useGame((s) => s.player);
  const auth = useGame((s) => s.auth);
  const settings = useGame((s) => s.settings);
  const systemCalm = useGame((s) => s.systemCalm);
  const sandbox = useGame((s) => s.sandbox);
  const [retour] = useState(() => reprise);
  const [codeShown, setCodeShown] = useState(retour?.codeShown ?? false);
  const [deleting, setDeleting] = useState(retour?.deleting ?? false);
  const [confirm, setConfirm] = useState(retour?.confirm ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const langues = useRef<HTMLDivElement>(null);

  // Après un changement de langue : même hauteur de page, et le choix garde la main au clavier.
  // La coquille remet tout nouvel écran en haut de page (App.tsx), après cet effet : la
  // hauteur est donc reposée une seconde fois, juste avant l'affichage.
  useLayoutEffect(() => {
    reprise = null;
    if (!retour) return;
    const replacer = () => window.scrollTo(0, retour.y);
    replacer();
    const image = requestAnimationFrame(replacer);
    langues.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(image);
  }, [retour]);

  if (!player) return null;

  const choisirLangue = (langue: Lang) => {
    if (langue === settings.langue) return;
    // Un déclic par changement, chaque langue sa note.
    playClick(LANGS.indexOf(langue));
    reprise = { y: window.scrollY, codeShown, deleting, confirm };
    patchSettings({ langue });
  };

  /** Un groupe de boutons radio : les flèches passent d'un choix à l'autre. */
  const auClavier = (e: KeyboardEvent<HTMLDivElement>) => {
    const sens = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (sens === 0) return;
    e.preventDefault();
    const i = LANGS.indexOf(settings.langue);
    choisirLangue(LANGS[(i + sens + LANGS.length) % LANGS.length]!);
  };

  const code = auth ? formatCode(auth.code) : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast(t("Code copié."));
    } catch {
      toast(t("Impossible de copier ici. Note le code à la main."), "erreur");
    }
  };

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (pseudoKey(confirm) !== pseudoKey(player.pseudo)) {
      playRefuse();
      setError(t("Ce n'est pas ton pseudo. Rien n'a été supprimé."));
      return;
    }
    setBusy(true);
    try {
      // Le magasin d'état annonce lui-même que le compte est supprimé.
      await deleteAccount();
    } catch (err) {
      playRefuse();
      setError(failureText(err));
      setBusy(false);
    }
  };

  const best = player.stats.bestGain > 0 && player.stats.bestTicket && ticketById(player.stats.bestTicket)
    ? ticketName(player.stats.bestTicket)
    : null;
  // « Pour confirmer, écris ton pseudo : Zabeth », le pseudo en gras, où que la langue le place.
  const [avantPseudo = "", apresPseudo = ""] = t("Pour confirmer, écris ton pseudo : {pseudo}").split("{pseudo}");

  return (
    <main className={retour ? "ecran reglages reglages--reprise" : "ecran reglages cascade"}>
      <Entete titre={t("Réglages")} retour />

      {/* Le titre nomme le groupe de boutons radio : une seule annonce pour un lecteur d'écran. */}
      <div className="rubrique reglages__langue">
        <h2 className="rubrique__titre" id="reglages-langue">{t("Langue")}</h2>
        <div className="langue" role="radiogroup" aria-labelledby="reglages-langue" ref={langues} onKeyDown={auClavier}>
          {LANGS.map((langue) => {
            const choisie = langue === settings.langue;
            return (
              <button
                key={langue}
                type="button"
                role="radio"
                aria-checked={choisie}
                tabIndex={choisie ? 0 : -1}
                lang={langue}
                className="langue__choix"
                data-son="choix"
                onClick={() => choisirLangue(langue)}
              >
                {choisie && <Icon name="coche" size={20} />}
                {NOMS_DES_LANGUES[langue]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rubrique reglages__confort">
        <Interrupteur icon={settings.son ? "son" : "son-coupe"} label={t("Son")} checked={settings.son} onChange={(son) => patchSettings({ son })} />
        <Interrupteur
          icon={settings.musique ? "musique" : "musique-coupee"}
          label={t("Musique")}
          checked={settings.musique}
          onChange={(musique) => patchSettings({ musique })}
        />
        <Interrupteur
          icon="vibration"
          label={t("Vibrations")}
          aide={hapticsAvailable() ? undefined : t("Ce navigateur ne sait pas faire vibrer le téléphone.")}
          checked={settings.vibrations}
          onChange={(vibrations) => patchSettings({ vibrations })}
        />
        <Interrupteur
          icon="calme"
          label={t("Animations réduites")}
          aide={systemCalm ? t("Déjà demandé par les réglages de ton téléphone.") : t("Fondus courts, pas de particules, fêtes en image fixe.")}
          checked={settings.calme || systemCalm}
          onChange={(calme) => patchSettings({ calme })}
        />
      </div>

      {!sandbox && (
        <section className="rubrique" aria-labelledby="reglages-code">
          <h2 className="rubrique__titre" id="reglages-code">{t("Mon code de récupération")}</h2>
          <p>
            {t("Pas d'adresse e-mail, pas de mot de passe : ce code est la seule clé de ta fortune. Note-le quelque part. Sans lui, un téléphone perdu ou vidé, et le compte est perdu.")}
          </p>
          {codeShown ? (
            <>
              <output className="code">{code}</output>
              <Bouton variante="secondaire" onClick={() => void copy()}>
                <Icon name="copier" size={20} /> {t("Copier le code")}
              </Bouton>
              <p className="note">
                {t("Pour retrouver ton compte sur un autre téléphone, il suffit de ton pseudo ({pseudo}) et de ce code.", { pseudo: player.pseudo })}
              </p>
            </>
          ) : (
            <Bouton
              variante="secondaire"
              onClick={() => {
                setCodeShown(true);
                patchSettings({ codeNote: true });
              }}
            >
              <Icon name="cle" size={20} /> {t("Afficher mon code")}
            </Bouton>
          )}
        </section>
      )}

      <section className="rubrique" aria-labelledby="reglages-carnet">
        <h2 className="rubrique__titre" id="reglages-carnet">{t("Carnet de bord")}</h2>
        <dl className="carnet-de-bord">
          <div><dt>{t("Tickets grattés")}</dt><dd className="chiffres">{formatInt(player.stats.tickets)}</dd></div>
          <div><dt>{t("Tickets gagnants")}</dt><dd className="chiffres">{formatInt(player.stats.winners)}</dd></div>
          <div><dt>{t("Misé en tout")}</dt><dd className="chiffres">{formatEuros(player.stats.wagered)}</dd></div>
          <div><dt>{t("Gagné en tout")}</dt><dd className="chiffres">{formatEuros(player.stats.won)}</dd></div>
          <div>
            <dt>{t("Plus beau gain")}</dt>
            <dd className="chiffres">
              {player.stats.bestGain > 0 ? formatEuros(player.stats.bestGain) : t("pas encore")}
              {best && <span className="carnet-de-bord__ticket">{best}</span>}
            </dd>
          </div>
          <div><dt>{t("Jackpots")}</dt><dd className="chiffres">{formatInt(player.stats.jackpots)}</dd></div>
        </dl>
      </section>

      <section className="rubrique" aria-labelledby="reglages-apropos">
        <h2 className="rubrique__titre" id="reglages-apropos">{t("À propos")}</h2>

        <h3 className="reglages__sous-titre">{t("Les tickets trouvés")}</h3>
        <p>
          {t("On débarque sans un sou, et on n'est jamais bloqué : qui n'a plus de quoi jouer trouve un ticket par terre, toujours gagnant. De temps en temps, la chance en laisse traîner un pour tout le monde.")}
        </p>

        <h3 className="reglages__sous-titre">{t("Les grands nombres")}</h3>
        <p>
          {t("{million}, c'est un million d'euros ; {milliard}, un milliard ; {billion}, un billion, soit mille milliards. Oui, ça existe. Non, personne n'en a jamais vu.", {
            million: formatEuros(1_000_000),
            milliard: formatEuros(1_000_000_000),
            billion: formatEuros(1_000_000_000_000),
          })}
        </p>

        <h3 className="reglages__sous-titre">{t("Dans la vraie vie")}</h3>
        <p>
          {t("Un vrai ticket à gratter reverse en moyenne autour de 70 % des mises, et entre un ticket sur trois et un sur quatre est gagnant, souvent juste pour rembourser la mise. Ici, chaque euro misé en rapporte plus de deux : c'est pour ça que c'est un jeu.")}
        </p>
        <p>
          {t("Si le jeu d'argent pèse sur toi ou sur un proche : Joueurs Info Service, appel anonyme et non surtaxé, tous les jours de 8 h à 2 h.")}
        </p>
        <a className="reglages__numero" href="tel:+33974751313">{t("09 74 75 13 13")}</a>

        <h3 className="reglages__sous-titre">{t("Vie privée")}</h3>
        <p>
          {t("Un pseudo et un identifiant tiré au hasard, rien d'autre : ni traceur, ni statistique tierce, ni publicité. Sur ce téléphone, le jeu ne garde que ton identifiant, ton code, tes réglages et les tickets grattés en attente d'envoi.")}
        </p>
        <p className="note">{t("Grattouille, version {version}.", { version: VERSION })}</p>
      </section>

      {!sandbox && (
        <section className="rubrique reglages__danger" aria-label={t("Supprimer mon compte")}>
          {deleting ? (
            <form className="reglages__suppression" onSubmit={remove} noValidate>
              <p>{t("Ta fortune, tes biens et ta place au classement seront effacés pour de bon, et ton pseudo redeviendra libre.")}</p>
              <label className="champ">
                <span className="champ__label">{avantPseudo}<strong>{player.pseudo}</strong>{apresPseudo}</span>
                <input
                  className="champ__saisie"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError(null);
                  }}
                  autoComplete="off"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={error ? true : undefined}
                />
                {error && <span className="champ__aide champ__aide--erreur" role="alert">{error}</span>}
              </label>
              <button type="submit" className="bouton bouton--bloc reglages__supprimer" disabled={busy}>
                <span className="bouton__texte">{t("Supprimer pour de bon")}</span>
              </button>
              <Bouton variante="texte" onClick={() => setDeleting(false)} disabled={busy}>{t("Finalement non")}</Bouton>
            </form>
          ) : (
            <Bouton variante="secondaire" onClick={() => setDeleting(true)}>
              <Icon name="corbeille" size={20} /> {t("Supprimer mon compte")}
            </Bouton>
          )}
        </section>
      )}
    </main>
  );
}
