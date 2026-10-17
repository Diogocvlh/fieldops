import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Database,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Route,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
  X,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route as RouterRoute,
  Routes,
  useLocation,
} from "react-router-dom";
import { toast } from "sonner";
import { FieldOpsProvider, useFieldOps } from "./hooks/useFieldOps";
import { OrderDialogProvider, useOrderDialogs } from "./hooks/useOrderDialogs";
import { dataMode } from "./services/repository";
import { Button } from "./components/ui/button";
import { ConfirmDialog, FormError } from "./components/shared";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const Technicians = lazy(() => import("./pages/Technicians"));
const Distribution = lazy(() => import("./pages/Distribution"));
const Reports = lazy(() => import("./pages/Reports"));
const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/ordens", label: "Ordens de serviço", icon: ClipboardList },
  { to: "/tecnicos", label: "Técnicos", icon: UsersRound },
  { to: "/distribuicao", label: "Distribuição", icon: Route },
  { to: "/relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
];
function LoadingState() {
  return (
    <div className="loading-content" role="status" aria-live="polite">
      <span className="sr-only">Carregando a operação...</span>
      <div className="skeleton skeleton-title" />
      <div className="stats-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton skeleton-stat" />
        ))}
      </div>
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
function Shell() {
  const { snapshot, loading, error, refresh, execute } = useFieldOps();
  const { openEditor } = useOrderDialogs();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 800px)").matches,
  );
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const previousMenu = useRef(false);
  const location = useLocation();
  const current =
    navigation.find((item) => item.to === location.pathname)?.label ??
    "Página não encontrada";
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (mobile && menuOpen) closeMenuRef.current?.focus();
    else if (mobile && previousMenu.current) menuTriggerRef.current?.focus();
    previousMenu.current = menuOpen;
  }, [menuOpen, mobile]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          tabIndex={-1}
          aria-label="Fechar navegação"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        id="sidebar"
        inert={mobile && !menuOpen}
        aria-hidden={mobile && !menuOpen ? true : undefined}
        className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}
        onKeyDown={(event) => {
          if (mobile && menuOpen && event.key === "Tab") {
            const items = event.currentTarget.querySelectorAll<HTMLElement>(
              "a[href], button:not([disabled])",
            );
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <Link to="/" className="brand" aria-label="FieldOps, página inicial">
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="M9 6h20l-3 6H15l-2 5h11l-3 5H11l-2 5H3z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span>
            Field<span>Ops</span>
            <small>GESTÃO DE OPERAÇÕES</small>
          </span>
        </Link>
        <button
          ref={closeMenuRef}
          className="mobile-sidebar-close"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        >
          <X size={21} />
        </button>
        <div className="workspace-label">
          <span className="workspace-icon">
            <Database size={15} />
          </span>
          <div>
            <strong>Ambiente FieldOps</strong>
            <small>
              {dataMode === "demo"
                ? "Ambiente de demonstração"
                : "API Java configurada"}
            </small>
          </div>
          <ChevronRight size={14} />
        </div>
        <p className="nav-section-label">PRINCIPAL</p>
        <nav aria-label="Navegação principal">
          {navigation.map((item) => (
            <NavLink
              to={item.to}
              key={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.to === "/ordens" && (
                <span className="nav-counter">
                  {snapshot.orders.filter((o) => o.status === "OPEN").length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div>
              <ShieldCheck size={20} />
              <span>OPERAÇÃO EM MOVIMENTO</span>
            </div>
            <p>
              Mais clareza para planejar.
              <br />
              Mais tempo para executar.
            </p>
            <Link to="/distribuicao">
              Organizar atendimentos
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <button
            className="sidebar-utility"
            onClick={() => setHelpOpen(!helpOpen)}
            aria-expanded={helpOpen}
          >
            <CircleHelp size={17} />
            <span>Sobre este ambiente</span>
            <ChevronRight size={14} />
          </button>
          {helpOpen && (
            <div className="environment-help">
              {dataMode === "demo"
                ? "Dados fictícios salvos somente neste navegador. Você pode criar, editar e excluir registros. Use Restaurar demonstração para recomeçar."
                : "Os dados são fornecidos pela API Java configurada. A persistência depende do perfil ativo no servidor."}
            </div>
          )}
          {dataMode === "demo" && (
            <button
              className="sidebar-utility"
              onClick={() => setResetOpen(true)}
            >
              <RefreshCw size={16} />
              <span>Restaurar demonstração</span>
            </button>
          )}
          <div className="sidebar-footer">
            <span className="online-dot" />
            <span>
              {dataMode === "demo"
                ? "Armazenamento local"
                : "Integração com API REST"}
            </span>
            <small>v1.0</small>
          </div>
        </div>
      </aside>
      <div
        className="app-main"
        inert={mobile && menuOpen}
        aria-hidden={mobile && menuOpen ? true : undefined}
      >
        <header className="topbar">
          <div className="topbar-left">
            <Button
              ref={menuTriggerRef}
              variant="ghost"
              size="icon"
              className="menu-trigger"
              aria-label="Abrir menu de navegação"
              aria-expanded={menuOpen}
              aria-controls="sidebar"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </Button>
            <div className="breadcrumb">
              <span>Operação</span>
              <ChevronRight size={13} />
              <strong>{current}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <span className="header-date">
              <CalendarDays size={14} />
              {date}
            </span>
            <span className="topbar-separator" />
            <Button
              size="sm"
              onClick={() => openEditor()}
              disabled={loading || !!error}
            >
              <Plus size={16} />
              <span>Criar ordem</span>
            </Button>
          </div>
        </header>
        <div className="mode-banner">
          <span className="mode-pill">
            <span />
            {dataMode === "demo" ? "MODO DEMONSTRAÇÃO" : "API JAVA"}
          </span>
          <p>
            {dataMode === "demo"
              ? "Explore com liberdade. Dados fictícios salvos neste navegador."
              : "Dados fornecidos pela API configurada. O perfil do servidor define a persistência."}
          </p>
          <Database size={14} />
        </div>
        <main id="main-content" className="main-content">
          {error ? (
            <section className="panel error-state">
              <TriangleAlert size={35} />
              <h1>Não foi possível carregar a operação</h1>
              <FormError message={error} />
              <div>
                <Button onClick={() => void refresh()}>
                  <RefreshCw size={16} />
                  Tentar novamente
                </Button>
                {dataMode === "demo" && (
                  <Button variant="outline" onClick={() => setResetOpen(true)}>
                    Restaurar demonstração
                  </Button>
                )}
              </div>
            </section>
          ) : loading ? (
            <LoadingState />
          ) : (
            <Suspense fallback={<LoadingState />}>
              <Routes>
                <RouterRoute path="/" element={<Dashboard />} />
                <RouterRoute path="/ordens" element={<Orders />} />
                <RouterRoute path="/tecnicos" element={<Technicians />} />
                <RouterRoute path="/distribuicao" element={<Distribution />} />
                <RouterRoute path="/relatorios" element={<Reports />} />
                <RouterRoute path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          )}
          <footer className="content-footer">
            <span>
              FieldOps<span>·</span>Gestão de equipes e ordens de serviço
            </span>
            <span>
              {dataMode === "demo"
                ? "Demonstração com dados fictícios"
                : "Frontend integrado à API Java"}
            </span>
          </footer>
        </main>
      </div>
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Restaurar a demonstração?"
        description="Todas as alterações feitas neste navegador serão substituídas pelos técnicos e ordens fictícios iniciais."
        confirmLabel="Restaurar dados"
        onConfirm={async () => {
          await execute(async (repo) => {
            if (!repo.reset)
              throw new Error(
                "Restauração disponível somente no modo demonstração.",
              );
            return repo.reset();
          });
          toast.success("Demonstração restaurada.");
        }}
      />
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <FieldOpsProvider>
        <OrderDialogProvider>
          <Shell />
        </OrderDialogProvider>
      </FieldOpsProvider>
    </BrowserRouter>
  );
}
