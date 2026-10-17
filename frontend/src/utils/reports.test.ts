import { describe, expect, it } from "vitest";
import { createSeed } from "../services/seed";
import { filterOrders, metrics } from "./metrics";
import { createCsv } from "./csv";
import { localDate } from "./dates";
describe("relatórios e exportação", () => {
  it("filtra por data de abertura incluindo os dois limites e calcula sobre o recorte", () => {
    const snapshot = createSeed();
    const day = localDate(new Date(snapshot.orders[0].createdAt));
    const result = filterOrders(snapshot, { from: day, to: day });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((o) => localDate(new Date(o.createdAt)) === day)).toBe(
      true,
    );
    expect(metrics(result).total).toBe(result.length);
  });
  it("combina status, prioridade, técnico e pesquisa sem distinguir acentos", () => {
    const snapshot = createSeed();
    const order = snapshot.orders[0];
    order.title = "Inspeção elétrica";
    const result = filterOrders(snapshot, {
      search: "inspecao eletrica",
      status: order.status,
      priority: order.priority,
      technicianId: "unassigned",
    });
    expect(result).toEqual([order]);
  });
  it("exporta somente ordens selecionadas com aspas, BOM e proteção de fórmulas", () => {
    const snapshot = createSeed();
    const order = {
      ...snapshot.orders[0],
      title: '=CMD("teste")',
      description: 'Linha; com "aspas"',
    };
    const csv = createCsv([order], snapshot);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain('"\'=CMD(""teste"")"');
    expect(csv).toContain('"Linha; com ""aspas"""');
    expect(csv).not.toContain(snapshot.orders[1].code);
  });
});
