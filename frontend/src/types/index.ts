export const STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof STATUSES)[number];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const statusLabels: Record<OrderStatus, string> = {
  OPEN: "Aberta",
  ASSIGNED: "Atribuída",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};
export const priorityLabels: Record<Priority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};
export interface Technician {
  id: string;
  name: string;
  registration: string;
  specialty: string;
  region: string;
  available: boolean;
  capacity: number;
}
export type TechnicianInput = Omit<Technician, "id">;
export interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  technicianId: string | null;
  priority: Priority;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  completedAt: string | null;
}
export type WorkOrderInput = Pick<
  WorkOrder,
  "title" | "description" | "technicianId" | "priority" | "status" | "dueDate"
>;
export interface Activity {
  id: string;
  message: string;
  createdAt: string;
  workOrderId: string | null;
}
export interface Snapshot {
  technicians: Technician[];
  orders: WorkOrder[];
  activities: Activity[];
}
export interface Repository {
  load(): Promise<Snapshot>;
  createOrder(input: WorkOrderInput): Promise<WorkOrder>;
  updateOrder(id: string, input: WorkOrderInput): Promise<WorkOrder>;
  deleteOrder(id: string): Promise<void>;
  assignOrder(id: string, technicianId: string): Promise<WorkOrder>;
  createTechnician(input: TechnicianInput): Promise<Technician>;
  updateTechnician(id: string, input: TechnicianInput): Promise<Technician>;
  deleteTechnician(id: string): Promise<void>;
  reset?(): Promise<Snapshot>;
}
