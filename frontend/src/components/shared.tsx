import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  ClipboardList,
  LoaderCircle,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import {
  priorityLabels,
  statusLabels,
  type OrderStatus,
  type Priority,
} from "../types";
import { errorMessage } from "../services/validation";
import { cn } from "../utils/cn";
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span />
      {statusLabels[status]}
    </span>
  );
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority-badge priority-${priority}`}>
      <span />
      {priorityLabels[priority]}
    </span>
  );
}
export function Avatar({
  name,
  index = 0,
  small = false,
}: {
  name: string;
  index?: number;
  small?: boolean;
}) {
  return (
    <span
      className={cn("avatar", `avatar-${index % 6}`, small && "avatar-small")}
      aria-hidden="true"
    >
      {name
        .split(" ")
        .map((word) => word[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      <div className="intro-actions">{children}</div>
    </div>
  );
}
export function EmptyState({
  title = "Nenhum resultado encontrado",
  description = "Tente ajustar os filtros ou adicione um novo registro.",
  action,
  icon: Icon = ClipboardList,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={25} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Pesquisar...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-field">
      <Search size={17} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Limpar pesquisa">
          <X size={15} />
        </button>
      )}
    </div>
  );
}
export function Field({
  label,
  error,
  children,
  hint,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("form-field", error && "field-invalid")}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}
export function FormError({ message }: { message: string }) {
  return (
    <div className="form-error" role="alert">
      <AlertTriangle size={17} />
      <span>{message}</span>
    </div>
  );
}
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  onConfirm,
  confirmLabel = "Excluir registro",
  destructive = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) setError("");
  }, [open, title]);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !pending) {
          setError("");
          onClose();
        }
      }}
      title={title}
      description={description}
    >
      <div className="dialog-body">
        {error && <FormError message={error} />}
        <div className="confirm-note">
          <AlertTriangle size={21} />
          <p>
            {destructive
              ? "Esta ação é permanente. Confirme para continuar."
              : "Confirme para continuar com esta ação."}
          </p>
        </div>
      </div>
      <div className="dialog-footer">
        <Button variant="outline" disabled={pending} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError("");
            try {
              await onConfirm();
              onClose();
            } catch (err) {
              const message = errorMessage(err);
              setError(message);
              toast.error(message);
            } finally {
              setPending(false);
            }
          }}
        >
          {pending && <LoaderCircle className="animate-spin" size={16} />}{" "}
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "blue",
  children,
}: {
  label: string;
  value: number | string;
  note: string;
  icon: LucideIcon;
  tone?: string;
  children?: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <div className={`stat-icon tone-${tone}`}>
          <Icon size={19} />
        </div>
      </div>
      <strong className="stat-value">
        {typeof value === "number" ? String(value).padStart(2, "0") : value}
      </strong>
      <div className="stat-bottom">
        {children}
        <span>{note}</span>
      </div>
    </div>
  );
}
export function ExportButton({
  onClick,
  disabled = false,
  label = "Exportar CSV",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        onClick();
        toast.success("Arquivo CSV exportado.");
      }}
      disabled={disabled}
    >
      <ArrowDownToLine size={16} />
      {label}
    </Button>
  );
}
export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <p className="success-note">
      <Check size={15} />
      {children}
    </p>
  );
}
