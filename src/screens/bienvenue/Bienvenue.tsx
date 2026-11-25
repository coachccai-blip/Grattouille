// Bienvenue, création et récupération de compte (BRIEF.md, sections 3, 5.4 et 11).
// Pas d'adresse e-mail, pas de mot de passe : un pseudo et une espèce.

import { useState, type FormEvent } from "react";
import { SPECIES, SPECIES_LABELS, formatCode, normalizeCode, validatePseudo } from "../../../shared/rules";
import { ApiFailure } from "../../app/api";
import { failureText, login, signup, useGame } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import "./bienvenue.css";

type Step = "accueil" | "creation" | "retrouver";

export function Bienvenue() {
  const [step, setStep] = useState<Step>("accueil");
  const sandbox = useGame((s) => s.sandbox);
  if (step === "creation") return <Creation onBack={() => setStep("accueil")} />;
  if (step === "retrouver") return <Retrouver onBack={() => setStep("accueil")} />;
  return (
    <main className="ecran bienvenue">
      <div className="bienvenue__affiche">
        <div className="bienvenue__decor" aria-hidden="true">
          <Illustration id="place:kiosque" />
        </div>
        <h1 className="bienvenue__logo">Grattouille</h1>
        <p className="bienvenue__lieu">Grattouille-les-Bains</p>
        <p className="bienvenue__accroche">
          Tu débarques au port avec 4 € en poche. Ici, la chance est scandaleusement de ton côté.
        </p>
      </div>
      <div className="bienvenue__actions">
        {/* Mention visible dès le premier écran (section 16.7). */}
        <p className="bienvenue__mention">Jeu de fiction. Aucun argent réel. Réservé aux adultes.</p>
        <Bouton bloc onClick={() => setStep("creation")}>Commencer</Bouton>
        {!sandbox && <Bouton variante="secondaire" bloc onClick={() => setStep("retrouver")}>J'ai déjà un compte</Bouton>}
      </div>
    </main>
  );
}

function Creation({ onBack }: { onBack: () => void }) {
  const [species, setSpecies] = useState<string>("renard");
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const check = validatePseudo(pseudo);
    if (!check.ok) {
      setError(
        check.reason === "refused"
          ? "Ce pseudo est réservé. Essaie avec un autre."
          : "Il faut 3 à 16 caractères : lettres, chiffres, espace ou tiret.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signup(check.pseudo, species);
    } catch (err) {
      if (err instanceof ApiFailure && err.code === "PSEUDO_TAKEN") setError("Ce pseudo est pris. Essaie avec un autre.");
      else if (err instanceof ApiFailure && err.code === "PSEUDO_INVALID") setError("Ce pseudo ne convient pas. Essaie avec un autre.");
      else setError(failureText(err));
      setBusy(false);
    }
  };

  return (
    <main className="ecran bienvenue bienvenue--formulaire">
      <form className="bienvenue__form" onSubmit={submit} noValidate>
        <h1 className="t-titre">Qui débarque au port ?</h1>
        <fieldset className="especes">
          <legend className="t-second">Choisis ton espèce. Tu pourras en changer quand tu veux.</legend>
          <div className="especes__grille">
            {SPECIES.map((s) => (
              <button
                key={s}
                type="button"
                className={cx("espece", s === species && "espece--choisie")}
                aria-pressed={s === species}
                onClick={() => setSpecies(s)}
              >
                <Avatar species={s} crop="tete" />
                <span>{SPECIES_LABELS[s]}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <label className="champ">
          <span className="champ__label">Ton pseudo</span>
          <input
            className="champ__saisie"
            value={pseudo}
            onChange={(e) => {
              setPseudo(e.target.value);
              setError(null);
            }}
            maxLength={16}
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={error ? true : undefined}
            aria-describedby="pseudo-aide"
          />
          <span id="pseudo-aide" className={cx("champ__aide", error && "champ__aide--erreur")} role={error ? "alert" : undefined}>
            {error ?? "3 à 16 caractères. C'est le nom que verra tout le classement."}
          </span>
        </label>
        <div className="bienvenue__actions">
          <Bouton type="submit" bloc attente={busy}>Entrer à Grattouille-les-Bains</Bouton>
          <Bouton variante="texte" onClick={onBack} disabled={busy}>Retour</Bouton>
        </div>
      </form>
    </main>
  );
}

function Retrouver({ onBack }: { onBack: () => void }) {
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (pseudo.trim().length < 3 || !normalizeCode(code)) {
      setError("Entre ton pseudo et ton code de 16 caractères, tel que tu l'as noté.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(pseudo, code);
    } catch (err) {
      setError(err instanceof ApiFailure && err.code === "UNAUTHORIZED" ? "Pseudo ou code incorrect." : failureText(err));
      setBusy(false);
    }
  };

  /** Affiche le code par groupes de quatre, en capitales, à mesure de la saisie. */
  const onCode = (value: string) => {
    const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    setCode(formatCode(raw));
    setError(null);
  };

  return (
    <main className="ecran bienvenue bienvenue--formulaire">
      <form className="bienvenue__form" onSubmit={submit} noValidate>
        <h1 className="t-titre">Retrouver mon compte</h1>
        <p className="t-second">Le pseudo et le code de récupération suffisent. Pas d'adresse e-mail, pas de mot de passe.</p>
        <label className="champ">
          <span className="champ__label">Ton pseudo</span>
          <input
            className="champ__saisie"
            value={pseudo}
            onChange={(e) => {
              setPseudo(e.target.value);
              setError(null);
            }}
            maxLength={32}
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>
        <label className="champ">
          <span className="champ__label">Ton code de récupération</span>
          <input
            className="champ__saisie champ__saisie--code"
            value={code}
            onChange={(e) => onCode(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={error ? true : undefined}
            aria-describedby="code-aide"
          />
          <span id="code-aide" className={cx("champ__aide", error && "champ__aide--erreur")} role={error ? "alert" : undefined}>
            {error ?? "16 caractères, affichés dans Réglages, « Mon code de récupération »."}
          </span>
        </label>
        <div className="bienvenue__actions">
          <Bouton type="submit" bloc attente={busy}>Retrouver mon compte</Bouton>
          <Bouton variante="texte" onClick={onBack} disabled={busy}>Retour</Bouton>
        </div>
      </form>
    </main>
  );
}
