// Planche de contrôle (BRIEF.md, section 4.7), visible avec ?planche dans l'adresse :
// toutes les illustrations sur une page, pour juger la cohérence d'un coup d'œil.
// Ce qui manque au registre apparaît en cadre vide, avec son identifiant.

import { useState } from "react";
import { CATALOG } from "../../../shared/catalog";
import { PLACES } from "../../../shared/places";
import { SPECIES } from "../../../shared/rules";
import { TICKETS } from "../../../shared/tickets";
import { skyOf } from "../../app/helpers";
import { Avatar, type AvatarLook } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { MOTIFS, motifBackground } from "../../art/motifs";
import { expectedIds, illustration } from "../../art/registry";
import { buildLayout, cellIds } from "../../engines";
import { palette } from "../../engines/common";
import { Ticket } from "../../ticket/Ticket";
import { Carte } from "../../ui/Carte";
import "./planche.css";

/** Huit garde-robes, de l'arrivée au port jusqu'à la Lune. */
const TENUES: { nom: string; look: AvatarLook }[] = [
  { nom: "à l'arrivée", look: {} },
  { nom: "en gueux", look: { chapeau: "chapeau-journal", lunettes: "lunettes-carton", tenue: "sac-a-patates", accessoire: "ficelle" } },
  { nom: "au Grand Café", look: { chapeau: "beret", lunettes: "lunettes-rondes", tenue: "mariniere", accessoire: "noeud-pap" } },
  { nom: "au Casino", look: { chapeau: "melon", lunettes: "monocle", tenue: "trois-pieces", accessoire: "gousset" } },
  { nom: "au Salon", look: { chapeau: "haut-de-forme", lunettes: "lorgnon", tenue: "smoking", accessoire: "perles" } },
  { nom: "au Cercle", look: { chapeau: "couronne", lunettes: "monocle-saphir", tenue: "cape-imperiale", accessoire: "sautoir" } },
  { nom: "sur le Yacht", look: { chapeau: "casquette-capitaine", lunettes: "lunettes-aviateur", tenue: "habit-amiral", accessoire: "grand-cordon" } },
  { nom: "sur la Lune", look: { chapeau: "anneaux-saturne", lunettes: "lunettes-etoiles", tenue: "cape-aurore", accessoire: "collier-planetes" } },
];

const GROUPES: { titre: string; prefixe: string; fond?: string; large?: boolean }[] = [
  { titre: "Personnages", prefixe: "pnj:" },
  { titre: "Vignettes des tickets", prefixe: "ticket:", fond: "#F7F0E0" },
  { titre: "Constellations", prefixe: "symbole:constellation:", fond: "#1B2A4E" },
  { titre: "Bandit Manchot", prefixe: "symbole:bandit:", fond: "#FFF7E6" },
  { titre: "La Pie Voleuse", prefixe: "symbole:pie:", fond: "#FFF7E6" },
  { titre: "Caviar & Champagne", prefixe: "symbole:mets:", fond: "#FFF7E6" },
  { titre: "Jeux", prefixe: "symbole:morpion:", fond: "#FFF7E6" },
  { titre: "Cartes", prefixe: "symbole:carte:", fond: "#FFF7E6" },
  { titre: "Régate, football, course", prefixe: "symbole:regate:", fond: "#FFF7E6" },
  { titre: "Arcanes (La Bonne Aventure)", prefixe: "symbole:arcane:", fond: "#FFF7E6" },
  { titre: "Pêche au Gros", prefixe: "symbole:peche:", fond: "#FFF7E6" },
  { titre: "Cocktails du Commodore", prefixe: "symbole:cocktail:", fond: "#FFF7E6" },
  { titre: "Le Rouge et le Noir", prefixe: "symbole:roulette:", fond: "#FFF7E6" },
  { titre: "Bâbord, Tribord", prefixe: "symbole:fanal:", fond: "#12303B" },
  { titre: "Éclipse Totale", prefixe: "symbole:astre:", fond: "#1B1440" },
  { titre: "Coefficients", prefixe: "symbole:coef:", fond: "#FFF7E6" },
  { titre: "Pions", prefixe: "symbole:pion:", fond: "#CFEAE6" },
];

function Tuile({ id, fond, large }: { id: string; fond?: string; large?: boolean }) {
  const missing = !illustration(id);
  return (
    <figure className={`tuile${large ? " tuile--large" : ""}${missing ? " tuile--manque" : ""}`}>
      <div className="tuile__dessin" style={fond ? { background: fond } : undefined}>
        <Illustration id={id} />
      </div>
      <figcaption>{id}</figcaption>
    </figure>
  );
}

/** La carte retournable, à toutes ses tailles : un toucher retourne tout le jeu. */
function Cartes() {
  const [dos, setDos] = useState(false);
  const mains = ["Ah", "Ks", "Qd", "Jc", "Th", "9s", "2d"];
  return (
    <div className="planche__cartes" onClick={() => setDos((d) => !d)}>
      {[40, 56, 72, 96].map((largeur) => (
        <div className="planche__main" key={largeur}>
          {mains.map((carte, i) => <Carte key={carte} carte={carte} largeur={largeur} cachee={dos} choisie={i === 1 && !dos} />)}
          <Carte largeur={largeur} />
          <span className="note">{largeur} px</span>
        </div>
      ))}
    </div>
  );
}

export default function Planche() {
  const ids = expectedIds();
  const missing = ids.filter((id) => !illustration(id));
  const items = (slot: string) => CATALOG.filter((i) => i.slot === slot).sort((a, b) => a.price - b.price);
  const extra = ids.filter((id) => id.startsWith("symbole:foot:") || id.startsWith("symbole:course:"));

  return (
    <main className="planche">
      <h1 className="t-titre">Planche de contrôle</h1>
      <p className="note">
        {ids.length} illustrations attendues, {missing.length} manquante{missing.length > 1 ? "s" : ""}.
        {missing.length > 0 && ` Manque : ${missing.join(", ")}.`}
      </p>

      <h2>Avatars : huit espèces, huit garde-robes</h2>
      <div className="planche__avatars">
        {SPECIES.map((s) =>
          TENUES.map((t) => (
            <figure className="tuile" key={`${s}-${t.nom}`}>
              <div className="tuile__dessin"><Avatar species={s} look={t.look} /></div>
              <figcaption>{s}, {t.nom}</figcaption>
            </figure>
          )),
        )}
      </div>

      <h2>Têtes, pour le classement</h2>
      <div className="planche__grille planche__grille--petit">
        {SPECIES.map((s) => (
          <figure className="tuile" key={s}>
            <div className="tuile__dessin"><Avatar species={s} look={TENUES[3]!.look} crop="tete" /></div>
            <figcaption>{s}</figcaption>
          </figure>
        ))}
      </div>

      {(["chapeau", "lunettes", "tenue", "accessoire"] as const).map((slot) => (
        <section key={slot}>
          <h2>Garde-robe : {slot}</h2>
          <div className="planche__grille">
            {items(slot).map((i) => <Tuile key={i.id} id={`item:${i.id}`} fond="#FFF7E6" />)}
          </div>
        </section>
      ))}

      <h2>Lieux, sur leur ciel et leur motif</h2>
      <div className="planche__grille planche__grille--large">
        {PLACES.map((p) => (
          <figure className="tuile tuile--large" key={p.id}>
            <div className="tuile__dessin" style={{ backgroundImage: skyOf(p.id) }}><Illustration id={`place:${p.id}`} /></div>
            <div
              className="tuile__motif"
              style={{
                backgroundImage: `${motifBackground(p.id) ?? "none"}, ${skyOf(p.id)}`,
                backgroundSize: MOTIFS[p.id] ? `${MOTIFS[p.id]!.width}px ${MOTIFS[p.id]!.height}px, 100% 100%` : undefined,
                color: p.text === "nuit" ? "#0E2F3A" : "#E6F2F0",
              }}
            >
              Texte posé sur le motif de {p.short}
            </div>
            <figcaption>place:{p.id}{MOTIFS[p.id] ? "" : " (motif manquant)"}</figcaption>
          </figure>
        ))}
      </div>

      <h2>Résidences</h2>
      <div className="planche__grille planche__grille--large">
        <Tuile id="decor:banc" fond="linear-gradient(#BEE7F5, #FDF3D0)" large />
        {items("residence").map((i) => <Tuile key={i.id} id={`item:${i.id}`} fond="linear-gradient(#F6D9A8, #E9A45C)" large />)}
        <Tuile id="item:kiosque" fond="linear-gradient(#BEE7F5, #FDF3D0)" large />
      </div>

      <h2>Véhicules</h2>
      <div className="planche__grille planche__grille--moyen">
        {items("vehicule").map((i) => <Tuile key={i.id} id={`item:${i.id}`} fond="#BEE7F5" />)}
      </div>

      <h2>Trésors</h2>
      <div className="planche__grille">
        {items("tresor").map((i) => <Tuile key={i.id} id={`item:${i.id}`} fond="#FFF7E6" />)}
      </div>

      {GROUPES.map((g) => (
        <section key={g.prefixe}>
          <h2>{g.titre}</h2>
          <div className="planche__grille planche__grille--petit">
            {ids.filter((id) => id.startsWith(g.prefixe)).map((id) => <Tuile key={id} id={id} fond={g.fond} />)}
            {g.prefixe === "symbole:regate:" && extra.map((id) => <Tuile key={id} id={id} fond={g.fond} />)}
          </div>
        </section>
      ))}

      <h2>Cartes à retourner (toucher pour retourner le jeu)</h2>
      <Cartes />

      <h2>Les trente tickets, neufs</h2>
      <div className="planche__tickets">
        {TICKETS.map((t) => <Ticket key={t.id} def={t} width={200} mini />)}
      </div>

      <h2>Les trente tickets, grattés (un gain moyen, puis un perdant)</h2>
      <div className="planche__tickets">
        {TICKETS.flatMap((t) =>
          [palette(t)[4]!, 0].map((gain) => {
            const layout = buildLayout(t, gain, 20261125 + gain);
            return (
              <Ticket
                key={`${t.id}-${gain}`}
                def={t}
                layout={layout}
                seed={20261125 + gain}
                revealed={new Set(cellIds(layout))}
                width={300}
                etat={gain > 0 ? "gagnant" : "perdu"}
              />
            );
          }),
        )}
      </div>
    </main>
  );
}
