import {
  priorityLabels,
  statusLabels,
  type Snapshot,
  type WorkOrder,
} from "../types";
export function createCsv(orders: WorkOrder[], snapshot: Snapshot): string {
  const escape = (value: unknown) =>
    `"${String(value ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replace(/"/g, '""')}"`;
  const rows = [
    [
      "Código",
      "Título",
      "Descrição",
      "Técnico",
      "Prioridade",
      "Status",
      "Abertura",
      "Prazo",
      "Conclusão",
    ],
    ...orders.map((order) => [
      order.code,
      order.title,
      order.description,
      snapshot.technicians.find((t) => t.id === order.technicianId)?.name ??
        "Sem técnico",
      priorityLabels[order.priority],
      statusLabels[order.status],
      order.createdAt,
      order.dueDate,
      order.completedAt ?? "",
    ]),
  ];
  return "\ufeff" + rows.map((row) => row.map(escape).join(";")).join("\r\n");
}
export function downloadCsv(
  orders: WorkOrder[],
  snapshot: Snapshot,
  filename = "fieldops-ordens.csv",
): void {
  const url = URL.createObjectURL(
    new Blob([createCsv(orders, snapshot)], {
      type: "text/csv;charset=utf-8;",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
