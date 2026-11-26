// Bienvenue, création et récupération de compte (BRIEF.md, sections 5.4 et 11).
// Pas d'adresse e-mail, pas de mot de passe : un pseudo et une espèce.
// Le premier écran porte l'accroche du récit, et un choix de langue discret : on peut
// passer à l'anglais avant même d'avoir un compte.

import { useState, type FormEvent } from "react";
import { SPECIES, formatCode, normalizeCode, validatePseudo } from "../../../shared/rules";
import { ApiFailure } from "../../app/api";
import { failureText, login, patchSettings, signup, useGame } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { LANGS, t, type Lang } from "../../i18n";
import { speciesName } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import "./bienvenue.css";

type Step = "accueil" | "creation" | "retrouver";

/** Chaque langue se nomme dans sa propre langue : ces deux mots ne se traduisent pas. */
const LANGUES: Record<Lang, string> = { fr: "Français", en: "English" };

/** « Français | English », en haut de l'affiche. Changer de langue remonte l'écran d'un coup. */
function Langues() {
  const langue = useGame((s) => s.settings.langue);
  return (
    <div className="bienvenue__langues" role="group" aria-label={t("Langue")}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          className={cx("bienvenue__langue", l === langue && "bienvenue__langue--choisie")}
          aria-pressed={l === langue}
          onClick={() => patchSettings({ langue: l })}
        >
          {LANGUES[l]}
        </button>
      ))}
    </div>
  );
}

export function Bienvenue() {
  const [step, setStep] = useState<Step>("accueil");
  const sandbox = useGame((s) => s.sandbox);
  if (step === "creation") return <Creation onBack={() => setStep("accueil")} />;
  if (step === "retrouver") return <Retrouver onBack={() => setStep("accueil")} />;
  return (
    <main className="ecran bienvenue">
      <div className="bienvenue__affiche">
        <Langues />
        <div className="bienvenue__decor" aria-hidden="true">
          <Illustration id="place:kiosque" />
        </div>
        <h1 className="bienvenue__logo">Grattouille</h1>
        <p className="bienvenue__lieu">Grattouille-les-Bains</p>
        <p className="bienvenue__accroche">{t("Sans un sou, mais la chance scandaleusement de ton côté.")}</p>
      </div>
      <div className="bienvenue__actions">
        <Bouton bloc onClick={() => setStep("creation")}>{t("Commencer")}</Bouton>
        {!sandbox && <Bouton variante="secondaire" bloc onClick={() => setStep("retrouver")}>{t("J'ai déjà un compte")}</Bouton>}
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
          ? t("Ce pseudo est réservé. Essaie avec un autre.")
          : t("Il faut 3 à 16 caractères : lettres, chiffres, espace ou tiret."),
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signup(check.pseudo, species);
    } catch (err) {
      if (err instanceof ApiFailure && err.code === "PSEUDO_TAKEN") setError(t("Ce pseudo est pris. Essaie avec un autre."));
      else if (err instanceof ApiFailure && err.code === "PSEUDO_INVALID") setError(t("Ce pseudo ne convient pas. Essaie avec un autre."));
      else setError(failureText(err));
      setBusy(false);
    }
  };

  return (
    <main className="ecran bienvenue bienvenue--formulaire">
      <form className="bienvenue__form" onSubmit={submit} noValidate>
        <h1 className="t-titre">{t("Qui débarque au port ?")}</h1>
        <fieldset className="especes">
          <legend className="t-second">{t("Choisis ton espèce. Tu pourras en changer quand tu veux.")}</legend>
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
                <span>{speciesName(s)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <label className="champ">
          <span className="champ__label">{t("Ton pseudo")}</span>
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
            {error ?? t("3 à 16 caractères. C'est le nom que verra tout le classement.")}
          </span>
        </label>
        <div className="bienvenue__actions">
          <Bouton type="submit" bloc attente={busy}>{t("Entrer à Grattouille-les-Bains")}</Bouton>
          <Bouton variante="texte" onClick={onBack} disabled={busy}>{t("Retour")}</Bouton>
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
      setError(t("Entre ton pseudo et ton code de 16 caractères, tel que tu l'as noté."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(pseudo, code);
    } catch (err) {
      setError(err instanceof ApiFailure && err.code === "UNAUTHORIZED" ? t("Pseudo ou code incorrect.") : failureText(err));
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
        <h1 className="t-titre">{t("Te revoilà au port !")}</h1>
        <p className="t-second">{t("Ton pseudo et ton code de récupération suffisent : ni adresse e-mail, ni mot de passe.")}</p>
        <label className="champ">
          <span className="champ__label">{t("Ton pseudo")}</span>
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
          <span className="champ__label">{t("Ton code de récupération")}</span>
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
            {error ?? t("16 caractères, affichés dans Réglages, « Mon code de récupération ».")}
          </span>
        </label>
        <div className="bienvenue__actions">
          <Bouton type="submit" bloc attente={busy}>{t("Retrouver mon compte")}</Bouton>
          <Bouton variante="texte" onClick={onBack} disabled={busy}>{t("Retour")}</Bouton>
        </div>
      </form>
    </main>
  );
}
