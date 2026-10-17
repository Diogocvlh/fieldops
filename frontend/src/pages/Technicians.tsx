import { useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CircleCheck,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useFieldOps } from "../hooks/useFieldOps";
import type { Technician } from "../types";
import { workload } from "../utils/metrics";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  PageIntro,
  SearchField,
  StatCard,
} from "../components/shared";
import { Button } from "../components/ui/button";
import { TechnicianEditor } from "../components/TechnicianEditor";
export default function Technicians() {
  const { snapshot, execute } = useFieldOps();
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("");
  const [editor, setEditor] = useState<{ technician?: Technician } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<Technician | null>(null);
  const available = snapshot.technicians.filter((t) => t.available).length;
  const list = snapshot.technicians.filter(
    (t) =>
      `${t.name} ${t.registration} ${t.specialty} ${t.region}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (!availability || t.available === (availability === "available")),
  );
  const activeOrders = snapshot.orders.filter(
    (o) => o.status === "ASSIGNED" || o.status === "IN_PROGRESS",
  ).length;
  return (
    <>
      <PageIntro
        eyebrow="PESSOAS QUE MOVEM A OPERAÇÃO"
        title="Equipe técnica"
        description="Conheça a disponibilidade e a capacidade de cada profissional."
      >
        <Button onClick={() => setEditor({})}>
          <Plus size={17} />
          Adicionar técnico
        </Button>
      </PageIntro>
      <div className="stats-grid stats-grid-three">
        <StatCard
          label="Profissionais na equipe"
          value={snapshot.technicians.length}
          note="Técnicos cadastrados"
          icon={UsersRound}
          tone="blue"
        />
        <StatCard
          label="Disponíveis"
          value={available}
          note="Habilitados para novas atribuições"
          icon={CircleCheck}
          tone="green"
        />
        <StatCard
          label="Ordens ativas"
          value={activeOrders}
          note="Atribuídas ou em andamento"
          icon={BriefcaseBusiness}
          tone="cyan"
        />
      </div>
      <div className="team-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar nome, especialidade ou região..."
        />
        <select
          aria-label="Filtrar disponibilidade"
          className="input filter-select"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        >
          <option value="">Toda a equipe</option>
          <option value="available">Disponíveis</option>
          <option value="unavailable">Indisponíveis</option>
        </select>
      </div>
      {list.length ? (
        <div className="technician-grid">
          {list.map((tech) => {
            const load = workload(snapshot.orders, tech.id);
            const total = snapshot.orders.filter(
              (o) => o.technicianId === tech.id,
            ).length;
            const index = snapshot.technicians.indexOf(tech);
            return (
              <article className="technician-card" key={tech.id}>
                <div className="technician-card-top">
                  <Avatar name={tech.name} index={index} />
                  <span
                    className={`availability-badge ${tech.available ? "available" : "unavailable"}`}
                  >
                    <i />
                    {tech.available ? "Disponível" : "Indisponível"}
                  </span>
                </div>
                <h2>{tech.name}</h2>
                <p className="technician-registration">
                  {tech.registration}
                  <span>·</span>
                  {tech.specialty}
                </p>
                <div className="technician-region">
                  <MapPin size={14} />
                  {tech.region}
                </div>
                <div className="load-summary">
                  <span>Carga de trabalho</span>
                  <strong>
                    {load}
                    <small> / {tech.capacity} OS</small>
                  </strong>
                </div>
                <div className="load-track">
                  <span
                    style={{
                      width: `${Math.min(100, (load / tech.capacity) * 100)}%`,
                      background: load >= tech.capacity ? "#ed8f51" : undefined,
                    }}
                  />
                </div>
                <p className="load-hint">
                  {load >= tech.capacity
                    ? "Capacidade máxima atingida"
                    : `${tech.capacity - load} vagas para novas ordens`}
                </p>
                <div className="technician-card-footer">
                  <Link to={`/ordens?technicianId=${tech.id}`}>
                    {total}{" "}
                    {total === 1 ? "ordem vinculada" : "ordens vinculadas"}
                    <ArrowUpRight size={14} />
                  </Link>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${tech.name}`}
                      onClick={() => setEditor({ technician: tech })}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${tech.name}`}
                      onClick={() => setDeleting(tech)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <EmptyState
            icon={UsersRound}
            title="Nenhum técnico encontrado"
            description="Ajuste a pesquisa ou adicione um profissional à equipe."
            action={
              <Button onClick={() => setEditor({})}>
                <Plus size={16} />
                Adicionar técnico
              </Button>
            }
          />
        </section>
      )}
      <TechnicianEditor
        open={!!editor}
        technician={editor?.technician}
        onClose={() => setEditor(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Excluir ${deleting?.name ?? "técnico"}?`}
        description="Técnicos com ordens vinculadas não podem ser excluídos. Reorganize os vínculos antes de remover o cadastro."
        onConfirm={async () => {
          if (deleting) {
            await execute((repo) => repo.deleteTechnician(deleting.id));
            toast.success("Técnico removido da equipe.");
          }
        }}
      />
    </>
  );
}
