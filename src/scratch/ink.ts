// L'encre à gratter (BRIEF.md, sections 7.10 et 8.2) : pour chaque case, un dégradé
// métallique, un grain et un motif répété de petits « G » à 6 % d'opacité.
// Les textures (grain, motif, brosses) sont rendues une seule fois et réutilisées.

export type InkKind =
  | "argent" | "nacre-lilas" | "cuivre" | "craie" | "or" | "chrome"
  | "nacre-irisee" | "or-champagne" | "nacre-blanche"
  | "sable" | "plomb" | "bronze" | "nacre-rose";

export type CellShape = "rect" | "rond" | "etoile" | "cloche";

interface InkSpec {
  /** Les quatre teintes du dégradé métallique, en diagonale. */
  stops: [string, string, string, string];
  /** Couleur des copeaux. */
  chip: string;
  /** Couleur du liseré et du motif. */
  dark: string;
}

export const INKS: Record<InkKind, InkSpec> = {
  argent: { stops: ["#C9CED4", "#F1F3F5", "#AEB5BC", "#D9DDE1"], chip: "#B4BBC2", dark: "#5E6870" },
  "nacre-lilas": { stops: ["#D6CBEF", "#F4EEFF", "#B7A4DB", "#E4DAF6"], chip: "#C3B4E3", dark: "#6B5A94" },
  cuivre: { stops: ["#E3A274", "#F7D2B3", "#C0703E", "#E0A078"], chip: "#C8733F", dark: "#7A4222" },
  craie: { stops: ["#ECE8DF", "#FFFFFF", "#D6D1C5", "#F1EEE6"], chip: "#DEDACF", dark: "#8A8577" },
  or: { stops: ["#E6C052", "#FFF0B8", "#C4952A", "#F0D066"], chip: "#D9A520", dark: "#80600F" },
  chrome: { stops: ["#B4BFCA", "#FFFFFF", "#8794A2", "#DCE3EA"], chip: "#A6B1BD", dark: "#4F5B67" },
  "nacre-irisee": { stops: ["#F2DFEC", "#E0F2EE", "#E2DCF5", "#FBEFDF"], chip: "#D8D0E6", dark: "#7C7396" },
  "or-champagne": { stops: ["#E8D5A0", "#FFF6DC", "#CFB675", "#F1E3B8"], chip: "#D6C086", dark: "#857032" },
  "nacre-blanche": { stops: ["#E9EDF1", "#FFFFFF", "#D6DEE6", "#F5F1EA"], chip: "#D5DCE4", dark: "#77838F" },
  // Les encres des tickets ajoutés après le brief.
  sable: { stops: ["#E6D3A8", "#FBF1D6", "#CDB37C", "#EFE0BC"], chip: "#D8C18F", dark: "#8A7340" },
  plomb: { stops: ["#B9BDC2", "#E6E8EA", "#9AA0A7", "#CDD1D5"], chip: "#A7ADB4", dark: "#4A5158" },
  bronze: { stops: ["#C99A5B", "#EBCB98", "#A5733A", "#D2A56B"], chip: "#B98445", dark: "#6B4A20" },
  "nacre-rose": { stops: ["#F6D0CF", "#FFF1EC", "#E7ABB0", "#F9DED8"], chip: "#EBB8B9", dark: "#9A5A62" },
};

/** Le contour d'une case, dans le rectangle (x, y, w, h). */
export function cellPath(shape: CellShape, x: number, y: number, w: number, h: number): Path2D {
  const p = new Path2D();
  const cx = x + w / 2;
  const cy = y + h / 2;
  switch (shape) {
    case "rond":
      p.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case "etoile": {
      // Une étoile à cinq branches, bien en chair : le contenu tient dans son cœur.
      const rx = w / 2;
      const ry = h / 2;
      for (let i = 0; i < 10; i++) {
        const k = i % 2 === 0 ? 1 : 0.64;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = cx + Math.cos(a) * rx * k;
        const py = cy + ry * 0.05 + Math.sin(a) * ry * k;
        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
      p.closePath();
      break;
    }
    case "cloche": {
      // Une cloche d'argent : un dôme, son bouton, son plateau.
      const base = y + h * 0.86;
      p.moveTo(x + w * 0.04, base);
      p.bezierCurveTo(x + w * 0.04, y + h * 0.3, x + w * 0.3, y + h * 0.12, cx - w * 0.07, y + h * 0.12);
      p.arc(cx, y + h * 0.08, w * 0.07, Math.PI, 0);
      p.bezierCurveTo(x + w * 0.7, y + h * 0.12, x + w * 0.96, y + h * 0.3, x + w * 0.96, base);
      p.lineTo(x + w, base);
      p.lineTo(x + w, y + h);
      p.lineTo(x, y + h);
      p.lineTo(x, base);
      p.closePath();
      break;
    }
    default: {
      const r = Math.min(8, w / 5, h / 5);
      p.roundRect(x, y, w, h, r);
    }
  }
  return p;
}

/** Le même contour, en CSS, pour qu'aucun contenu ne dépasse de l'encre avant d'être gratté. */
export function cellClip(shape: CellShape): string | undefined {
  switch (shape) {
    case "rond":
      return "ellipse(50% 50% at 50% 50%)";
    case "etoile": {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const k = i % 2 === 0 ? 1 : 0.64;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(`${(50 + Math.cos(a) * 50 * k).toFixed(2)}% ${(52.5 + Math.sin(a) * 50 * k).toFixed(2)}%`);
      }
      return `polygon(${pts.join(", ")})`;
    }
    case "cloche":
      // L'assiette sous la cloche : une ellipse qui tient tout entière sous le dôme.
      return "ellipse(42% 34% at 50% 52%)";
    default:
      return undefined;
  }
}

let grainTile: HTMLCanvasElement | null = null;
const motifTiles = new Map<string, HTMLCanvasElement>();
const brushCache = new Map<number, HTMLCanvasElement[]>();

function grain(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  const image = g.createImageData(size, size);
  let s = 7919;
  for (let i = 0; i < size * size; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const v = 200 + ((s >>> 24) % 56);
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  g.putImageData(image, 0, 0);
  grainTile = c;
  return c;
}

function motif(color: string): HTMLCanvasElement {
  const cached = motifTiles.get(color);
  if (cached) return cached;
  const size = 44;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = color;
  g.font = '18px "Abril Fatface", Georgia, serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  const put = (x: number, y: number) => {
    g.save();
    g.translate(x, y);
    g.rotate(-0.35);
    g.fillText("G", 0, 0);
    g.restore();
  };
  put(11, 12);
  put(33, 34);
  motifTiles.set(color, c);
  return c;
}

/** Peint l'encre d'une case : dégradé métallique, grain, motif de « G », liseré. */
export function paintInk(
  g: CanvasRenderingContext2D, kind: InkKind, path: Path2D, x: number, y: number, w: number, h: number,
): void {
  const spec = INKS[kind];
  g.save();
  g.clip(path);
  const grad = g.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, spec.stops[0]);
  grad.addColorStop(0.4, spec.stops[1]);
  grad.addColorStop(0.6, spec.stops[2]);
  grad.addColorStop(1, spec.stops[3]);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  g.fillStyle = grad;
  g.fillRect(x, y, w, h);
  // Grain
  const grainPattern = g.createPattern(grain(), "repeat");
  if (grainPattern) {
    g.globalCompositeOperation = "multiply";
    g.globalAlpha = 0.55;
    g.fillStyle = grainPattern;
    g.fillRect(x, y, w, h);
  }
  // Motif répété de petits « G », à 6 % d'opacité.
  const motifPattern = g.createPattern(motif(spec.dark), "repeat");
  if (motifPattern) {
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 0.06;
    g.fillStyle = motifPattern;
    g.fillRect(x, y, w, h);
  }
  // Un liseré plus sombre, pour que la case se détache du papier.
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 0.28;
  g.strokeStyle = spec.dark;
  g.lineWidth = 2.5;
  g.stroke(path);
  g.restore();
}

/**
 * La brosse : un disque à bord irrégulier, pré-rendu en 3 variantes tournées au
 * hasard. `radius` en pixels CSS, `dpr` pour la netteté.
 */
export function brushes(radius: number, dpr: number): HTMLCanvasElement[] {
  const key = Math.round(radius * dpr);
  const cached = brushCache.get(key);
  if (cached) return cached;
  const list: HTMLCanvasElement[] = [];
  let s = 4242 + key;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const size = Math.ceil((radius * 2 + 4) * dpr);
  for (let v = 0; v < 3; v++) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d")!;
    const center = size / 2;
    const points = 26;
    const turn = rnd() * Math.PI * 2;
    g.beginPath();
    for (let i = 0; i < points; i++) {
      const a = turn + (i / points) * Math.PI * 2;
      const r = radius * dpr * (0.84 + rnd() * 0.16);
      const px = center + Math.cos(a) * r;
      const py = center + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillStyle = "#000";
    g.fill();
    list.push(c);
  }
  brushCache.set(key, list);
  return list;
}
