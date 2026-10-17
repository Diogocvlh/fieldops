import {
  PRIORITIES,
  STATUSES,
  type Snapshot,
  type TechnicianInput,
  type WorkOrder,
  type WorkOrderInput,
} from "../types";
import { localDate, validDate } from "../utils/dates";
import { isActive, workload } from "../utils/metrics";

export class ServiceError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Não foi possível realizar a operação. Tente novamente.";
}
export function validateOrder(
  input: WorkOrderInput,
  snapshot: Snapshot,
  existing?: WorkOrder,
): WorkOrderInput {
  const clean: WorkOrderInput = {
    title: input.title.trim(),
    description: input.description.trim(),
    technicianId: input.technicianId || null,
    priority: input.priority,
    status: input.status,
    dueDate: input.dueDate,
  };
  const fields: Record<string, string> = {};
  if (clean.title.length < 3 || clean.title.length > 120)
    fields.title = "Informe um título entre 3 e 120 caracteres.";
  if (clean.description.length > 2000)
    fields.description = "A descrição pode ter até 2.000 caracteres.";
  if (!PRIORITIES.includes(clean.priority))
    fields.priority = "Selecione uma prioridade válida.";
  if (!STATUSES.includes(clean.status))
    fields.status = "Selecione um status válido.";
  if (!validDate(clean.dueDate)) fields.dueDate = "Informe uma data válida.";
  else if (
    clean.dueDate <
    localDate(existing ? new Date(existing.createdAt) : new Date())
  )
    fields.dueDate = "O prazo deve ser igual ou posterior à abertura.";
  if (clean.status === "OPEN" && clean.technicianId)
    fields.technicianId =
      "Ordens abertas não possuem técnico. Use o status Atribuída.";
  if (["ASSIGNED", "IN_PROGRESS"].includes(clean.status) && !clean.technicianId)
    fields.technicianId = "Selecione um técnico para este status.";
  if (clean.technicianId) {
    const technician = snapshot.technicians.find(
      (t) => t.id === clean.technicianId,
    );
    if (!technician) fields.technicianId = "Técnico não encontrado.";
    else {
      const wasActive = existing && isActive(existing);
      const willBeActive = ["ASSIGNED", "IN_PROGRESS"].includes(clean.status);
      const newAssignment =
        existing?.technicianId !== clean.technicianId ||
        (!wasActive && willBeActive);
      if (newAssignment && !technician.available)
        fields.technicianId =
          "Este técnico está indisponível para novas atribuições.";
      const otherOrders = snapshot.orders.filter((o) => o.id !== existing?.id);
      if (
        newAssignment &&
        workload(otherOrders, technician.id) >= technician.capacity
      )
        fields.technicianId =
          "O técnico atingiu a capacidade máxima de ordens ativas.";
    }
  }
  if (Object.keys(fields).length)
    throw new ServiceError("Revise os campos indicados.", fields);
  return clean;
}
export function validateTechnician(
  input: TechnicianInput,
  snapshot: Snapshot,
  id?: string,
): TechnicianInput {
  const clean: TechnicianInput = {
    name: input.name.trim(),
    registration: input.registration.trim().toUpperCase(),
    specialty: input.specialty.trim(),
    region: input.region.trim(),
    capacity: input.capacity,
    available: input.available,
  };
  const fields: Record<string, string> = {};
  if (clean.name.length < 3 || clean.name.length > 120)
    fields.name = "Informe um nome entre 3 e 120 caracteres.";
  if (clean.registration.length < 1 || clean.registration.length > 64)
    fields.registration = "A matrícula deve ter entre 1 e 64 caracteres.";
  if (
    snapshot.technicians.some(
      (t) =>
        t.id !== id &&
        t.registration.toLocaleLowerCase() ===
          clean.registration.toLocaleLowerCase(),
    )
  )
    fields.registration = "Esta matrícula já está cadastrada.";
  if (clean.specialty.length < 1 || clean.specialty.length > 120)
    fields.specialty = "Informe uma especialidade entre 1 e 120 caracteres.";
  if (clean.region.length < 1 || clean.region.length > 120)
    fields.region = "Informe uma região entre 1 e 120 caracteres.";
  if (
    !Number.isInteger(clean.capacity) ||
    clean.capacity < 1 ||
    clean.capacity > 20
  )
    fields.capacity = "A capacidade deve ser um inteiro entre 1 e 20.";
  else if (id && workload(snapshot.orders, id) > clean.capacity)
    fields.capacity =
      "A capacidade não pode ser menor que a carga de ordens ativas do técnico.";
  if (Object.keys(fields).length)
    throw new ServiceError("Revise os campos indicados.", fields);
  return clean;
}
