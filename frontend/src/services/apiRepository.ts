import type { Repository, Snapshot, Technician, WorkOrder } from "../types";
import { ServiceError } from "./validation";
export function createApiRepository(baseUrl: string): Repository {
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ServiceError(
        "Não foi possível acessar a API Java. Verifique se o servidor está iniciado e se a URL configurada está correta.",
      );
    }
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as {
        detail?: string;
        fieldErrors?: Record<string, string>;
      } | null;
      throw new ServiceError(
        problem?.detail ??
          `A API retornou um erro (${response.status}). Tente novamente.`,
        problem?.fieldErrors,
      );
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
  return {
    load: () => request<Snapshot>("/snapshot"),
    createOrder: (input) => request<WorkOrder>("/work-orders", "POST", input),
    updateOrder: (id, input) =>
      request<WorkOrder>(
        `/work-orders/${encodeURIComponent(id)}`,
        "PUT",
        input,
      ),
    deleteOrder: (id) =>
      request<void>(`/work-orders/${encodeURIComponent(id)}`, "DELETE"),
    assignOrder: (id, technicianId) =>
      request<WorkOrder>(
        `/work-orders/${encodeURIComponent(id)}/assign`,
        "POST",
        { technicianId },
      ),
    createTechnician: (input) =>
      request<Technician>("/technicians", "POST", input),
    updateTechnician: (id, input) =>
      request<Technician>(
        `/technicians/${encodeURIComponent(id)}`,
        "PUT",
        input,
      ),
    deleteTechnician: (id) =>
      request<void>(`/technicians/${encodeURIComponent(id)}`, "DELETE"),
  };
}
