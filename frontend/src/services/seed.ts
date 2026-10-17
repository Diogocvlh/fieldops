import type { Snapshot, WorkOrder, OrderStatus, Priority } from "../types";
import { daysFromToday } from "../utils/dates";

export function createSeed(): Snapshot {
  const technicians = [
    {
      name: "Rafael Martins",
      registration: "TEC-001",
      specialty: "Elétrica",
      region: "Zona Norte",
      available: true,
      capacity: 6,
    },
    {
      name: "Camila Duarte",
      registration: "TEC-002",
      specialty: "Climatização",
      region: "Zona Sul",
      available: true,
      capacity: 5,
    },
    {
      name: "Bruno Almeida",
      registration: "TEC-003",
      specialty: "Redes e infraestrutura",
      region: "Zona Leste",
      available: true,
      capacity: 4,
    },
    {
      name: "Juliana Costa",
      registration: "TEC-004",
      specialty: "Manutenção predial",
      region: "Zona Oeste",
      available: true,
      capacity: 6,
    },
    {
      name: "Pedro Nogueira",
      registration: "TEC-005",
      specialty: "Automação",
      region: "Centro",
      available: false,
      capacity: 4,
    },
    {
      name: "Marina Ribeiro",
      registration: "TEC-006",
      specialty: "Hidráulica",
      region: "Zona Sul",
      available: true,
      capacity: 5,
    },
  ].map((t) => ({ ...t, id: crypto.randomUUID() }));
  const titles = [
    "Inspeção do quadro elétrico",
    "Manutenção preventiva do climatizador",
    "Revisão dos pontos de rede",
    "Reparo na iluminação externa",
    "Verificação do sistema de automação",
    "Troca de válvula hidráulica",
    "Instalação de circuito de emergência",
    "Limpeza dos filtros de ventilação",
    "Diagnóstico do cabeamento estruturado",
    "Vistoria das instalações prediais",
    "Calibração dos sensores",
    "Revisão do sistema de bombeamento",
  ];
  const locations = [
    "Unidade Horizonte",
    "Edifício Aurora",
    "Centro Operacional",
    "Unidade Jardim",
    "Espaço Alameda",
    "Edifício Vila Nova",
  ];
  const orders: WorkOrder[] = Array.from({ length: 36 }, (_, index) => {
    const status: OrderStatus =
      index < 8
        ? "OPEN"
        : index < 13
          ? "ASSIGNED"
          : index < 18
            ? "IN_PROGRESS"
            : index < 34
              ? "COMPLETED"
              : "CANCELLED";
    const offset =
      status === "OPEN" || status === "ASSIGNED" || status === "IN_PROGRESS"
        ? -(2 + (index % 5))
        : -(8 + (index % 12));
    const createdAt = new Date(
      `${daysFromToday(offset)}T${String(8 + (index % 9)).padStart(2, "0")}:15:00`,
    ).toISOString();
    const completedAt =
      status === "COMPLETED"
        ? new Date(
            Math.min(
              Date.now() - 60000,
              new Date(`${daysFromToday(-(index % 7))}T14:30:00`).getTime(),
            ),
          ).toISOString()
        : null;
    return {
      id: crypto.randomUUID(),
      code: `OS-${String(1001 + index).padStart(4, "0")}`,
      title: titles[index % titles.length],
      description: `Atendimento em ${locations[index % locations.length]}. Realizar avaliação técnica, executar os ajustes necessários e registrar os procedimentos realizados. Dados fictícios para demonstração.`,
      technicianId:
        status === "OPEN"
          ? null
          : technicians[(index - 8 + 36) % technicians.length].id,
      priority: (
        ["HIGH", "MEDIUM", "LOW", "MEDIUM", "CRITICAL", "HIGH"] as Priority[]
      )[index % 6],
      status,
      createdAt,
      updatedAt: completedAt ?? createdAt,
      dueDate: daysFromToday(
        index < 3
          ? -1
          : status === "COMPLETED" || status === "CANCELLED"
            ? 1
            : 1 + (index % 6),
      ),
      completedAt,
    };
  });
  const activities = [
    {
      message: "OS-1026 concluída por Marina Ribeiro.",
      workOrderId: orders[25].id,
      minutes: 12,
    },
    {
      message: "OS-1014 iniciada por Marina Ribeiro.",
      workOrderId: orders[13].id,
      minutes: 34,
    },
    {
      message: "OS-1009 atribuída a Rafael Martins.",
      workOrderId: orders[8].id,
      minutes: 58,
    },
    {
      message: "OS-1001 criada com prioridade alta.",
      workOrderId: orders[0].id,
      minutes: 96,
    },
    {
      message: "Equipe de demonstração cadastrada.",
      workOrderId: null,
      minutes: 140,
    },
  ].map((a) => ({
    id: crypto.randomUUID(),
    message: a.message,
    workOrderId: a.workOrderId,
    createdAt: new Date(Date.now() - a.minutes * 60000).toISOString(),
  }));
  return { technicians, orders, activities };
}
