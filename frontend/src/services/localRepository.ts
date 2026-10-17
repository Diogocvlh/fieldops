import {
  PRIORITIES,
  STATUSES,
  statusLabels,
  type Repository,
  type Snapshot,
  type Technician,
  type WorkOrder,
  type WorkOrderInput,
} from "../types";
import { createSeed } from "./seed";
import { ServiceError, validateOrder, validateTechnician } from "./validation";
import { validDate } from "../utils/dates";

export const STORAGE_KEY = "fieldops.demo.v1";
interface StoredData {
  version: 1;
  nextCode: number;
  snapshot: Snapshot;
}
type StoragePort = Pick<Storage, "getItem" | "setItem">;
const validStamp = (value: unknown) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  validDate(value.slice(0, 10)) &&
  !Number.isNaN(Date.parse(value));
function validSnapshot(data: StoredData): boolean {
  const snap = data?.snapshot;
  if (
    data.version !== 1 ||
    !Number.isSafeInteger(data.nextCode) ||
    data.nextCode < 1 ||
    !snap ||
    !Array.isArray(snap.orders) ||
    !Array.isArray(snap.technicians) ||
    !Array.isArray(snap.activities)
  )
    return false;
  if (
    !snap.technicians.every(
      (t) =>
        typeof t.id === "string" &&
        typeof t.name === "string" &&
        typeof t.registration === "string" &&
        typeof t.specialty === "string" &&
        typeof t.region === "string" &&
        typeof t.available === "boolean" &&
        Number.isInteger(t.capacity) &&
        t.capacity >= 1 &&
        t.capacity <= 20,
    )
  )
    return false;
  if (
    !snap.orders.every(
      (o) =>
        typeof o.id === "string" &&
        typeof o.code === "string" &&
        typeof o.title === "string" &&
        typeof o.description === "string" &&
        (o.technicianId === null ||
          snap.technicians.some((t) => t.id === o.technicianId)) &&
        STATUSES.includes(o.status) &&
        PRIORITIES.includes(o.priority) &&
        validStamp(o.createdAt) &&
        validStamp(o.updatedAt) &&
        validDate(o.dueDate) &&
        (o.status === "COMPLETED"
          ? validStamp(o.completedAt)
          : o.completedAt === null),
    )
  )
    return false;
  if (
    !snap.activities.every(
      (a) =>
        typeof a.id === "string" &&
        typeof a.message === "string" &&
        validStamp(a.createdAt) &&
        (a.workOrderId === null || typeof a.workOrderId === "string"),
    )
  )
    return false;
  return (
    new Set(snap.orders.map((o) => o.id)).size === snap.orders.length &&
    new Set(snap.orders.map((o) => o.code)).size === snap.orders.length &&
    new Set(snap.technicians.map((t) => t.id)).size ===
      snap.technicians.length &&
    new Set(snap.technicians.map((t) => t.registration.toLocaleLowerCase()))
      .size === snap.technicians.length
  );
}
export function createLocalRepository(storage: StoragePort): Repository {
  function write(data: StoredData) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      throw new ServiceError(
        "Não foi possível salvar neste navegador. Verifique o espaço disponível e a permissão de armazenamento. A alteração não foi gravada.",
      );
    }
  }
  function read(): StoredData {
    let raw: string | null;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      throw new ServiceError(
        "O armazenamento local está bloqueado. Permita o armazenamento do navegador para usar a demonstração.",
      );
    }
    if (raw === null) {
      const data: StoredData = {
        version: 1,
        nextCode: 1037,
        snapshot: createSeed(),
      };
      write(data);
      return data;
    }
    try {
      const data = JSON.parse(raw) as StoredData;
      if (!validSnapshot(data)) throw new Error("invalid");
      const codes = data.snapshot.orders.map((o) =>
        /^OS-\d+$/.test(o.code) ? Number(o.code.slice(3)) : 0,
      );
      if (
        codes.some(
          (code) =>
            !Number.isSafeInteger(code) || code >= Number.MAX_SAFE_INTEGER,
        )
      )
        throw new Error("invalid");
      data.nextCode = Math.max(data.nextCode, ...codes.map((code) => code + 1));
      return data;
    } catch {
      throw new ServiceError(
        "Os dados locais estão inválidos ou são de uma versão incompatível. Restaure a demonstração para começar novamente.",
      );
    }
  }
  function mutate<T>(fn: (data: StoredData) => T): T {
    const data = read();
    const result = fn(data);
    write(data);
    return result;
  }
  function activity(
    data: StoredData,
    message: string,
    workOrderId: string | null = null,
  ) {
    data.snapshot.activities.unshift({
      id: crypto.randomUUID(),
      message,
      workOrderId,
      createdAt: new Date().toISOString(),
    });
    data.snapshot.activities = data.snapshot.activities.slice(0, 300);
  }
  function update(
    data: StoredData,
    id: string,
    input: WorkOrderInput,
  ): WorkOrder {
    const existing = data.snapshot.orders.find((o) => o.id === id);
    if (!existing)
      throw new ServiceError(
        "Ordem de serviço não encontrada. Atualize os dados e tente novamente.",
      );
    const clean = validateOrder(input, data.snapshot, existing);
    const now = new Date().toISOString();
    Object.assign(existing, clean, {
      updatedAt: now,
      completedAt:
        clean.status === "COMPLETED" ? (existing.completedAt ?? now) : null,
    });
    return existing;
  }
  return {
    async load() {
      return structuredClone(read().snapshot);
    },
    async createOrder(input) {
      return mutate((data) => {
        const clean = validateOrder(input, data.snapshot);
        const now = new Date().toISOString();
        if (data.nextCode >= Number.MAX_SAFE_INTEGER)
          throw new ServiceError(
            "O limite de identificadores foi atingido. Restaure a demonstração para continuar.",
          );
        while (
          data.snapshot.orders.some((o) => o.code === `OS-${data.nextCode}`)
        ) {
          if (data.nextCode >= Number.MAX_SAFE_INTEGER - 1)
            throw new ServiceError("O limite de identificadores foi atingido.");
          data.nextCode++;
        }
        const order: WorkOrder = {
          ...clean,
          id: crypto.randomUUID(),
          code: `OS-${data.nextCode++}`,
          createdAt: now,
          updatedAt: now,
          completedAt: clean.status === "COMPLETED" ? now : null,
        };
        data.snapshot.orders.unshift(order);
        activity(data, `${order.code} criada: ${order.title}.`, order.id);
        return order;
      });
    },
    async updateOrder(id, input) {
      return mutate((data) => {
        const order = update(data, id, input);
        activity(
          data,
          `${order.code} atualizada • ${statusLabels[order.status]}.`,
          id,
        );
        return order;
      });
    },
    async deleteOrder(id) {
      mutate((data) => {
        const order = data.snapshot.orders.find((o) => o.id === id);
        if (!order) throw new ServiceError("Ordem não encontrada.");
        data.snapshot.orders = data.snapshot.orders.filter((o) => o.id !== id);
        activity(data, `${order.code} excluída.`, null);
      });
    },
    async assignOrder(id, technicianId) {
      return mutate((data) => {
        const order = data.snapshot.orders.find((o) => o.id === id);
        if (!order) throw new ServiceError("Ordem não encontrada.");
        if (order.status === "COMPLETED" || order.status === "CANCELLED")
          throw new ServiceError("Reabra a ordem antes de atribuí-la.");
        const result = update(data, id, {
          ...order,
          status: "ASSIGNED",
          technicianId,
        });
        activity(
          data,
          `${order.code} atribuída a ${data.snapshot.technicians.find((t) => t.id === technicianId)?.name}.`,
          id,
        );
        return result;
      });
    },
    async createTechnician(input) {
      return mutate((data) => {
        const clean = validateTechnician(input, data.snapshot);
        const technician: Technician = { ...clean, id: crypto.randomUUID() };
        data.snapshot.technicians.push(technician);
        activity(data, `${technician.name} adicionado à equipe.`);
        return technician;
      });
    },
    async updateTechnician(id, input) {
      return mutate((data) => {
        const tech = data.snapshot.technicians.find((t) => t.id === id);
        if (!tech) throw new ServiceError("Técnico não encontrado.");
        Object.assign(tech, validateTechnician(input, data.snapshot, id));
        activity(data, `Cadastro de ${tech.name} atualizado.`);
        return tech;
      });
    },
    async deleteTechnician(id) {
      mutate((data) => {
        if (data.snapshot.orders.some((o) => o.technicianId === id))
          throw new ServiceError(
            "Este técnico possui ordens vinculadas, incluindo histórico. Edite essas ordens para desvincular ou trocar o técnico antes de excluir.",
          );
        const tech = data.snapshot.technicians.find((t) => t.id === id);
        if (!tech) throw new ServiceError("Técnico não encontrado.");
        data.snapshot.technicians = data.snapshot.technicians.filter(
          (t) => t.id !== id,
        );
        activity(data, `${tech.name} removido da equipe.`);
      });
    },
    async reset() {
      const snapshot = createSeed();
      write({ version: 1, nextCode: 1037, snapshot });
      return snapshot;
    },
  };
}
