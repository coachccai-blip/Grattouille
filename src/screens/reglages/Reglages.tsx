// Réglages (BRIEF.md, sections 3, 11 et 12.2) : son, vibrations, animations
// réduites, code de récupération, suppression du compte, à propos.

import { useState, type FormEvent } from "react";
import { formatEuros, formatInt } from "../../../shared/format";
import { formatCode, pseudoKey } from "../../../shared/rules";
import { ticketById } from "../../../shared/tickets";
import { deleteAccount, failureText, patchSettings, toast, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { hapticsAvailable } from "../../fx/haptics";
import { Bouton } from "../../ui/Bouton";
import { Entete, Interrupteur } from "../../ui/Commun";
import "./reglages.css";
import "../bienvenue/bienvenue.css";

export function Reglages() {
  const player = useGame((s) => s.player);
  const auth = useGame((s) => s.auth);
  const settings = useGame((s) => s.settings);
  const systemCalm = useGame((s) => s.systemCalm);
  const sandbox = useGame((s) => s.sandbox);
  const [codeShown, setCodeShown] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!player) return null;

  const code = auth ? formatCode(auth.code) : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Code copié. Garde-le dans un endroit sûr.");
    } catch {
      toast("Impossible de copier ici. Note le code à la main.", "erreur");
    }
  };

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (pseudoKey(confirm) !== pseudoKey(player.pseudo)) {
      setError("Ce n'est pas ton pseudo. Rien n'a été supprimé.");
      return;
    }
    setBusy(true);
    try {
      await deleteAccount();
      toast("Compte supprimé. Bon vent.");
    } catch (err) {
      setError(failureText(err));
      setBusy(false);
    }
  };

  const best = player.stats.bestTicket ? ticketById(player.stats.bestTicket) : undefined;

  return (
    <main className="ecran reglages">
      <Entete titre="Réglages" retour />

      <section className="rubrique" aria-label="Confort">
        <Interrupteur icon={settings.son ? "son" : "son-coupe"} label="Son" checked={settings.son} onChange={(son) => patchSettings({ son })} />
        <Interrupteur
          icon="vibration"
          label="Vibrations"
          aide={hapticsAvailable() ? undefined : "Ce navigateur ne sait pas faire vibrer le téléphone."}
          checked={settings.vibrations}
          onChange={(vibrations) => patchSettings({ vibrations })}
        />
        <Interrupteur
          icon="calme"
          label="Animations réduites"
          aide={systemCalm ? "Déjà demandé par les réglages de ton téléphone." : "Fondus courts, pas de particules, fêtes en image fixe."}
          checked={settings.calme || systemCalm}
          onChange={(calme) => patchSettings({ calme })}
        />
      </section>

      {!sandbox && (
        <section className="rubrique" aria-label="Mon code de récupération">
          <h2 className="rubrique__titre">Mon code de récupération</h2>
          <p>Ce code est la seule clé de ta fortune. Note-le quelque part.</p>
          <p className="note">
            Pas d'adresse e-mail, pas de mot de passe : sans ce code, un stockage vidé ou un téléphone perdu fait perdre le compte.
          </p>
          {codeShown ? (
            <>
              <output className="code">{code}</output>
              <Bouton variante="secondaire" onClick={() => void copy()}>
                <Icon name="copier" size={20} /> Copier le code
              </Bouton>
              <p className="note">Pour retrouver ton compte ailleurs : « J'ai déjà un compte », ton pseudo ({player.pseudo}) et ce code.</p>
            </>
          ) : (
            <Bouton
              variante="secondaire"
              onClick={() => {
                setCodeShown(true);
                patchSettings({ codeNote: true });
              }}
            >
              <Icon name="cle" size={20} /> Afficher mon code
            </Bouton>
          )}
        </section>
      )}

      <section className="rubrique" aria-label="Carnet de bord">
        <h2 className="rubrique__titre">Carnet de bord</h2>
        <dl className="carnet-de-bord">
          <div><dt>Tickets grattés</dt><dd className="chiffres">{formatInt(player.stats.tickets)}</dd></div>
          <div><dt>Tickets gagnants</dt><dd className="chiffres">{formatInt(player.stats.winners)}</dd></div>
          <div><dt>Misé en tout</dt><dd className="chiffres">{formatEuros(player.stats.wagered)}</dd></div>
          <div><dt>Gagné en tout</dt><dd className="chiffres">{formatEuros(player.stats.won)}</dd></div>
          <div>
            <dt>Plus beau gain</dt>
            <dd className="chiffres">{player.stats.bestGain > 0 ? `${formatEuros(player.stats.bestGain)}${best ? `, ${best.name}` : ""}` : "pas encore"}</dd>
          </div>
          <div><dt>Jackpots</dt><dd className="chiffres">{formatInt(player.stats.jackpots)}</dd></div>
        </dl>
      </section>

      <section className="rubrique" aria-label="À propos">
        <h2 className="rubrique__titre">À propos</h2>
        <p><strong>Jeu de fiction. Aucun argent réel.</strong> Réservé aux adultes.</p>
        <p className="note">
          Grattouille imite le plaisir de gratter, pas le jeu d'argent. Rien ne s'achète avec de vrais euros, rien ne se
          gagne en vrais euros, et les gains ne se convertissent en rien. Chaque ticket affiche son tableau de lots et ses
          chances réelles.
        </p>
        <p className="note">
          On débarque sans un sou, et on n'est jamais bloqué : qui n'a plus de quoi jouer trouve un ticket par terre,
          toujours gagnant. De temps en temps, la chance en laisse traîner un pour tout le monde.
        </p>
        <p className="note">
          Les grands nombres : 1 M€, un million d'euros ; 1 Md€, un milliard ; 1 Bn€, un billion, c'est-à-dire mille
          milliards. Oui, ça existe. Non, personne n'en a jamais vu.
        </p>
        <h3 className="reglages__sous-titre">Dans la vraie vie</h3>
        <p>
          Dans la vraie vie, c'est l'inverse. Un vrai ticket à gratter reverse en moyenne autour de 70 % des mises, et
          entre un ticket sur trois et un sur quatre est gagnant, souvent juste pour rembourser la mise. Ici, chaque euro
          misé en rapporte plus de deux : c'est pour ça que c'est un jeu.
        </p>
        <p>
          Si le jeu d'argent pèse sur toi ou sur un proche : Joueurs Info Service,{" "}
          <a className="reglages__numero" href="tel:+33974751313">09 74 75 13 13</a>, appel anonyme et non surtaxé, tous les
          jours de 8 h à 2 h.
        </p>
        <h3 className="reglages__sous-titre">Vie privée</h3>
        <p className="note">
          Un pseudo et un identifiant tiré au hasard, rien d'autre. Aucun traceur, aucune statistique tierce, aucune
          publicité. Sur ce téléphone, le jeu ne garde que ton identifiant, ton code, tes réglages et la liste des tickets
          grattés en attente d'envoi.
        </p>
        <p className="note">Grattouille, version 1.1.</p>
      </section>

      {!sandbox && (
        <section className="rubrique reglages__danger" aria-label="Supprimer mon compte">
          <h2 className="rubrique__titre">Supprimer mon compte</h2>
          {deleting ? (
            <form className="reglages__suppression" onSubmit={remove} noValidate>
              <p>
                Ta fortune, tes biens et ta place au classement seront effacés pour de bon, et ton pseudo redeviendra libre.
                Pour confirmer, écris ton pseudo : <strong>{player.pseudo}</strong>
              </p>
              <label className="champ">
                <span className="champ__label">Ton pseudo</span>
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
                <span className="bouton__texte">Supprimer mon compte pour de bon</span>
              </button>
              <Bouton variante="texte" onClick={() => setDeleting(false)} disabled={busy}>Finalement non</Bouton>
            </form>
          ) : (
            <Bouton variante="secondaire" onClick={() => setDeleting(true)}>
              <Icon name="corbeille" size={20} /> Supprimer mon compte
            </Bouton>
          )}
        </section>
      )}
    </main>
  );
}
