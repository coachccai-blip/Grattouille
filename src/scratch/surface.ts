// Le moteur de grattage (BRIEF.md, section 8). Tout est impératif : aucune mise à
// jour d'état React pendant le geste. React n'est prévenu qu'à la révélation d'une case.
//
// - Un canvas d'encre posé sur le ticket. L'encre de chaque case y est peinte une
//   fois, puis retirée au doigt (`destination-out`).
// - Entre deux positions du doigt, la brosse est tamponnée tous les (rayon ÷ 3) pixels.
// - La couverture d'une case se compte sur une grille logique de cellules de 8 px :
//   pas de getImageData pendant le geste.
// - À 55 % de couverture, la case est révélée : le reste de son encre se dissout en
//   220 ms à partir du dernier point touché.

import { playReveal, scratchEnd, scratchMove, type RevealKind } from "../fx/audio";
import { haptic } from "../fx/haptics";
import type { Fx } from "../fx/particles";
import { INKS, brushes, cellPath, paintInk, type CellShape, type InkKind } from "./ink";

const GRID = 8;
const REVEAL_AT = 0.55;
const DISSOLVE_MS = 220;
const HAPTIC_EVERY_PX = 48;
const HAPTIC_MIN_MS = 60;

interface Cell {
  id: string;
  el: HTMLElement;
  shape: CellShape;
  x: number;
  y: number;
  w: number;
  h: number;
  path: Path2D;
  cols: number;
  rows: number;
  /** Cellules de la grille qui sont dans la forme. */
  inside: Uint8Array;
  /** Cellules déjà grattées. */
  done: Uint8Array;
  total: number;
  covered: number;
  revealed: boolean;
  lastX: number;
  lastY: number;
}

interface Dissolve {
  cell: Cell;
  start: number;
  ox: number;
  oy: number;
  reach: number;
}

interface Sweep {
  cell: Cell;
  start: number;
  dur: number;
  points: [number, number][];
  length: number;
  px: number;
  py: number;
  begun: boolean;
}

export interface SurfaceOptions {
  /** Le ticket : les cases à gratter sont ses éléments [data-case]. */
  root: HTMLElement;
  /** Le canvas d'encre, posé sur le ticket. */
  canvas: HTMLCanvasElement;
  ink: InkKind;
  fx: Fx | null;
  /** Les cases déjà révélées (reprise d'un ticket, volets du ticket multiple). */
  revealed: ReadonlySet<string>;
  calm: boolean;
  onReveal: (id: string) => void;
  /** Le joueur vient de poser le doigt pour la première fois. */
  onFirstTouch?: () => void;
}

export class ScratchSurface {
  private readonly o: SurfaceOptions;
  private readonly g: CanvasRenderingContext2D | null;
  private cells: Cell[] = [];
  private readonly revealed = new Set<string>();
  private dpr = 1;
  private radius = 24;
  private brushSet: HTMLCanvasElement[] = [];
  private brushSize = 0;
  private offsetX = 0;
  private offsetY = 0;
  private pointer: number | null = null;
  private lastX = 0;
  private lastY = 0;
  private lastT = 0;
  private travelled = 0;
  private lastHaptic = 0;
  private touched = false;
  private dissolves: Dissolve[] = [];
  private sweeps: Sweep[] = [];
  private sweepDone: (() => void) | null = null;
  private raf = 0;
  private destroyed = false;
  /** Vrai pendant « Tout gratter » : le doigt est ignoré. */
  private sweeping = false;
  calm: boolean;
  enabled = true;

  constructor(options: SurfaceOptions) {
    this.o = options;
    this.calm = options.calm;
    this.g = options.canvas.getContext("2d");
    for (const id of options.revealed) this.revealed.add(id);
    const c = options.canvas;
    c.addEventListener("pointerdown", this.onDown);
    c.addEventListener("pointermove", this.onMove);
    c.addEventListener("pointerup", this.onUp);
    c.addEventListener("pointercancel", this.onUp);
    c.addEventListener("lostpointercapture", this.onUp);
    this.layout();
  }

  /** Mesure les cases, dimensionne le canvas, peint l'encre des cases pas encore révélées. */
  layout(): void {
    const g = this.g;
    if (!g || this.destroyed) return;
    const { root, canvas } = this.o;
    const box = canvas.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // plafonné à 2
    canvas.width = Math.round(box.width * this.dpr);
    canvas.height = Math.round(box.height * this.dpr);
    // Rayon de la brosse : 6,5 % de la largeur du ticket, soit environ 24 px.
    this.radius = Math.max(14, box.width * 0.065);
    this.brushSet = brushes(this.radius, this.dpr);
    this.brushSize = this.radius * 2 + 4;
    this.dissolves = [];
    // La grille a changé (volet suivant, écran redimensionné) : un balayage en cours
    // visait les anciennes cases. On l'arrête ; l'écran en relancera un s'il le faut.
    if (this.sweeps.length > 0 || this.sweepDone) {
      this.sweeps = [];
      this.sweeping = false;
      this.o.fx?.setCursor(null);
      scratchEnd();
      const done = this.sweepDone;
      this.sweepDone = null;
      done?.();
    }
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, box.width, box.height);

    const cells: Cell[] = [];
    root.querySelectorAll<HTMLElement>("[data-case]").forEach((el) => {
      const id = el.dataset.case ?? "";
      const r = el.getBoundingClientRect();
      if (!id || r.width < 2 || r.height < 2) return;
      const shape = (el.dataset.forme as CellShape | undefined) ?? "rect";
      const x = r.left - box.left;
      const y = r.top - box.top;
      const path = cellPath(shape, x, y, r.width, r.height);
      const cols = Math.max(1, Math.ceil(r.width / GRID));
      const rows = Math.max(1, Math.ceil(r.height / GRID));
      const inside = new Uint8Array(cols * rows);
      let total = 0;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          // Le point est donné en pixels du canvas, le contour suit la transformation courante.
          const px = (x + gx * GRID + GRID / 2) * this.dpr;
          const py = (y + gy * GRID + GRID / 2) * this.dpr;
          if (g.isPointInPath(path, px, py)) {
            inside[gy * cols + gx] = 1;
            total++;
          }
        }
      }
      const cell: Cell = {
        id, el, shape, x, y, w: r.width, h: r.height, path, cols, rows, inside,
        done: new Uint8Array(cols * rows), total: Math.max(1, total), covered: 0,
        revealed: this.revealed.has(id), lastX: x + r.width / 2, lastY: y + r.height / 2,
      };
      cells.push(cell);
      if (!cell.revealed) paintInk(g, this.o.ink, path, x, y, r.width, r.height);
    });
    this.cells = cells;
  }

  /** Les cases présentes sur le ticket et pas encore révélées. */
  remaining(): string[] {
    return this.cells.filter((c) => !c.revealed).map((c) => c.id);
  }

  // -------------------------------------------------------------------------
  // Le doigt

  private local(e: PointerEvent): [number, number] {
    return [e.clientX - this.offsetX, e.clientY - this.offsetY];
  }

  private readonly onDown = (e: PointerEvent): void => {
    if (!this.enabled || this.sweeping || this.pointer !== null || this.destroyed) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Un seul pointeur actif.
    this.pointer = e.pointerId;
    try {
      this.o.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Sans capture, le geste s'arrête simplement au bord du canvas.
    }
    const box = this.o.canvas.getBoundingClientRect();
    this.offsetX = box.left;
    this.offsetY = box.top;
    const [x, y] = this.local(e);
    this.lastX = x;
    this.lastY = y;
    this.lastT = e.timeStamp;
    if (!this.touched) {
      this.touched = true;
      this.o.onFirstTouch?.();
    }
    this.stamp(x, y, 0, -1);
    e.preventDefault();
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointer) return;
    const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    const list = events.length > 0 ? events : [e];
    for (const ev of list) {
      const [x, y] = this.local(ev);
      this.strokeTo(x, y, ev.timeStamp || e.timeStamp);
    }
    e.preventDefault();
  };

  private readonly onUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointer) return;
    this.pointer = null;
    scratchEnd();
  };

  /** Du dernier point au nouveau : un tampon tous les (rayon ÷ 3) pixels, sans trou. */
  private strokeTo(x: number, y: number, t: number): void {
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return;
    const step = this.radius / 3;
    const n = Math.max(1, Math.ceil(dist / step));
    let onInk = false;
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      if (this.stamp(this.lastX + dx * k, this.lastY + dy * k, dx, dy)) onInk = true;
    }
    const dt = Math.max(1, t - this.lastT);
    this.lastX = x;
    this.lastY = y;
    this.lastT = t;
    if (onInk) {
      // Le volume du grattage suit la vitesse du doigt.
      scratchMove(dist / dt);
      this.travelled += dist;
      if (this.travelled >= HAPTIC_EVERY_PX && t - this.lastHaptic >= HAPTIC_MIN_MS) {
        this.travelled = 0;
        this.lastHaptic = t;
        haptic.scratch();
      }
    }
  }

  /** Un coup de brosse en (x, y). Rend vrai s'il a mordu sur de l'encre. */
  private stamp(x: number, y: number, dx: number, dy: number): boolean {
    const g = this.g;
    if (!g) return false;
    const r = this.radius;
    let overlaps = false;
    let onInk = false;
    for (const c of this.cells) {
      if (c.revealed) continue;
      if (x + r < c.x || x - r > c.x + c.w || y + r < c.y || y - r > c.y + c.h) continue;
      overlaps = true;
      const before = c.covered;
      this.cover(c, x, y);
      if (c.covered === before) continue;
      onInk = true;
      c.lastX = x;
      c.lastY = y;
      // Copeaux : 1 ou 2 particules de la couleur de l'encre, à l'opposé du mouvement.
      const fx = this.o.fx;
      if (fx && !this.calm) {
        const n = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < n; i++) {
          fx.chip(
            this.offsetX + x + (Math.random() - 0.5) * r, this.offsetY + y + (Math.random() - 0.5) * r,
            dx, dy, INKS[this.o.ink].chip,
          );
        }
      }
      if (c.covered / c.total >= REVEAL_AT) this.reveal(c);
    }
    // La brosse passe dès qu'elle touche une case encore couverte, même là où la
    // grille compte déjà la zone comme grattée : il ne reste aucune miette d'encre.
    if (overlaps) {
      const brush = this.brushSet[(Math.random() * this.brushSet.length) | 0];
      if (brush) {
        g.globalCompositeOperation = "destination-out";
        g.globalAlpha = 1;
        g.drawImage(brush, x - this.brushSize / 2, y - this.brushSize / 2, this.brushSize, this.brushSize);
        g.globalCompositeOperation = "source-over";
      }
    }
    return onInk;
  }

  /** Marque les cellules de la grille dont le centre est à moins d'un rayon du tampon. */
  private cover(c: Cell, x: number, y: number): void {
    const r = this.radius;
    const r2 = r * r;
    const gx0 = Math.max(0, Math.floor((x - r - c.x) / GRID));
    const gx1 = Math.min(c.cols - 1, Math.floor((x + r - c.x) / GRID));
    const gy0 = Math.max(0, Math.floor((y - r - c.y) / GRID));
    const gy1 = Math.min(c.rows - 1, Math.floor((y + r - c.y) / GRID));
    for (let gy = gy0; gy <= gy1; gy++) {
      const cy = c.y + gy * GRID + GRID / 2 - y;
      for (let gx = gx0; gx <= gx1; gx++) {
        const i = gy * c.cols + gx;
        if (!c.inside[i] || c.done[i]) continue;
        const cx = c.x + gx * GRID + GRID / 2 - x;
        if (cx * cx + cy * cy <= r2) {
          c.done[i] = 1;
          c.covered++;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Révélation

  private reveal(c: Cell): void {
    if (c.revealed) return;
    c.revealed = true;
    this.revealed.add(c.id);
    // Un tic et une vibration de 10 ms. La case dit elle-même quel tic est le sien
    // (`data-revele`) : la carte qui se retourne, le dé qui roule, la lettre qui s'allume.
    playReveal(c.el.dataset.revele as RevealKind | undefined);
    haptic.reveal();
    if (this.calm) {
      this.wipe(c);
    } else {
      const corners: [number, number][] = [[c.x, c.y], [c.x + c.w, c.y], [c.x, c.y + c.h], [c.x + c.w, c.y + c.h]];
      let reach = 0;
      for (const [px, py] of corners) reach = Math.max(reach, Math.hypot(px - c.lastX, py - c.lastY));
      this.dissolves.push({ cell: c, start: performance.now(), ox: c.lastX, oy: c.lastY, reach });
      this.loop();
    }
    this.o.onReveal(c.id);
  }

  /** Retire toute l'encre d'une case. */
  private wipe(c: Cell): void {
    const g = this.g;
    if (!g) return;
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.globalAlpha = 1;
    g.lineWidth = 6;
    g.fill(c.path);
    g.stroke(c.path);
    g.restore();
  }

  private loop(): void {
    if (this.raf || this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private readonly frame = (now: number): void => {
    this.raf = 0;
    const g = this.g;
    if (!g || this.destroyed) return;

    // « Tout gratter » : une pièce balaie chaque case restante en zigzag.
    if (this.sweeps.length > 0) {
      let cursor: [number, number] | null = null;
      for (const s of this.sweeps) {
        const t = (now - s.start) / s.dur;
        if (t < 0) continue;
        const [x, y] = pointAt(s, Math.min(1, t));
        if (!s.begun) {
          s.begun = true;
          s.px = x;
          s.py = y;
        }
        const dx = x - s.px;
        const dy = y - s.py;
        const dist = Math.hypot(dx, dy);
        const n = Math.max(1, Math.ceil(dist / (this.radius / 3)));
        for (let i = 1; i <= n; i++) this.stamp(s.px + dx * (i / n), s.py + dy * (i / n), dx, dy);
        s.px = x;
        s.py = y;
        if (t < 1) cursor = [x, y];
        else if (!s.cell.revealed) this.reveal(s.cell);
      }
      this.sweeps = this.sweeps.filter((s) => (now - s.start) / s.dur < 1);
      if (cursor) {
        scratchMove(1.1);
        this.o.fx?.setCursor({ x: this.offsetX + cursor[0], y: this.offsetY + cursor[1] }, Math.max(10, this.radius * 0.55));
      }
      if (this.sweeps.length === 0) {
        this.o.fx?.setCursor(null);
        scratchEnd();
      }
    }

    // Dissolution : un disque qui grandit depuis le dernier point touché.
    if (this.dissolves.length > 0) {
      for (const d of this.dissolves) {
        const t = Math.min(1, (now - d.start) / DISSOLVE_MS);
        if (t >= 1) {
          this.wipe(d.cell);
          continue;
        }
        g.save();
        g.clip(d.cell.path);
        g.globalCompositeOperation = "destination-out";
        g.globalAlpha = 1;
        g.beginPath();
        g.arc(d.ox, d.oy, Math.max(4, d.reach * t), 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      this.dissolves = this.dissolves.filter((d) => now - d.start < DISSOLVE_MS);
    }

    if (this.sweeps.length > 0 || this.dissolves.length > 0) {
      this.loop();
    } else if (this.sweepDone) {
      const done = this.sweepDone;
      this.sweepDone = null;
      this.sweeping = false;
      done();
    }
  };

  // -------------------------------------------------------------------------
  // Tout gratter

  /**
   * Gratte toutes les cases restantes : 80 ms de décalage entre deux cases, `total`
   * millisecondes en tout, son et copeaux compris. C'est aussi l'alternative
   * d'accessibilité au geste.
   */
  sweepAll(total = 900): Promise<void> {
    if (this.destroyed || this.sweeping) return Promise.resolve();
    const targets = this.cells.filter((c) => !c.revealed);
    if (targets.length === 0) return Promise.resolve();
    if (this.pointer !== null) {
      this.pointer = null;
      scratchEnd();
    }
    if (this.calm) {
      // Animations réduites : les cases se découvrent d'un coup.
      for (const c of targets) this.reveal(c);
      return Promise.resolve();
    }
    const box = this.o.canvas.getBoundingClientRect();
    this.offsetX = box.left;
    this.offsetY = box.top;
    const stagger = targets.length > 1 ? Math.min(80, (total * 0.6) / (targets.length - 1)) : 0;
    const dur = Math.max(260, total - stagger * (targets.length - 1));
    const start = performance.now();
    this.sweeping = true;
    this.sweeps = targets.map((cell, i) => {
      const points = zigzag(cell);
      let length = 0;
      for (let k = 1; k < points.length; k++) {
        length += Math.hypot(points[k]![0] - points[k - 1]![0], points[k]![1] - points[k - 1]![1]);
      }
      return { cell, start: start + i * stagger, dur, points, length, px: 0, py: 0, begun: false };
    });
    return new Promise((resolve) => {
      this.sweepDone = resolve;
      this.loop();
    });
  }

  /** Libère le canvas en quittant l'écran. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    scratchEnd();
    this.o.fx?.setCursor(null);
    const c = this.o.canvas;
    c.removeEventListener("pointerdown", this.onDown);
    c.removeEventListener("pointermove", this.onMove);
    c.removeEventListener("pointerup", this.onUp);
    c.removeEventListener("pointercancel", this.onUp);
    c.removeEventListener("lostpointercapture", this.onUp);
    c.width = 1;
    c.height = 1;
    this.cells = [];
    const done = this.sweepDone;
    this.sweepDone = null;
    done?.();
  }
}

/** Trois allers-retours en travers de la case. */
function zigzag(c: Cell): [number, number][] {
  const padX = c.w * 0.16;
  const left = c.x + padX;
  const right = c.x + c.w - padX;
  const rows = [0.22, 0.5, 0.78];
  const points: [number, number][] = [];
  rows.forEach((k, i) => {
    const y = c.y + c.h * k;
    if (i % 2 === 0) points.push([left, y], [right, y]);
    else points.push([right, y], [left, y]);
  });
  return points;
}

function pointAt(s: Sweep, t: number): [number, number] {
  let target = s.length * t;
  for (let k = 1; k < s.points.length; k++) {
    const a = s.points[k - 1]!;
    const b = s.points[k]!;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (target <= seg || k === s.points.length - 1) {
      const u = seg === 0 ? 0 : Math.min(1, target / seg);
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    }
    target -= seg;
  }
  return s.points[s.points.length - 1]!;
}
