import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleDashed,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { useFieldOps } from "../hooks/useFieldOps";
import { dateLabel } from "../utils/dates";
import { workload, isOverdue } from "../utils/metrics";
import { errorMessage } from "../services/validation";
import {
  Avatar,
  EmptyState,
  FormError,
  PageIntro,
  PriorityBadge,
  SearchField,
} from "../components/shared";
import { Button } from "../components/ui/button";
export default function Distribution() {
  const { snapshot, execute } = useFieldOps();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const orders = snapshot.orders
    .filter(
      (o) =>
        o.status === "OPEN" &&
        `${o.code} ${o.title}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const order = snapshot.orders.find(
    (o) => o.id === selectedOrder && o.status === "OPEN",
  );
  const technician = snapshot.technicians.find((t) => t.id === selectedTech);
  async function assign() {
    if (!order || !technician) return;
    setPending(true);
    setError("");
    try {
      await execute((repo) => repo.assignOrder(order.id, technician.id));
      toast.success(`${order.code} atribuída a ${technician.name}.`);
      setSelectedOrder(null);
      setSelectedTech(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="PLANEJAMENTO DA OPERAÇÃO"
        title="A pessoa certa. A ordem certa."
        description="Distribua atendimentos considerando disponibilidade e carga de trabalho."
      />
      <div className="distribution-steps">
        <div className={order ? "step-complete" : "step-current"}>
          <span>{order ? <Check size={16} /> : "1"}</span>
          <p>
            <strong>Selecione uma ordem</strong>
            <small>Atendimentos aguardando atribuição</small>
          </p>
        </div>
        <ArrowRight size={18} />
        <div
          className={technician ? "step-complete" : order ? "step-current" : ""}
        >
          <span>{technician ? <Check size={16} /> : "2"}</span>
          <p>
            <strong>Escolha um técnico</strong>
            <small>Confira a capacidade disponível</small>
          </p>
        </div>
        <ArrowRight size={18} />
        <div>
          <span>3</span>
          <p>
            <strong>Confirme a distribuição</strong>
            <small>A atribuição será registrada</small>
          </p>
        </div>
      </div>
      <div className="distribution-grid">
        <section className="panel distribution-orders">
          <div className="panel-heading">
            <div>
              <h2>
                Fila de atendimento
                <span className="count-chip">
                  {snapshot.orders.filter((o) => o.status === "OPEN").length}
                </span>
              </h2>
              <p>Ordens abertas, ordenadas pelo prazo</p>
            </div>
            <CircleDashed size={20} className="muted" />
          </div>
          <div className="distribution-search">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Encontrar uma ordem..."
            />
          </div>
          <div className="assignment-order-list">
            {orders.map((item) => (
              <button
                key={item.id}
                className={`assignment-order ${order?.id === item.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedOrder(item.id);
                  setError("");
                }}
              >
                <div>
                  <span className="order-code">{item.code}</span>
                  <span
                    className={`selection-circle ${order?.id === item.id ? "checked" : ""}`}
                  >
                    {order?.id === item.id && <Check size={13} />}
                  </span>
                </div>
                <strong>{item.title}</strong>
                <div>
                  <PriorityBadge priority={item.priority} />
                  <span className={isOverdue(item) ? "overdue-date" : "muted"}>
                    <CalendarDays size={13} />
                    {dateLabel(item.dueDate)}
                    {isOverdue(item) && " · atrasada"}
                  </span>
                </div>
              </button>
            ))}
            {!orders.length && (
              <EmptyState
                title="Fila organizada"
                description={
                  search
                    ? "Nenhuma ordem corresponde à pesquisa."
                    : "Todas as ordens abertas já foram distribuídas."
                }
                icon={ShieldCheck}
              />
            )}
          </div>
        </section>
        <section className="panel distribution-team">
          <div className="panel-heading">
            <div>
              <h2>Equipe técnica</h2>
              <p>Capacidade de ordens atribuídas e em andamento</p>
            </div>
            <UsersRound size={20} className="muted" />
          </div>
          <div className="assignment-tech-list">
            {snapshot.technicians.map((tech, index) => {
              const load = workload(snapshot.orders, tech.id);
              const blocked = !tech.available || load >= tech.capacity;
              return (
                <button
                  key={tech.id}
                  disabled={blocked}
                  className={`assignment-tech ${selectedTech === tech.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedTech(tech.id);
                    setError("");
                  }}
                >
                  <Avatar name={tech.name} index={index} />
                  <div className="assignment-tech-main">
                    <strong>{tech.name}</strong>
                    <span>{tech.specialty}</span>
                    <small>
                      <MapPin size={11} />
                      {tech.region}
                    </small>
                  </div>
                  <div className="assignment-tech-load">
                    <strong>
                      {load}
                      <span>/{tech.capacity}</span>
                    </strong>
                    <small className={blocked ? "blocked-label" : ""}>
                      {!tech.available
                        ? "Indisponível"
                        : load >= tech.capacity
                          ? "Sem capacidade"
                          : `${tech.capacity - load} vagas`}
                    </small>
                    <div className="load-track">
                      <span
                        style={{
                          width: `${Math.min(100, (load / tech.capacity) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className={`selection-circle ${selectedTech === tech.id ? "checked" : ""}`}
                  >
                    {selectedTech === tech.id && <Check size={13} />}
                  </span>
                </button>
              );
            })}
            {!snapshot.technicians.length && (
              <EmptyState
                icon={UsersRound}
                title="Cadastre sua equipe"
                description="Adicione um técnico na página Técnicos para começar a distribuir ordens."
              />
            )}
          </div>
          <div className="assignment-rule">
            <ShieldCheck size={16} />
            <p>
              Técnicos indisponíveis ou com capacidade esgotada não recebem
              novas ordens.
            </p>
          </div>
        </section>
      </div>
      <section className="assignment-confirm">
        {error && <FormError message={error} />}
        <div>
          <div className="assignment-summary">
            <span className="assignment-summary-icon">
              <ArrowRight size={20} />
            </span>
            <div>
              <strong>
                {order ? order.code : "Selecione uma ordem"}
                <span>→</span>
                {technician ? technician.name : "Selecione um técnico"}
              </strong>
              <p>
                {order && technician
                  ? "Confira os dados e confirme a atribuição."
                  : "Selecione uma ordem da fila e um técnico disponível."}
              </p>
            </div>
          </div>
          <Button
            disabled={
              !order ||
              !technician ||
              pending ||
              !technician.available ||
              workload(snapshot.orders, technician.id) >= technician.capacity
            }
            onClick={() => void assign()}
          >
            {pending ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Check size={17} />
            )}
            Confirmar atribuição
          </Button>
        </div>
      </section>
    </>
  );
}
