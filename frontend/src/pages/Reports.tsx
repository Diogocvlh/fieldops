import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCheck,
  Clock3,
  FileText,
  Filter,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { useFieldOps } from "../hooks/useFieldOps";
import { STATUSES, statusLabels } from "../types";
import { daysFromToday, localDate } from "../utils/dates";
import { filterOrders, isActive, metrics } from "../utils/metrics";
import { downloadCsv } from "../utils/csv";
import {
  Avatar,
  EmptyState,
  ExportButton,
  FormError,
  PageIntro,
  StatCard,
} from "../components/shared";
import { Button } from "../components/ui/button";
import { StatusChart, TechnicianChart } from "../components/Charts";
export default function Reports() {
  const { snapshot } = useFieldOps();
  const [from, setFrom] = useState(daysFromToday(-29));
  const [to, setTo] = useState(localDate());
  const [status, setStatus] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const invalid = !from || !to || from > to;
  const orders = useMemo(
    () =>
      invalid ? [] : filterOrders(snapshot, { from, to, status, technicianId }),
    [snapshot, from, to, status, technicianId, invalid],
  );
  const stats = metrics(orders);
  const rate = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;
  const technicians = snapshot.technicians
    .filter((t) => !technicianId || t.id === technicianId)
    .map((tech) => {
      const attributed = orders.filter((o) => o.technicianId === tech.id);
      return {
        ...tech,
        total: attributed.length,
        completed: attributed.filter((o) => o.status === "COMPLETED").length,
        active: attributed.filter(isActive).length,
        overdue: metrics(attributed).overdue,
      };
    });
  return (
    <>
      <PageIntro
        eyebrow="DADOS QUE ORIENTAM DECISÕES"
        title="Relatórios da operação"
        description="Transforme os registros de atendimento em uma visão clara dos resultados."
      >
        <ExportButton
          disabled={!orders.length || invalid}
          onClick={() =>
            downloadCsv(
              orders,
              snapshot,
              `fieldops-relatorio-${from}-${to}.csv`,
            )
          }
        />
      </PageIntro>
      <section className="panel reports-filters">
        <div className="reports-filter-label">
          <Filter size={17} />
          <strong>Filtrar resultados</strong>
        </div>
        <div className="report-filter-grid">
          <div className="form-field">
            <label htmlFor="report-from">Data inicial</label>
            <input
              id="report-from"
              className="input"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="report-to">Data final</label>
            <input
              id="report-to"
              className="input"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="report-status">Status</label>
            <select
              id="report-status"
              className="input"
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
          </div>
          <div className="form-field">
            <label htmlFor="report-tech">Técnico</label>
            <select
              id="report-tech"
              className="input"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
            >
              <option value="">Toda a equipe</option>
              {snapshot.technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Restaurar filtros de relatórios"
            onClick={() => {
              setFrom(daysFromToday(-29));
              setTo(localDate());
              setStatus("");
              setTechnicianId("");
            }}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
        <p className="report-criteria">
          <FileText size={13} />O período considera a data de abertura das
          ordens, incluindo os dias inicial e final.
        </p>
        {invalid && (
          <FormError message="Selecione um período válido: a data inicial deve ser igual ou anterior à data final." />
        )}
      </section>
      <div className="stats-grid">
        <StatCard
          label="Ordens no período"
          value={stats.total}
          note="Conforme os filtros selecionados"
          icon={FileText}
          tone="blue"
        />
        <StatCard
          label="Taxa de conclusão"
          value={`${rate}%`}
          note={`${stats.completed} ordens concluídas`}
          icon={CheckCheck}
          tone="green"
        />
        <StatCard
          label="Em operação"
          value={stats.assigned + stats.progress}
          note="Atribuídas e em andamento"
          icon={Clock3}
          tone="cyan"
        />
        <StatCard
          label="Atrasadas"
          value={stats.overdue}
          note="Pendentes com prazo vencido"
          icon={TriangleAlert}
          tone="orange"
        />
      </div>
      {!orders.length ? (
        <section className="panel">
          <EmptyState
            icon={BarChart3}
            title="Sem registros neste período"
            description="Ajuste o período, o status ou o técnico para explorar outros resultados."
          />
        </section>
      ) : (
        <>
          <div className="reports-charts">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Resultado por profissional</h2>
                  <p>Concluídas e ativas dentro do recorte selecionado</p>
                </div>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="legend-cyan" />
                  Concluídas
                </span>
                <span>
                  <i className="legend-light" />
                  Ativas
                </span>
              </div>
              <TechnicianChart
                data={technicians.map((t) => ({
                  name: t.name.split(" ")[0],
                  concluidas: t.completed,
                  ativas: t.active,
                }))}
              />
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Composição dos atendimentos</h2>
                  <p>Ordens por status no período</p>
                </div>
              </div>
              <StatusChart orders={orders} />
            </section>
          </div>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Indicadores por técnico</h2>
                <p>Comparativo calculado a partir das ordens filtradas</p>
              </div>
            </div>
            <div className="report-technicians">
              {technicians.map((tech, i) => (
                <div className="report-technician" key={tech.id}>
                  <div className="person-cell">
                    <Avatar name={tech.name} index={i} small />
                    <span>
                      <strong>{tech.name}</strong>
                      <small>{tech.specialty}</small>
                    </span>
                  </div>
                  <div>
                    <small>Total</small>
                    <strong>{tech.total}</strong>
                  </div>
                  <div>
                    <small>Concluídas</small>
                    <strong className="text-green">{tech.completed}</strong>
                  </div>
                  <div>
                    <small>Ativas</small>
                    <strong>{tech.active}</strong>
                  </div>
                  <div>
                    <small>Atrasadas</small>
                    <strong className={tech.overdue ? "overdue-date" : ""}>
                      {tech.overdue}
                    </strong>
                  </div>
                  <div className="report-rate">
                    <small>Conclusão</small>
                    <span>
                      <strong>
                        {tech.total
                          ? Math.round((tech.completed / tech.total) * 100)
                          : 0}
                        %
                      </strong>
                      <i>
                        <b
                          style={{
                            width: `${tech.total ? (tech.completed / tech.total) * 100 : 0}%`,
                          }}
                        />
                      </i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
