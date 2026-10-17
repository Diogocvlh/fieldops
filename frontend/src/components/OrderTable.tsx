import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { WorkOrder } from "../types";
import { useFieldOps } from "../hooks/useFieldOps";
import { useOrderDialogs } from "../hooks/useOrderDialogs";
import { dateLabel } from "../utils/dates";
import { isOverdue } from "../utils/metrics";
import { Avatar, EmptyState, PriorityBadge, StatusBadge } from "./shared";
import { Button } from "./ui/button";
export function OrderTable({
  orders,
  compact = false,
  pageSize = 8,
}: {
  orders: WorkOrder[];
  compact?: boolean;
  pageSize?: number;
}) {
  const { snapshot } = useFieldOps();
  const { openEditor, showOrder } = useOrderDialogs();
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  useEffect(() => {
    setPage(1);
  }, [orders]);
  const safePage = Math.min(page, pageCount);
  const visible = compact
    ? orders.slice(0, 5)
    : orders.slice((safePage - 1) * pageSize, safePage * pageSize);
  if (!orders.length)
    return (
      <EmptyState
        action={
          <Button size="sm" onClick={() => openEditor()}>
            Criar ordem de serviço
          </Button>
        }
      />
    );
  return (
    <>
      <div className="desktop-orders">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ordem de serviço</th>
              <th>Técnico</th>
              {!compact && <th>Prioridade</th>}
              <th>{compact ? "Prazo" : "Abertura / prazo"}</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((order) => {
              const technician = snapshot.technicians.find(
                (t) => t.id === order.technicianId,
              );
              return (
                <tr key={order.id}>
                  <td>
                    <button
                      className="order-title-button"
                      onClick={() => showOrder(order)}
                    >
                      <span className="order-code">{order.code}</span>
                      <strong>{order.title}</strong>
                      {!compact && (
                        <small>{order.description || "Sem descrição"}</small>
                      )}
                    </button>
                  </td>
                  <td>
                    {technician ? (
                      <div className="person-cell">
                        <Avatar
                          name={technician.name}
                          index={snapshot.technicians.indexOf(technician)}
                          small
                        />
                        <span>
                          {technician.name.split(" ").slice(0, 2).join(" ")}
                        </span>
                      </div>
                    ) : (
                      <span className="muted">Não atribuído</span>
                    )}
                  </td>
                  {!compact && (
                    <td>
                      <PriorityBadge priority={order.priority} />
                    </td>
                  )}
                  <td>
                    <div className="date-cell">
                      {!compact && <small>{dateLabel(order.createdAt)}</small>}
                      <span className={isOverdue(order) ? "overdue-date" : ""}>
                        {isOverdue(order) && <span className="deadline-dot" />}
                        {dateLabel(order.dueDate)}
                        {isOverdue(order) && <small>Atrasada</small>}
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ver ${order.code}`}
                        onClick={() => showOrder(order)}
                      >
                        {compact ? (
                          <ArrowUpRight size={17} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </Button>
                      {!compact && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${order.code}`}
                          onClick={() => openEditor(order)}
                        >
                          <Pencil size={15} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mobile-orders">
        {visible.map((order) => {
          const technician = snapshot.technicians.find(
            (t) => t.id === order.technicianId,
          );
          return (
            <button
              className="mobile-order-card"
              key={order.id}
              onClick={() => showOrder(order)}
            >
              <div>
                <span className="order-code">{order.code}</span>
                <StatusBadge status={order.status} />
              </div>
              <strong>{order.title}</strong>
              <p>{technician?.name ?? "Aguardando atribuição"}</p>
              <div>
                <PriorityBadge priority={order.priority} />
                <span className={isOverdue(order) ? "overdue-date" : ""}>
                  <CalendarDays size={13} />
                  {dateLabel(order.dueDate)}
                  {isOverdue(order) ? " · atrasada" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {!compact && (
        <div className="pagination">
          <span>
            {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, orders.length)} de {orders.length}{" "}
            ordens
          </span>
          <div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Página anterior"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span>
              {safePage} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próxima página"
              disabled={safePage === pageCount}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
