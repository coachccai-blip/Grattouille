// Garde-fou d'équilibrage (BRIEF.md, sections 5.7 et 6.7) : avec une graine fixe,
// les médianes de la simulation retombent à 15 % près sur celles du brief.

import { describe, expect, it } from "vitest";
import { EXPECTED, STYLES, TOLERANCE, simulate } from "../scripts/simulate";

describe("simulation", () => {
  const reports = simulate(3_000, 20261125);

  it("les médianes de chaque style retombent à 15 % près sur le tableau 5.7", () => {
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

  it("style standard : dispersion et gros gains proches de ceux du brief", () => {
    const std = reports.find((r) => r.style.id === "standard")!;
    // 80 % des parties finissent entre 561 et 978 tickets.
    expect(Math.abs(std.p10 - 561) / 561).toBeLessThan(TOLERANCE);
    expect(Math.abs(std.p90 - 978) / 978).toBeLessThan(TOLERANCE);
    // En moyenne 15 gains d'au moins 25 fois la mise et 3,7 d'au moins 100 fois.
    expect(Math.abs(std.avgBig - 15) / 15).toBeLessThan(TOLERANCE);
    expect(Math.abs(std.avgHuge - 3.7) / 3.7).toBeLessThan(TOLERANCE);
    // Deux parties sur trois touchent au moins un jackpot.
    expect(Math.abs(std.jackpotShare - 2 / 3)).toBeLessThan(0.08);
  });

  it("on n'est jamais bloqué : chaque partie va au bout", () => {
    for (const r of reports) expect(r.p90).toBeLessThan(5_000);
  });
});
