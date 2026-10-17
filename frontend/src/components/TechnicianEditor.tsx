import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { useFieldOps } from "../hooks/useFieldOps";
import type { Technician, TechnicianInput } from "../types";
import {
  ServiceError,
  errorMessage,
  validateTechnician,
} from "../services/validation";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Field, FormError } from "./shared";
const initial: TechnicianInput = {
  name: "",
  registration: "",
  specialty: "",
  region: "",
  available: true,
  capacity: 5,
};
export function TechnicianEditor({
  open,
  technician,
  onClose,
}: {
  open: boolean;
  technician?: Technician;
  onClose: () => void;
}) {
  const { snapshot, execute } = useFieldOps();
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setForm(
        technician
          ? {
              name: technician.name,
              registration: technician.registration,
              specialty: technician.specialty,
              region: technician.region,
              available: technician.available,
              capacity: technician.capacity,
            }
          : initial,
      );
      setErrors({});
      setError("");
    }
  }, [open, technician]);
  const set = <K extends keyof TechnicianInput>(
    key: K,
    value: TechnicianInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setErrors({});
    try {
      const clean = validateTechnician(form, snapshot, technician?.id);
      await execute((repo) =>
        technician
          ? repo.updateTechnician(technician.id, clean)
          : repo.createTechnician(clean),
      );
      toast.success(
        technician
          ? "Cadastro do técnico atualizado."
          : "Técnico adicionado à equipe.",
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
      title={technician ? "Editar técnico" : "Adicionar técnico"}
      description="Organize especialidades, regiões e capacidade da equipe."
    >
      <form noValidate onSubmit={submit}>
        <div className="dialog-body form-stack">
          {error && <FormError message={error} />}
          <Field
            label="Nome completo *"
            htmlFor="tech-name"
            error={errors.name}
          >
            <input
              className="input"
              autoFocus
              id="tech-name"
              value={form.name}
              maxLength={120}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nome do técnico"
            />
          </Field>
          <div className="form-grid">
            <Field
              label="Matrícula *"
              htmlFor="tech-registration"
              error={errors.registration}
            >
              <input
                className="input"
                id="tech-registration"
                value={form.registration}
                maxLength={64}
                onChange={(e) => set("registration", e.target.value)}
                placeholder="TEC-007"
              />
            </Field>
            <Field
              label="Especialidade *"
              htmlFor="tech-specialty"
              error={errors.specialty}
            >
              <input
                className="input"
                id="tech-specialty"
                value={form.specialty}
                maxLength={120}
                onChange={(e) => set("specialty", e.target.value)}
                placeholder="Ex.: Elétrica"
              />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Região *" htmlFor="tech-region" error={errors.region}>
              <input
                className="input"
                id="tech-region"
                value={form.region}
                maxLength={120}
                onChange={(e) => set("region", e.target.value)}
                placeholder="Ex.: Zona Norte"
              />
            </Field>
            <Field
              label="Capacidade de OS ativas *"
              htmlFor="tech-capacity"
              error={errors.capacity}
            >
              <input
                className="input"
                id="tech-capacity"
                type="number"
                min={1}
                max={20}
                value={form.capacity}
                onChange={(e) => set("capacity", Number(e.target.value))}
              />
            </Field>
          </div>
          <label className="availability-control">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => set("available", e.target.checked)}
            />
            <span>
              <strong>Disponível para atribuições</strong>
              <small>
                Desative para impedir novas ordens para este técnico.
              </small>
            </span>
          </label>
          <p className="field-hint">
            * Campos obrigatórios. A matrícula deve ser única.
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
          <Button type="submit" disabled={pending}>
            {pending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}{" "}
            Salvar técnico
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
