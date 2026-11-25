// Grain de papier (BRIEF.md, section 4.5) : rendu une seule fois dans une texture
// réutilisée, jamais par un filtre SVG appliqué élément par élément.
// La texture est posée dans la variable CSS --grain ; la classe .papier s'en sert.

let done = false;

export function installGrain(): void {
  if (done) return;
  done = true;
  try {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const g = canvas.getContext("2d");
    if (!g) return;
    const image = g.createImageData(size, size);
    // Générateur déterministe : le même grain à chaque lancement.
    let s = 20261125;
    const rnd = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let i = 0; i < size * size; i++) {
      // Un papier ivoire à peine moucheté : presque blanc, quelques grains plus sombres.
      const v = 255 - Math.floor(rnd() * rnd() * 46);
      image.data[i * 4] = v;
      image.data[i * 4 + 1] = v;
      image.data[i * 4 + 2] = Math.max(0, v - 4);
      image.data[i * 4 + 3] = 255;
    }
    g.putImageData(image, 0, 0);
    document.documentElement.style.setProperty("--grain", `url("${canvas.toDataURL("image/png")}")`);
  } catch {
    // Sans canvas, le papier reste lisse.
  }
}
