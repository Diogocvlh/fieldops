import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  CircleDashed,
  Clock3,
  Layers3,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFieldOps } from "../hooks/useFieldOps";
import { useOrderDialogs } from "../hooks/useOrderDialogs";
import { metrics, workload } from "../utils/metrics";
import { relativeTime } from "../utils/dates";
import { Avatar, PageIntro, StatCard } from "../components/shared";
import { Button } from "../components/ui/button";
import { OrderTable } from "../components/OrderTable";
import { ProductivityChart, StatusChart } from "../components/Charts";
export default function Dashboard() {
  const { snapshot } = useFieldOps();
  const { showOrder } = useOrderDialogs();
  const stats = metrics(snapshot.orders);
  const available = snapshot.technicians.filter(
    (t) => t.available && workload(snapshot.orders, t.id) < t.capacity,
  ).length;
  const completion = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;
  const recent = [...snapshot.orders].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return (
    <>
      <PageIntro
        eyebrow="VISÃO GERAL"
        title="Sua operação, sob controle."
        description="Acompanhe os atendimentos e mantenha a equipe em movimento."
      >
        <Button asChild variant="outline">
          <Link to="/relatorios">
            <CalendarDays size={16} />
            Ver relatórios
            <ArrowUpRight size={15} />
          </Link>
        </Button>
      </PageIntro>
      <div className="stats-grid">
        <StatCard
          label="Ordens abertas"
          value={stats.open}
          note="Aguardando distribuição"
          icon={CircleDashed}
          tone="cyan"
        >
          <span className="stat-mini cyan">{stats.assigned} atribuídas</span>
        </StatCard>
        <StatCard
          label="Em andamento"
          value={stats.progress}
          note="Atendimentos em execução"
          icon={Clock3}
          tone="blue"
        />
        <StatCard
          label="Concluídas"
          value={stats.completed}
          note="de todas as ordens"
          icon={CheckCheck}
          tone="green"
        >
          <span className="stat-mini green">{completion}%</span>
        </StatCard>
        <StatCard
          label="Ordens atrasadas"
          value={stats.overdue}
          note="Precisam da sua atenção"
          icon={TriangleAlert}
          tone="orange"
        />
      </div>
      <div className="dashboard-charts">
        <section className="panel productivity-panel">
          <div className="panel-heading">
            <div>
              <h2>Produtividade da operação</h2>
              <p>Ordens abertas e concluídas por dia</p>
            </div>
            <span className="period-pill">Últimos 7 dias</span>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-cyan" />
              Concluídas
            </span>
            <span>
              <i className="legend-slate" />
              Abertas
            </span>
          </div>
          <ProductivityChart orders={snapshot.orders} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Distribuição por status</h2>
              <p>Panorama de todos os atendimentos</p>
            </div>
            <Layers3 size={17} className="muted" />
          </div>
          <StatusChart orders={snapshot.orders} />
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Ordens recentes</h2>
              <p>Últimos atendimentos atualizados</p>
            </div>
            <Link className="text-link" to="/ordens">
              Ver todas
              <ArrowRight size={15} />
            </Link>
          </div>
          <OrderTable orders={recent} compact />
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Últimas atividades</h2>
              <p>O que está acontecendo na operação</p>
            </div>
            <span className="activity-live" />
          </div>
          <div className="activity-list">
            {snapshot.activities.slice(0, 4).map((activity, index) => {
              const order = snapshot.orders.find(
                (o) => o.id === activity.workOrderId,
              );
              return (
                <div className="activity-item" key={activity.id}>
                  <span
                    className={`activity-symbol activity-symbol-${index % 3}`}
                  >
                    {index % 3 === 0 ? (
                      <CheckCheck size={15} />
                    ) : index % 3 === 1 ? (
                      <Clock3 size={15} />
                    ) : (
                      <CircleDashed size={15} />
                    )}
                  </span>
                  <div>
                    {order ? (
                      <button onClick={() => showOrder(order)}>
                        {activity.message}
                      </button>
                    ) : (
                      <p>{activity.message}</p>
                    )}
                    <small>{relativeTime(activity.createdAt)}</small>
                  </div>
                </div>
              );
            })}
            {!snapshot.activities.length && (
              <p className="activity-empty">
                As próximas alterações aparecerão aqui.
              </p>
            )}
          </div>
          <div className="team-summary">
            <div className="team-summary-top">
              <div className="avatar-stack">
                {snapshot.technicians.slice(0, 4).map((t, i) => (
                  <Avatar key={t.id} name={t.name} index={i} small />
                ))}
              </div>
              <span>
                <b>{available}</b> técnicos disponíveis
              </span>
            </div>
            <Link to="/distribuicao">
              Organizar a equipe
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
