// Particules sur canvas (BRIEF.md, sections 8.2 et 14.1) : copeaux d'encre, pièces,
// confettis. Jamais d'éléments DOM. Les particules sortent d'une réserve réutilisée
// et la boucle d'animation ne tourne que tant qu'il en reste une en vie.

const MAX_CHIPS = 80;
const MAX_COINS = 70;
const MAX_CONFETTI = 140;
const GRAVITY = 0.0016; // px par ms²

type Kind = "copeau" | "piece" | "confetti";

interface Particle {
  alive: boolean;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  /** Pièce qui file vers la bourse : cible, et moment où elle part. */
  tx: number;
  ty: number;
  seekAt: number;
  delay: number;
}

function blank(kind: Kind): Particle {
  return {
    alive: false, kind, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0, w: 0, h: 0, rot: 0, vr: 0,
    color: "#fff", tx: 0, ty: 0, seekAt: -1, delay: 0,
  };
}

export interface Point {
  x: number;
  y: number;
}

const CONFETTI_COLORS = ["#F7C948", "#D9457A", "#5FC9A6", "#E6F2F0", "#F08DB1", "#FF8A8F"];

export class Fx {
  private readonly canvas: HTMLCanvasElement;
  private readonly g: CanvasRenderingContext2D | null;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private readonly chips: Particle[] = [];
  private readonly coins: Particle[] = [];
  private readonly confettis: Particle[] = [];
  private raf = 0;
  private last = 0;
  private dirty: [number, number, number, number] | null = null;
  private cursor: Point | null = null;
  private cursorRadius = 14;
  private destroyed = false;
  /** Pas de particules quand les animations sont réduites. */
  calm = false;
  /** Appelé quand une pièce atteint la bourse. */
  onCoinArrive: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d");
    for (let i = 0; i < MAX_CHIPS; i++) this.chips.push(blank("copeau"));
    for (let i = 0; i < MAX_COINS; i++) this.coins.push(blank("piece"));
    for (let i = 0; i < MAX_CONFETTI; i++) this.confettis.push(blank("confetti"));
    this.resize();
  }

  /** À appeler quand la taille de l'écran change. Les coordonnées sont celles de la fenêtre. */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    this.dirty = null;
  }

  private origin(): Point {
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  private take(pool: Particle[]): Particle | null {
    for (const p of pool) if (!p.alive) return p;
    return null;
  }

  /**
   * Un copeau d'encre : rectangle de 2 à 5 px, vitesse opposée au mouvement,
   * gravité, durée de 400 à 700 ms. Coordonnées de la fenêtre.
   */
  chip(x: number, y: number, dx: number, dy: number, color: string): void {
    if (this.calm || this.destroyed) return;
    const p = this.take(this.chips);
    if (!p) return;
    const o = this.origin();
    const len = Math.hypot(dx, dy) || 1;
    const speed = 0.08 + Math.random() * 0.16;
    p.alive = true;
    p.x = x - o.x;
    p.y = y - o.y;
    p.vx = (-dx / len) * speed + (Math.random() - 0.5) * 0.12;
    p.vy = (-dy / len) * speed - Math.random() * 0.14;
    p.age = 0;
    p.life = 400 + Math.random() * 300;
    p.w = 2 + Math.random() * 3;
    p.h = 2 + Math.random() * 3;
    p.rot = Math.random() * Math.PI;
    p.vr = (Math.random() - 0.5) * 0.02;
    p.color = color;
    p.seekAt = -1;
    p.delay = 0;
    this.start();
  }

  /** Des pièces sautent d'un point puis filent vers la bourse. */
  coinsTo(from: Point, to: Point, count: number, spread = 1): void {
    if (this.calm || this.destroyed) return;
    const o = this.origin();
    for (let i = 0; i < count; i++) {
      const p = this.take(this.coins);
      if (!p) return;
      p.alive = true;
      p.x = from.x - o.x + (Math.random() - 0.5) * 30 * spread;
      p.y = from.y - o.y + (Math.random() - 0.5) * 16 * spread;
      p.vx = (Math.random() - 0.5) * 0.5 * spread;
      p.vy = -0.35 - Math.random() * 0.45 * spread;
      p.age = 0;
      p.delay = i * 45;
      p.life = 1500 + p.delay;
      p.w = 7 + Math.random() * 3;
      p.h = p.w;
      p.rot = Math.random() * Math.PI * 2;
      p.vr = 0.012 + Math.random() * 0.01;
      p.color = "#F7C948";
      p.tx = to.x - o.x;
      p.ty = to.y - o.y;
      p.seekAt = 260 + Math.random() * 160;
    }
    this.start();
  }

  /** Pluie de pièces sur tout l'écran. */
  coinRain(count: number, duration: number): void {
    if (this.calm || this.destroyed) return;
    for (let i = 0; i < count; i++) {
      const p = this.take(this.coins);
      if (!p) return;
      p.alive = true;
      p.x = Math.random() * this.width;
      p.y = -20 - Math.random() * 60;
      p.vx = (Math.random() - 0.5) * 0.1;
      p.vy = 0.25 + Math.random() * 0.3;
      p.age = 0;
      p.delay = Math.random() * duration * 0.7;
      p.life = duration + 600;
      p.w = 8 + Math.random() * 5;
      p.h = p.w;
      p.rot = Math.random() * Math.PI * 2;
      p.vr = 0.01 + Math.random() * 0.012;
      p.color = "#F7C948";
      p.seekAt = -1;
    }
    this.start();
  }

  /** Confettis lancés du haut de l'écran. */
  confetti(count: number, duration: number): void {
    if (this.calm || this.destroyed) return;
    for (let i = 0; i < count; i++) {
      const p = this.take(this.confettis);
      if (!p) return;
      p.alive = true;
      p.x = Math.random() * this.width;
      p.y = -10 - Math.random() * 40;
      p.vx = (Math.random() - 0.5) * 0.25;
      p.vy = 0.12 + Math.random() * 0.22;
      p.age = 0;
      p.delay = Math.random() * duration * 0.5;
      p.life = duration + 800;
      p.w = 5 + Math.random() * 5;
      p.h = 3 + Math.random() * 3;
      p.rot = Math.random() * Math.PI * 2;
      p.vr = (Math.random() - 0.5) * 0.02;
      p.color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!;
      p.seekAt = -1;
    }
    this.start();
  }

  /** La pièce qui gratte toute seule (« Tout gratter »). Coordonnées de la fenêtre. */
  setCursor(point: Point | null, radius = 14): void {
    if (point) {
      const o = this.origin();
      this.cursor = { x: point.x - o.x, y: point.y - o.y };
      this.cursorRadius = radius;
      this.start();
    } else {
      this.cursor = null;
      this.start();
    }
  }

  clear(): void {
    for (const pool of [this.chips, this.coins, this.confettis]) for (const p of pool) p.alive = false;
    this.cursor = null;
    this.g?.setTransform(1, 0, 0, 1, 0, 0);
    this.g?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.dirty = null;
  }

  /** Libère le canvas en quittant l'écran. */
  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.clear();
    this.canvas.width = 1;
    this.canvas.height = 1;
  }

  private start(): void {
    if (this.raf || this.destroyed) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private readonly frame = (now: number): void => {
    this.raf = 0;
    const g = this.g;
    if (!g || this.destroyed) return;
    const dt = Math.min(40, now - this.last);
    this.last = now;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // On n'efface que la zone peinte à l'image précédente.
    if (this.dirty) {
      const [x0, y0, x1, y1] = this.dirty;
      g.clearRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const mark = (x: number, y: number, r: number) => {
      if (x - r < minX) minX = x - r;
      if (y - r < minY) minY = y - r;
      if (x + r > maxX) maxX = x + r;
      if (y + r > maxY) maxY = y + r;
    };
    let alive = false;

    for (const p of this.chips) {
      if (!p.alive) continue;
      p.age += dt;
      if (p.age >= p.life) { p.alive = false; continue; }
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      alive = true;
      g.globalAlpha = Math.min(1, (p.life - p.age) / 160);
      g.fillStyle = p.color;
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      mark(p.x, p.y, 6);
    }

    for (const p of this.confettis) {
      if (!p.alive) continue;
      p.age += dt;
      if (p.age < p.delay) { alive = true; continue; }
      if (p.age >= p.life || p.y > this.height + 20) { p.alive = false; continue; }
      p.x += (p.vx + Math.sin((p.age + p.delay) / 260) * 0.05) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      alive = true;
      g.globalAlpha = 1;
      g.fillStyle = p.color;
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      // Le confetti tourne sur lui-même : sa hauteur respire.
      g.fillRect(-p.w / 2, (-p.h / 2) * Math.cos(p.age / 120), p.w, p.h * Math.cos(p.age / 120));
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      mark(p.x, p.y, 8);
    }

    for (const p of this.coins) {
      if (!p.alive) continue;
      p.age += dt;
      const t = p.age - p.delay;
      if (t < 0) { alive = true; continue; }
      if (p.age >= p.life || p.y > this.height + 30) { p.alive = false; continue; }
      if (p.seekAt >= 0 && t > p.seekAt) {
        // La pièce file vers la bourse.
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 14) {
          p.alive = false;
          this.onCoinArrive?.();
          continue;
        }
        const speed = Math.min(1.5, 0.35 + (t - p.seekAt) * 0.004);
        p.vx = (dx / dist) * speed;
        p.vy = (dy / dist) * speed;
      } else {
        p.vy += GRAVITY * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      alive = true;
      this.drawCoin(g, p.x, p.y, p.w, Math.cos(p.rot));
      mark(p.x, p.y, p.w + 2);
    }

    if (this.cursor) {
      alive = true;
      this.drawCoin(g, this.cursor.x, this.cursor.y, this.cursorRadius, 1);
      mark(this.cursor.x, this.cursor.y, this.cursorRadius + 3);
    }

    g.globalAlpha = 1;
    this.dirty = minX === Infinity ? null : [minX, minY, maxX, maxY];
    if (alive) this.raf = requestAnimationFrame(this.frame);
  };

  /** Une pièce : disque mimosa, tranche plus sombre. `flip` entre -1 et 1 la fait tourner sur elle-même. */
  private drawCoin(g: CanvasRenderingContext2D, x: number, y: number, r: number, flip: number): void {
    const rx = Math.max(1.2, Math.abs(flip) * r);
    g.globalAlpha = 1;
    g.fillStyle = "#B88A14";
    g.beginPath();
    g.ellipse(x + 1, y + 1.5, rx, r, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#F7C948";
    g.beginPath();
    g.ellipse(x, y, rx, r, 0, 0, Math.PI * 2);
    g.fill();
    if (rx > r * 0.5) {
      g.fillStyle = "#FBE08A";
      g.beginPath();
      g.ellipse(x - rx * 0.25, y - r * 0.25, rx * 0.4, r * 0.4, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
}
