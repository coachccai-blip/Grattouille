// Les étoiles gagnées s'envolent vers le compteur de Standing : quelques étoiles, de
// l'étiquette « +8 ★ » jusqu'à l'étoile de l'en-tête, une par note de `playStars`.
// Des éléments posés au-dessus de tout, animés par transformation et opacité seulement,
// puis retirés. Rien en animations réduites : le compteur compte, cela suffit.

/** L'écart entre deux étoiles, et la durée de leur vol : celles des notes de `playStars`. */
const STAR_EVERY_MS = 70;
const FLIGHT_MS = 460;

function centre(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** `count` étoiles (huit au plus) s'envolent de `from` vers `to`. */
export function envolEtoiles(from: Element | null, to: Element | null, count: number): void {
  if (!from || !to || typeof document === "undefined") return;
  if (document.documentElement.classList.contains("calme")) return;
  const n = Math.max(0, Math.min(8, Math.floor(count)));
  if (n === 0) return;
  const a = centre(from);
  const b = centre(to);
  const layer = document.createElement("div");
  layer.className = "envol";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < n; i++) {
    const star = document.createElement("span");
    star.className = "envol__etoile";
    star.style.left = `${a.x}px`;
    star.style.top = `${a.y}px`;
    layer.appendChild(star);
    if (typeof star.animate !== "function") continue;
    // Elle jaillit d'abord de côté, puis file vers le compteur.
    const angle = (i / n) * Math.PI * 2 + Math.random();
    const ox = Math.cos(angle) * 26;
    const oy = Math.sin(angle) * 18 - 14;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    star.animate(
      [
        { transform: "translate(-50%, -50%) scale(.3)", opacity: 0, easing: "ease-out" },
        { transform: `translate(-50%, -50%) translate(${ox}px, ${oy}px) scale(1.25) rotate(40deg)`, opacity: 1, offset: 0.3, easing: "ease-in" },
        { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(.7) rotate(160deg)`, opacity: 1, offset: 0.94 },
        { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(.2) rotate(180deg)`, opacity: 0 },
      ],
      { duration: FLIGHT_MS, delay: i * STAR_EVERY_MS, fill: "both" },
    );
  }
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), n * STAR_EVERY_MS + FLIGHT_MS + 80);
}
