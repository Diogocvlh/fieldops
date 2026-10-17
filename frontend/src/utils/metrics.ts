import type { Snapshot, WorkOrder } from "../types";
import { daysFromToday, localDate } from "./dates";
export const isActive = (order: WorkOrder) =>
  order.status === "ASSIGNED" || order.status === "IN_PROGRESS";
export const isTerminal = (order: WorkOrder) =>
  order.status === "COMPLETED" || order.status === "CANCELLED";
export const isOverdue = (order: WorkOrder) =>
  !isTerminal(order) && order.dueDate < localDate();
export const workload = (orders: WorkOrder[], id: string) =>
  orders.filter((order) => order.technicianId === id && isActive(order)).length;
export function metrics(orders: WorkOrder[]) {
  return {
    total: orders.length,
    open: orders.filter((o) => o.status === "OPEN").length,
    assigned: orders.filter((o) => o.status === "ASSIGNED").length,
    progress: orders.filter((o) => o.status === "IN_PROGRESS").length,
    completed: orders.filter((o) => o.status === "COMPLETED").length,
    overdue: orders.filter(isOverdue).length,
  };
}
export function productivity(orders: WorkOrder[], dayCount = 7) {
  return Array.from({ length: dayCount }, (_, i) => {
    const day = daysFromToday(i - dayCount + 1);
    return {
      day,
      label: new Date(`${day}T12:00:00`)
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", ""),
      abertas: orders.filter((o) => localDate(new Date(o.createdAt)) === day)
        .length,
      concluidas: orders.filter(
        (o) => o.completedAt && localDate(new Date(o.completedAt)) === day,
      ).length,
    };
  });
}
export function filterOrders(
  snapshot: Snapshot,
  filters: {
    search?: string;
    status?: string;
    priority?: string;
    technicianId?: string;
    from?: string;
    to?: string;
    overdue?: boolean;
  },
) {
  const search = (filters.search ?? "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return snapshot.orders.filter((order) => {
    const technician = snapshot.technicians.find(
      (t) => t.id === order.technicianId,
    );
    const text =
      `${order.code} ${order.title} ${order.description} ${technician?.name ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const day = localDate(new Date(order.createdAt));
    return (
      text.includes(search) &&
      (!filters.status || order.status === filters.status) &&
      (!filters.priority || order.priority === filters.priority) &&
      (!filters.technicianId ||
        (filters.technicianId === "unassigned"
          ? !order.technicianId
          : order.technicianId === filters.technicianId)) &&
      (!filters.from || day >= filters.from) &&
      (!filters.to || day <= filters.to) &&
      (!filters.overdue || isOverdue(order))
    );
  });
}
