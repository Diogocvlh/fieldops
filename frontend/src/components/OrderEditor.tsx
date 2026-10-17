import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { useFieldOps } from "../hooks/useFieldOps";
import {
  PRIORITIES,
  STATUSES,
  priorityLabels,
  statusLabels,
  type WorkOrder,
  type WorkOrderInput,
} from "../types";
import { daysFromToday, localDate } from "../utils/dates";
import { workload } from "../utils/metrics";
import {
  ServiceError,
  errorMessage,
  validateOrder,
} from "../services/validation";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Field, FormError } from "./shared";
const initial = (): WorkOrderInput => ({
  title: "",
  description: "",
  technicianId: null,
  priority: "MEDIUM",
  status: "OPEN",
  dueDate: daysFromToday(2),
});
export function OrderEditor({
  open,
  order,
  onClose,
}: {
  open: boolean;
  order?: WorkOrder;
  onClose: () => void;
}) {
  const { snapshot, execute } = useFieldOps();
  const [form, setForm] = useState<WorkOrderInput>(initial);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setForm(
        order
          ? {
              title: order.title,
              description: order.description,
              technicianId: order.technicianId,
              priority: order.priority,
              status: order.status,
              dueDate: order.dueDate,
            }
          : initial(),
      );
      setErrors({});
      setError("");
    }
  }, [open, order]);
  const set = <K extends keyof WorkOrderInput>(
    key: K,
    value: WorkOrderInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setErrors({});
    try {
      const clean = validateOrder(form, snapshot, order);
      await execute((repo) =>
        order ? repo.updateOrder(order.id, clean) : repo.createOrder(clean),
      );
      toast.success(
        order ? "Ordem de serviço atualizada." : "Ordem de serviço criada.",
      );
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ServiceError) setErrors(err.fieldErrors);
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !pending) onClose();
      }}
      title={order ? `Editar ${order.code}` : "Nova ordem de serviço"}
      description={
        order
          ? "Atualize o atendimento e mantenha a operação organizada."
          : "Descreva o atendimento. O código é gerado automaticamente."
      }
      wide
    >
      <form noValidate onSubmit={submit}>
        <div className="dialog-body form-stack">
          {error && <FormError message={error} />}
          <Field
            label="Título da ordem *"
            htmlFor="order-title"
            error={errors.title}
          >
            <input
              id="order-title"
              autoFocus
              className="input"
              value={form.title}
              maxLength={120}
              placeholder="Ex.: Manutenção do quadro elétrico"
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <Field
            label="Descrição"
            htmlFor="order-description"
            error={errors.description}
            hint={`${form.description.length}/2.000 caracteres`}
          >
            <textarea
              id="order-description"
              className="input"
              rows={3}
              value={form.description}
              maxLength={2000}
              placeholder="Detalhe o local, o problema e o serviço necessário..."
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <div className="form-grid">
            <Field
              label="Prioridade *"
              htmlFor="order-priority"
              error={errors.priority}
            >
              <select
                id="order-priority"
                className="input"
                value={form.priority}
                onChange={(e) =>
                  set("priority", e.target.value as WorkOrderInput["priority"])
                }
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabels[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Prazo de atendimento *"
              htmlFor="order-due"
              error={errors.dueDate}
            >
              <input
                id="order-due"
                className="input"
                type="date"
                value={form.dueDate}
                min={order ? localDate(new Date(order.createdAt)) : localDate()}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </Field>
          </div>
          <div className="form-grid">
            <Field
              label="Status *"
              htmlFor="order-status"
              error={errors.status}
            >
              <select
                id="order-status"
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as WorkOrderInput["status"],
                    technicianId:
                      e.target.value === "OPEN" ? null : prev.technicianId,
                  }))
                }
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Técnico responsável"
              htmlFor="order-technician"
              error={errors.technicianId}
            >
              <select
                id="order-technician"
                className="input"
                value={form.technicianId ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    technicianId: e.target.value || null,
                    status:
                      e.target.value && prev.status === "OPEN"
                        ? "ASSIGNED"
                        : prev.status,
                  }))
                }
              >
                <option value="">Sem técnico</option>
                {snapshot.technicians.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    disabled={
                      (!t.available ||
                        workload(snapshot.orders, t.id) >= t.capacity) &&
                      t.id !== order?.technicianId
                    }
                  >
                    {t.name}
                    {!t.available
                      ? " · indisponível"
                      : ` · ${workload(snapshot.orders, t.id)}/${t.capacity} OS`}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {form.status === "COMPLETED" && (
            <p className="info-note">
              A data e a hora de conclusão serão registradas automaticamente.
            </p>
          )}
          <p className="field-hint">
            * Campos obrigatórios. Ordens abertas não possuem técnico atribuído.
          </p>
        </div>
        <div className="dialog-footer">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}{" "}
            {order ? "Salvar alterações" : "Criar ordem"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
