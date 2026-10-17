import { createContext, useContext, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCheck,
  Clock3,
  FileText,
  Pencil,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useFieldOps } from "./useFieldOps";
import type { WorkOrder } from "../types";
import { dateLabel, dateTimeLabel } from "../utils/dates";
import { errorMessage } from "../services/validation";
import { OrderEditor } from "../components/OrderEditor";
import { Dialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import {
  ConfirmDialog,
  PriorityBadge,
  StatusBadge,
} from "../components/shared";
const Context = createContext<{
  openEditor: (order?: WorkOrder) => void;
  showOrder: (order: WorkOrder) => void;
} | null>(null);
export function OrderDialogProvider({ children }: { children: ReactNode }) {
  const { snapshot, execute } = useFieldOps();
  const [editor, setEditor] = useState<{ order?: WorkOrder } | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<WorkOrder | null>(null);
  const [pending, setPending] = useState(false);
  const order = snapshot.orders.find((o) => o.id === viewId);
  async function changeStatus(status: WorkOrder["status"]) {
    if (!order) return;
    setPending(true);
    try {
      await execute((repo) =>
        repo.updateOrder(order.id, {
          title: order.title,
          description: order.description,
          technicianId: status === "OPEN" ? null : order.technicianId,
          priority: order.priority,
          status,
          dueDate: order.dueDate,
        }),
      );
      toast.success(
        status === "COMPLETED"
          ? "Ordem concluída. Data de conclusão registrada."
          : status === "OPEN"
            ? "Ordem reaberta e disponível para distribuição."
            : "Atendimento iniciado.",
      );
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  }
  return (
    <Context.Provider
      value={{
        openEditor: (order) => setEditor({ order }),
        showOrder: (order) => setViewId(order.id),
      }}
    >
      {children}
      <OrderEditor
        open={!!editor}
        order={editor?.order}
        onClose={() => setEditor(null)}
      />
      <Dialog
        open={!!order}
        onOpenChange={(value) => {
          if (!value) setViewId(null);
        }}
        title={order?.code ?? "Ordem de serviço"}
        description="Detalhes do atendimento e histórico da ordem."
        wide
      >
        {order && (
          <>
            <div className="dialog-body order-details">
              <div className="detail-badges">
                <StatusBadge status={order.status} />
                <PriorityBadge priority={order.priority} />
              </div>
              <h2>{order.title}</h2>
              <p className="detail-description">
                {order.description || "Nenhuma descrição informada."}
              </p>
              <div className="detail-grid">
                <div>
                  <UserRound size={18} />
                  <span>
                    <small>Técnico responsável</small>
                    <strong>
                      {snapshot.technicians.find(
                        (t) => t.id === order.technicianId,
                      )?.name ?? "Aguardando atribuição"}
                    </strong>
                  </span>
                </div>
                <div>
                  <CalendarDays size={18} />
                  <span>
                    <small>Prazo de atendimento</small>
                    <strong>
                      {dateLabel(order.dueDate, {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                </div>
                <div>
                  <Clock3 size={18} />
                  <span>
                    <small>Data de abertura</small>
                    <strong>{dateTimeLabel(order.createdAt)}</strong>
                  </span>
                </div>
                <div>
                  <CheckCheck size={18} />
                  <span>
                    <small>Data de conclusão</small>
                    <strong>
                      {order.completedAt
                        ? dateTimeLabel(order.completedAt)
                        : "Ainda não concluída"}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="detail-history">
                <h3>
                  <FileText size={16} />
                  Histórico da ordem
                </h3>
                {snapshot.activities.filter((a) => a.workOrderId === order.id)
                  .length ? (
                  snapshot.activities
                    .filter((a) => a.workOrderId === order.id)
                    .slice(0, 8)
                    .map((a) => (
                      <div key={a.id}>
                        <span>{a.message}</span>
                        <small>{dateTimeLabel(a.createdAt)}</small>
                      </div>
                    ))
                ) : (
                  <p>Sem atividades registradas para esta ordem.</p>
                )}
              </div>
            </div>
            <div className="dialog-footer detail-footer">
              <Button
                variant="ghost"
                className="text-danger"
                onClick={() => {
                  setViewId(null);
                  setDeleting(order);
                }}
              >
                <Trash2 size={16} />
                Excluir
              </Button>
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewId(null);
                    setEditor({ order });
                  }}
                >
                  <Pencil size={15} />
                  Editar
                </Button>
                {order.status === "ASSIGNED" && (
                  <Button
                    disabled={pending}
                    onClick={() => void changeStatus("IN_PROGRESS")}
                  >
                    Iniciar atendimento
                  </Button>
                )}
                {order.status === "IN_PROGRESS" && (
                  <Button
                    disabled={pending}
                    onClick={() => void changeStatus("COMPLETED")}
                  >
                    <CheckCheck size={16} />
                    Concluir
                  </Button>
                )}
                {(order.status === "COMPLETED" ||
                  order.status === "CANCELLED") && (
                  <Button
                    disabled={pending}
                    onClick={() => void changeStatus("OPEN")}
                  >
                    <RotateCcw size={15} />
                    Reabrir
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Excluir ${deleting?.code ?? "ordem"}?`}
        description="A ordem será removida. Os indicadores serão recalculados e a exclusão será registrada nas atividades."
        onConfirm={async () => {
          if (deleting) {
            await execute((repo) => repo.deleteOrder(deleting.id));
            toast.success("Ordem excluída.");
          }
        }}
      />
    </Context.Provider>
  );
}
export function useOrderDialogs() {
  const context = useContext(Context);
  if (!context) throw new Error("OrderDialogProvider ausente.");
  return context;
}
