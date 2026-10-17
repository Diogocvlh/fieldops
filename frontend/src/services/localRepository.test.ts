import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createLocalRepository, STORAGE_KEY } from "./localRepository";
import { createSeed } from "./seed";
import { localDate, validDate } from "../utils/dates";
import type { TechnicianInput, WorkOrderInput } from "../types";
function memoryStore() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
const technician: TechnicianInput = {
  name: "Técnico de Teste",
  registration: "TEST-01",
  specialty: "Elétrica",
  region: "Centro",
  available: true,
  capacity: 1,
};
const input: WorkOrderInput = {
  title: "Inspeção de teste",
  description: "Revisar instalações.",
  technicianId: null,
  priority: "HIGH",
  status: "OPEN",
  dueDate: "2026-10-20",
};
beforeEach(() =>
  vi.useFakeTimers({ now: new Date("2026-10-16T18:00:00-03:00") }),
);
afterEach(() => vi.useRealTimers());
describe("repositório local e regras de negócio", () => {
  it("persiste alterações e atividades entre instâncias do repositório", async () => {
    const storage = memoryStore();
    const repo = createLocalRepository(storage);
    const created = await repo.createOrder(input);
    const reopened = await createLocalRepository(storage).load();
    expect(
      reopened.orders.find((order) => order.id === created.id)?.title,
    ).toBe(input.title);
    expect(reopened.activities[0].workOrderId).toBe(created.id);
  });
  it("bloqueia novas atribuições a técnico indisponível e não grava atividade", async () => {
    const repo = createLocalRepository(memoryStore());
    const tech = await repo.createTechnician({
      ...technician,
      available: false,
    });
    const order = await repo.createOrder(input);
    const before = await repo.load();
    await expect(repo.assignOrder(order.id, tech.id)).rejects.toThrow(
      "Revise os campos",
    );
    expect(await repo.load()).toEqual(before);
  });
  it("bloqueia atribuição acima da capacidade e libera a vaga após a conclusão", async () => {
    const repo = createLocalRepository(memoryStore());
    const tech = await repo.createTechnician(technician);
    const first = await repo.createOrder(input);
    const second = await repo.createOrder(input);
    await repo.assignOrder(first.id, tech.id);
    await expect(repo.assignOrder(second.id, tech.id)).rejects.toThrow();
    const completed = await repo.updateOrder(first.id, {
      ...input,
      technicianId: tech.id,
      status: "COMPLETED",
    });
    expect(completed.completedAt).toBe("2026-10-16T21:00:00.000Z");
    await expect(repo.assignOrder(second.id, tech.id)).resolves.toMatchObject({
      status: "ASSIGNED",
      technicianId: tech.id,
    });
  });
  it("preserva técnico ativo após indisponibilidade, mas bloqueia a reativação de ordem terminal", async () => {
    const repo = createLocalRepository(memoryStore());
    const tech = await repo.createTechnician(technician);
    const order = await repo.createOrder({
      ...input,
      status: "ASSIGNED",
      technicianId: tech.id,
    });
    await repo.updateTechnician(tech.id, { ...technician, available: false });
    await expect(
      repo.updateOrder(order.id, {
        ...input,
        status: "IN_PROGRESS",
        technicianId: tech.id,
      }),
    ).resolves.toMatchObject({ status: "IN_PROGRESS" });
    await repo.updateOrder(order.id, {
      ...input,
      status: "COMPLETED",
      technicianId: tech.id,
    });
    await expect(
      repo.updateOrder(order.id, {
        ...input,
        status: "ASSIGNED",
        technicianId: tech.id,
      }),
    ).rejects.toThrow();
  });
  it("registra conclusão automaticamente e limpa data ao reabrir", async () => {
    const repo = createLocalRepository(memoryStore());
    const order = await repo.createOrder({ ...input, status: "COMPLETED" });
    expect(order.completedAt).not.toBeNull();
    const reopened = await repo.updateOrder(order.id, input);
    expect(reopened.completedAt).toBeNull();
    expect(reopened.code).toBe(order.code);
  });
  it("bloqueia matrícula duplicada sem diferenciar maiúsculas", async () => {
    const repo = createLocalRepository(memoryStore());
    await repo.createTechnician(technician);
    await expect(
      repo.createTechnician({ ...technician, registration: "test-01" }),
    ).rejects.toThrow();
  });
  it("preserva vínculos históricos ao bloquear exclusão de técnico com ordem concluída", async () => {
    const repo = createLocalRepository(memoryStore());
    const tech = await repo.createTechnician(technician);
    await repo.createOrder({
      ...input,
      status: "COMPLETED",
      technicianId: tech.id,
    });
    await expect(repo.deleteTechnician(tech.id)).rejects.toThrow(
      "incluindo histórico",
    );
  });
  it("exclui ordem e técnico sem vínculos, registrando as ações", async () => {
    const repo = createLocalRepository(memoryStore());
    const tech = await repo.createTechnician(technician);
    const order = await repo.createOrder(input);
    await repo.deleteOrder(order.id);
    await repo.deleteTechnician(tech.id);
    const snapshot = await repo.load();
    expect(snapshot.orders.some((o) => o.id === order.id)).toBe(false);
    expect(snapshot.technicians.some((t) => t.id === tech.id)).toBe(false);
    expect(snapshot.activities[0].message).toContain("removido");
  });
  it("não altera ordens nem atividades quando o armazenamento falha", async () => {
    const storage = memoryStore();
    const repo = createLocalRepository(storage);
    const before = await repo.load();
    const saved = storage.getItem(STORAGE_KEY);
    const spy = vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    await expect(repo.createOrder(input)).rejects.toThrow("não foi gravada");
    expect(storage.getItem(STORAGE_KEY)).toBe(saved);
    spy.mockRestore();
    expect(await repo.load()).toEqual(before);
  });
  it("identifica JSON corrompido e só substitui dados mediante restauração explícita", async () => {
    const storage = memoryStore();
    storage.setItem(STORAGE_KEY, "{invalid");
    const repo = createLocalRepository(storage);
    await expect(repo.load()).rejects.toThrow("inválidos");
    expect(storage.getItem(STORAGE_KEY)).toBe("{invalid");
    await repo.reset!();
    await expect(repo.load()).resolves.toMatchObject({
      orders: expect.any(Array),
    });
  });
  it("rejeita datas impossíveis em snapshots persistidos", async () => {
    const storage = memoryStore();
    await createLocalRepository(storage).load();
    const data = JSON.parse(storage.getItem(STORAGE_KEY)!);
    data.snapshot.orders[0].dueDate = "2026-99-99";
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    await expect(createLocalRepository(storage).load()).rejects.toThrow(
      "inválidos",
    );
  });
  it("reconcilia contador atrasado e nunca reutiliza código excluído durante o uso normal", async () => {
    const storage = memoryStore();
    const repo = createLocalRepository(storage);
    await repo.load();
    const data = JSON.parse(storage.getItem(STORAGE_KEY)!);
    data.nextCode = 1001;
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    const first = await repo.createOrder(input);
    expect(first.code).toBe("OS-1037");
    await repo.deleteOrder(first.id);
    const next = await repo.createOrder(input);
    expect(next.code).toBe("OS-1038");
    await expect(repo.load()).resolves.toBeDefined();
  });
  it("rejeita contador fora da precisão segura sem entrar em laço infinito", async () => {
    const storage = memoryStore();
    await createLocalRepository(storage).load();
    const data = JSON.parse(storage.getItem(STORAGE_KEY)!);
    data.nextCode = 9007199254740992;
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    await expect(
      createLocalRepository(storage).createOrder(input),
    ).rejects.toThrow("inválidos");
  });
  it("não aceita alteração de identificador ou código por propriedades extras", async () => {
    const repo = createLocalRepository(memoryStore());
    const order = await repo.createOrder(input);
    const changed = await repo.updateOrder(order.id, {
      ...input,
      ...{ id: "changed", code: "changed" },
    });
    expect(changed.id).toBe(order.id);
    expect(changed.code).toBe(order.code);
  });
  it("exige técnico para ordens atribuídas e rejeita prazo anterior à abertura", async () => {
    const repo = createLocalRepository(memoryStore());
    await expect(
      repo.createOrder({ ...input, status: "ASSIGNED" }),
    ).rejects.toThrow();
    await expect(
      repo.createOrder({ ...input, dueDate: "2026-10-15" }),
    ).rejects.toThrow();
  });
  it("bloqueia reduzir capacidade abaixo da carga ativa", async () => {
    const repo = createLocalRepository(memoryStore());
    const tech = await repo.createTechnician({ ...technician, capacity: 2 });
    await repo.createOrder({
      ...input,
      status: "ASSIGNED",
      technicianId: tech.id,
    });
    await repo.createOrder({
      ...input,
      status: "IN_PROGRESS",
      technicianId: tech.id,
    });
    await expect(
      repo.updateTechnician(tech.id, { ...technician, capacity: 1 }),
    ).rejects.toThrow();
  });
});
describe("integridade dos dados fictícios", () => {
  it("mantém prazos após abertura, conclusões após abertura e antes do presente", () => {
    const seed = createSeed();
    for (const order of seed.orders) {
      expect(validDate(order.dueDate)).toBe(true);
      expect(order.dueDate >= localDate(new Date(order.createdAt))).toBe(true);
      if (order.completedAt) {
        expect(new Date(order.completedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(order.createdAt).getTime(),
        );
        expect(new Date(order.completedAt).getTime()).toBeLessThanOrEqual(
          Date.now(),
        );
      }
    }
  });
});
