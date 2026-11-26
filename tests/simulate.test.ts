// Garde-fou d'équilibrage (BRIEF.md, sections 5.7 et 6.7) : avec une graine fixe, les
// médianes de la simulation retombent à 15 % près sur le tableau de référence de
// scripts/simulate.ts (la version étendue du jeu : huit lieux, environ 1 500 tickets).

import { describe, expect, it } from "vitest";
import { EXPECTED, STEPS, STYLES, TOLERANCE, simulate } from "../scripts/simulate";
import { PLACES } from "../shared/places";

describe("simulation", () => {
  const reports = simulate(2_000, 20261126);

  it("une étape par lieu après le Kiosque, puis la fin", () => {
    expect(STEPS.length).toBe(PLACES.length);
    for (const s of STYLES) expect(EXPECTED[s.id]!.length).toBe(STEPS.length);
  });

  it("les médianes de chaque style retombent à 15 % près sur le tableau de référence", () => {
    expect(reports.map((r) => r.style.id)).toEqual(STYLES.map((s) => s.id));
    for (const r of reports) {
      const expected = EXPECTED[r.style.id]!;
      r.medians.forEach((m, i) => {
        const gap = Math.abs(m - expected[i]!) / expected[i]!;
        if (gap > TOLERANCE) throw new Error(`${r.style.id}, étape ${i} : ${m} au lieu de ${expected[i]}`);
      });
      expect(r.ok).toBe(true);
      // Les étapes se suivent, et l'ouverture d'un lieu précède le premier ticket qu'on y achète.
      for (let i = 1; i < r.medians.length; i++) expect(r.medians[i]!).toBeGreaterThan(r.medians[i - 1]!);
      r.unlockMedians.forEach((u, i) => expect(u).toBeLessThanOrEqual(r.medians[i]!));
    }
  });

  it("style standard : environ 1 500 tickets, soit une dizaine d'heures de jeu", () => {
    const std = reports.find((r) => r.style.id === "standard")!;
    const last = std.medians[std.medians.length - 1]!;
    expect(last).toBeGreaterThan(1_300);
    expect(last).toBeLessThan(1_700);
    // 80 % des parties finissent entre 1 181 et 1 878 tickets.
    expect(Math.abs(std.p10 - 1_181) / 1_181).toBeLessThan(TOLERANCE);
    expect(Math.abs(std.p90 - 1_878) / 1_878).toBeLessThan(TOLERANCE);
    // En moyenne 37 gains d'au moins 25 fois la mise et 8 d'au moins 100 fois.
    expect(Math.abs(std.avgBig - 37) / 37).toBeLessThan(TOLERANCE);
    expect(Math.abs(std.avgHuge - 8.1) / 8.1).toBeLessThan(TOLERANCE);
    // Presque toutes les parties touchent au moins un jackpot.
    expect(std.jackpotShare).toBeGreaterThan(0.9);
  });

  it("le premier lieu s'ouvre dans la première demi-heure", () => {
    const std = reports.find((r) => r.style.id === "standard")!;
    // Le Grand Café : entre le 40e et le 90e ticket.
    expect(std.unlockMedians[0]!).toBeGreaterThanOrEqual(40);
    expect(std.unlockMedians[0]!).toBeLessThanOrEqual(90);
  });

  it("on n'est jamais bloqué : chaque partie va au bout, pour tous les styles", () => {
    for (const r of reports) {
      expect(r.finished).toBe(true);
      expect(r.p90).toBeLessThan(5_000);
    }
  });

  it("même en misant tout son solde à chaque fois, on se refait : il y a toujours un ticket par terre", () => {
    const tapis = reports.find((r) => r.style.id === "tapis")!;
    expect(tapis.avgHouse).toBeGreaterThan(5);
    expect(tapis.finished).toBe(true);
  });
});
