// Le tout premier ticket, sous cloche : celui du quai, par lequel tout a commencé, et que
// la vraie fin (« Huit as de cœur ») fait exposer sur le Domaine. Il ne se vend pas, ne
// rapporte rien, ne compte pas dans le Standing : c'est un souvenir. Il est gratté
// jusqu'au carton, bien sûr.
//
// Ce module n'est chargé que pour une Légende (Domaine.tsx). La cloche se touche : elle
// dit ce qu'elle est.

import { toast } from "../../app/store";
import { t } from "../../app/suite/mots";
import { C, METAL, shade } from "../../art/kit";

export default function Cloche() {
  return (
    <button
      type="button"
      className="domaine__cloche"
      onClick={() => toast(t("Ton tout premier ticket : celui du quai. Gratté jusqu'au carton."))}
      aria-label={t("Ton tout premier ticket, sous cloche")}
    >
      <svg viewBox="0 0 48 58" width="100%" aria-hidden="true" focusable="false">
        {/* L'ombre, puis le socle de bois cerclé de laiton */}
        <ellipse cx="25" cy="54.5" rx="20" ry="2.6" fill={C.nuit} fillOpacity="0.3" />
        <path d="M5 46.5V50Q5 54 24 54Q43 54 43 50V46.5Z" fill={C.boisFonce} />
        <ellipse cx="24" cy="46.5" rx="19" ry="4" fill={C.bois} />
        <ellipse cx="24" cy="46.5" rx="16.2" ry="3" fill="none" stroke={METAL.laiton} strokeWidth="1.3" />
        {/* Le ticket du quai, posé de biais : jaune mimosa, sa case grattée jusqu'au carton, son talon perforé */}
        <g transform="rotate(-13 24 33)">
          <rect x="12.5" y="25.5" width="23" height="16" rx="2" fill={C.mimosaFonce} />
          <rect x="12.5" y="24" width="23" height="16" rx="2" fill={C.mimosa} />
          <rect x="15.5" y="27.5" width="11.5" height="9" rx="1.2" fill={C.creme} />
          <path d="M17.6 33.4L20 30.200L22 32.800L24.8 29.6" fill="none" stroke={shade(C.kraft, -0.2)} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30.5 25V39" fill="none" stroke={C.nuit} strokeWidth="1" strokeDasharray="1.6 1.9" />
          <circle cx="33" cy="32" r="1.3" fill={C.nuit} />
        </g>
        {/* La cloche de verre : un voile, un contour, un reflet */}
        <path d="M8 46V24A16 16 0 0 1 40 24V46Z" fill={C.blanc} fillOpacity="0.16" />
        <path d="M8 46V24A16 16 0 0 1 40 24V46" fill="none" stroke={C.blanc} strokeOpacity="0.62" strokeWidth="1.3" />
        <path d="M12.5 39V25Q12.5 17.5 18 13.5" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="1.8" strokeLinecap="round" />
        {/* Le bouton de laiton */}
        <rect x="22.6" y="6.5" width="2.8" height="3.5" fill={METAL.laiton} />
        <circle cx="24" cy="5" r="3" fill={METAL.laiton} />
        {/* Un éclat : il brille encore */}
        <path className="domaine__cloche-eclat" d="M41 9L42.3 13.2L46.5 14.5L42.3 15.8L41 20L39.7 15.8L35.5 14.5L39.7 13.2Z" fill={C.blanc} />
      </svg>
    </button>
  );
}
