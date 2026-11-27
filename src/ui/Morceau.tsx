// Un écran chargé à la demande peut ne pas arriver : la page était ouverte pendant une mise
// à jour du jeu, et le fichier qu'elle réclame n'existe plus ; ou le réseau a lâché en
// route. Plutôt qu'un écran blanc, une invitation à recharger : la partie est côté serveur,
// rien n'est perdu.

import { Component, type ReactNode } from "react";
import { Icon } from "../art/icons";
import { t } from "../i18n";
import { Bouton } from "./Bouton";

interface Props {
  children: ReactNode;
  /** Une feuille posée par-dessus un écran : si elle ne vient pas, on ne montre rien à sa place. */
  discret?: boolean;
}

export class Morceau extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    if (this.props.discret) return null;
    return (
      <main className="ecran panne" role="alert">
        <p className="panne__logo" aria-hidden="true">Grattouille</p>
        <Icon name="rafraichir" size={40} />
        <h1 className="t-titre">{t("Grattouille a fait peau neuve.")}</h1>
        <p>{t("Recharge la page pour continuer : ta fortune et tes tickets n'ont pas bougé.")}</p>
        <Bouton bloc onClick={() => window.location.reload()}>{t("Recharger")}</Bouton>
      </main>
    );
  }
}
