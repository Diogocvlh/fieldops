# FieldOps — contrato de dados

Monorepo: `frontend/` (React, TypeScript, Vite, Tailwind e Recharts), `backend/` (Java 21, Spring Boot 4.1.1 e Maven) e `docs/`.
Este contrato define os dados e as regras compartilhadas pelos adaptadores de demonstração e HTTP. Não há autenticação nesta etapa.

## JSON
Enums status: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED. Prioridade: LOW, MEDIUM, HIGH, CRITICAL. UI sempre pt-BR.
Technician: id string UUID, name, registration, specialty, region (strings), available boolean, capacity integer 1..20.
WorkOrder: id string UUID, code string único imutável, title string 3..120, description string até 2000, technicianId string|null, priority, status, createdAt ISO datetime, updatedAt ISO datetime, dueDate YYYY-MM-DD, completedAt ISO datetime|null.
Activity: id string UUID, message string, createdAt ISO datetime, workOrderId string|null.
Snapshot: { technicians: Technician[], orders: WorkOrder[], activities: Activity[] }.
Erros HTTP: { title, detail, status, fieldErrors?: Record<string,string> }.
WorkOrderInput: { title, description, technicianId, priority, status, dueDate }. TechnicianInput: campos de Technician sem id.

## HTTP
Base /api/v1. GET /snapshot retorna Snapshot. GET /health retorna {status:"ok",mode:"demo"|"postgres"}.
GET /technicians; POST /technicians; PUT /technicians/{id}; DELETE /technicians/{id}.
GET /work-orders; POST /work-orders; PUT /work-orders/{id}; DELETE /work-orders/{id}.
POST /work-orders/{id}/assign body {technicianId:string}. Resposta WorkOrder.
GET /activities. GET /reports?from=YYYY-MM-DD&to=YYYY-MM-DD&status=...&technicianId=... (retorno documentado em `docs/API.md`).
POST/PUT retornam entidade; DELETE 204. GET coleções retornam arrays.
Frontend mantém demonstração localStorage por padrão; modo API opcional VITE_DATA_MODE=api, VITE_API_URL=http://localhost:8080/api/v1. Não fazer fallback silencioso de API para demo.

## Regras idênticas nos dois adapters
OPEN não tem técnico; ASSIGNED/IN_PROGRESS exigem técnico. Não atribuir técnico indisponível nem acima da capacidade (contar ASSIGNED/IN_PROGRESS). COMPLETED/CANCELLED podem manter técnico histórico; COMPLETED exige completedAt preenchido automaticamente. Reabrir limpa completedAt. Edição mantendo o mesmo técnico em ordem ativa é permitida se disponibilidade mudou; nova atribuição bloqueada. Alterar terminal para ativa deve verificar capacidade e disponibilidade mesmo mantendo técnico. Deletar técnico com OS vinculada deve falhar com conflito; UI explica desvincular/reorganizar primeiro. Matrícula única sem distinção de maiúsculas. Validação de datas reais e prazo >= data de abertura local. Atrasada = dueDate anterior à data local e status não terminal. Relatórios filtram pelo dia de createdAt e explicitam esse critério; produtividade usa completedAt. Mutação e activity atômicas.

Sem conexão Supabase simulada. Profile demo Java usa H2 local em memória, claramente documentado; profile postgres usa variáveis DB_URL (jdbc SSL), DB_USERNAME, DB_PASSWORD, credenciais nunca no frontend. Migrações Flyway compatíveis H2 PostgreSQL mode/PostgreSQL; dados fictícios seed apenas demo. Backend sem autenticação nesta etapa: uso local, não pronto para exposição pública. README informa isso de modo breve.
