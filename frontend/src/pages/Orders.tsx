import { useMemo, useState } from "react";
import { Filter, Plus, RotateCcw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useFieldOps } from "../hooks/useFieldOps";
import { useOrderDialogs } from "../hooks/useOrderDialogs";
import { PRIORITIES, STATUSES, priorityLabels, statusLabels } from "../types";
import { filterOrders } from "../utils/metrics";
import { downloadCsv } from "../utils/csv";
import { ExportButton, PageIntro, SearchField } from "../components/shared";
import { Button } from "../components/ui/button";
import { OrderTable } from "../components/OrderTable";
export default function Orders() {
  const { snapshot } = useFieldOps();
  const { openEditor } = useOrderDialogs();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [priority, setPriority] = useState("");
  const [technicianId, setTechnicianId] = useState(
    params.get("technicianId") ?? "",
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [overdue, setOverdue] = useState(false);
  const orders = useMemo(
    () =>
      filterOrders(snapshot, {
        search,
        status,
        priority,
        technicianId,
        from,
        to,
        overdue,
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [snapshot, search, status, priority, technicianId, from, to, overdue],
  );
  const hasFilters = !!(
    search ||
    status ||
    priority ||
    technicianId ||
    from ||
    to ||
    overdue
  );
  function reset() {
    setSearch("");
    setStatus("");
    setPriority("");
    setTechnicianId("");
    setFrom("");
    setTo("");
    setOverdue(false);
    setParams({});
  }
  return (
    <>
      <PageIntro
        eyebrow="GESTÃO DE ATENDIMENTOS"
        title="Ordens de serviço"
        description="Do primeiro chamado à conclusão, acompanhe cada etapa."
      >
        <ExportButton
          disabled={!orders.length}
          onClick={() => downloadCsv(orders, snapshot)}
        />
        <Button onClick={() => openEditor()}>
          <Plus size={17} />
          Nova ordem
        </Button>
      </PageIntro>
      <div className="orders-overview">
        <div>
          <span className="overview-dot dot-cyan" />
          <strong>{snapshot.orders.length}</strong>
          <span>ordens no total</span>
        </div>
        <div>
          <span className="overview-dot dot-green" />
          <strong>
            {snapshot.orders.filter((o) => o.status === "COMPLETED").length}
          </strong>
          <span>concluídas</span>
        </div>
        <div>
          <span className="overview-dot dot-blue" />
          <strong>
            {
              snapshot.orders.filter(
                (o) => o.status === "ASSIGNED" || o.status === "IN_PROGRESS",
              ).length
            }
          </strong>
          <span>em operação</span>
        </div>
      </div>
      <section className="panel orders-panel">
        <div className="table-toolbar">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Pesquisar código, título ou técnico..."
          />
          <div className="toolbar-controls">
            <select
              aria-label="Filtrar por status"
              className="input filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por prioridade"
              className="input filter-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">Prioridades</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {priorityLabels[p]}
                </option>
              ))}
            </select>
            <Button
              variant={advanced ? "default" : "outline"}
              onClick={() => setAdvanced(!advanced)}
              aria-expanded={advanced}
            >
              <Filter size={15} />
              Filtros
            </Button>
          </div>
        </div>
        {advanced && (
          <div className="advanced-filters">
            <div className="form-field">
              <label htmlFor="filter-tech">Técnico</label>
              <select
                id="filter-tech"
                className="input"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
              >
                <option value="">Todos os técnicos</option>
                <option value="unassigned">Sem técnico</option>
                {snapshot.technicians.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="filter-from">Abertura a partir de</label>
              <input
                id="filter-from"
                className="input"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="filter-to">Abertura até</label>
              <input
                id="filter-to"
                className="input"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={overdue}
                onChange={(e) => setOverdue(e.target.checked)}
              />
              Somente atrasadas
            </label>
          </div>
        )}
        {hasFilters && (
          <div className="filter-summary">
            <span>
              {orders.length}{" "}
              {orders.length === 1 ? "ordem encontrada" : "ordens encontradas"}
              {from && to && from > to ? " · período inválido" : ""}
            </span>
            <button onClick={reset}>
              <RotateCcw size={13} />
              Limpar filtros
            </button>
          </div>
        )}
        <OrderTable orders={orders} />
      </section>
    </>
  );
}
