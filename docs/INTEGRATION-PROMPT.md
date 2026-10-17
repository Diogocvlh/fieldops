# Integração da interface existente

O texto abaixo serve para adaptar uma interface já existente ao contrato da API deste repositório. A aplicação incluída em `frontend/` já possui os dois adaptadores.

```text
Evolua o FieldOps preservando suas cinco páginas, identidade visual e funcionalidades atuais.

Arquitetura final:
- Interface em React e TypeScript.
- API REST externa em Java com Spring Boot.
- PostgreSQL no Supabase, acessado exclusivamente pela API Java.

Implemente uma interface FieldOpsRepository com operações de leitura de snapshot, CRUD de ordens e técnicos e atribuição de técnico. Mantenha duas implementações: LocalStorageRepository e HttpRepository. Os componentes acessam apenas essa interface.

Configuração:
- VITE_DATA_MODE=demo por padrão: dados fictícios persistidos em localStorage, com aviso permanente “Modo demonstração”.
- VITE_DATA_MODE=api: utilizar somente a API real.
- VITE_API_URL=http://localhost:8080/api/v1 para desenvolvimento local; endereço HTTPS da API para uma publicação.
- Não criar conexão fictícia com banco nem retornar sucesso se uma chamada falhar. Em modo API, apresentar erro de rede com opção de tentar novamente, sem trocar para demonstração silenciosamente.
- Nunca incluir senha de banco, chave secreta ou service_role no frontend.

Contrato HTTP:
GET /snapshot → {technicians:[], orders:[], activities:[]}
GET /health → {status:"ok",mode:"demo"|"postgres"}
GET /technicians
POST /technicians → 201
PUT /technicians/{id}
DELETE /technicians/{id} → 204
GET /work-orders
POST /work-orders → 201
PUT /work-orders/{id}
DELETE /work-orders/{id} → 204
POST /work-orders/{id}/assign com {technicianId:string}
GET /activities

Technician: {id,name,registration,specialty,region,available,capacity}.
WorkOrder: {id,code,title,description,technicianId,priority,status,createdAt,updatedAt,dueDate,completedAt}.
Activity: {id,message,createdAt,workOrderId}.
Datas: timestamps ISO 8601; dueDate em YYYY-MM-DD. id/code/createdAt/updatedAt/completedAt são gerados pela API.
Status: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED.
Prioridades: LOW, MEDIUM, HIGH, CRITICAL.
Traduzir todos os rótulos da interface para português brasileiro.
POST/PUT de ordem enviam apenas title, description, technicianId, priority, status, dueDate.
POST/PUT de técnico enviam apenas name, registration, specialty, region, available, capacity.

Regras:
- Aberta não possui técnico; Atribuída e Em andamento exigem técnico.
- Bloquear nova atribuição para técnico indisponível ou cuja capacidade ativa foi atingida.
- Ordens concluídas recebem completedAt na API; reabrir limpa essa data.
- Bloquear exclusão de técnico com ordens vinculadas e explicar como reorganizar os registros.
- Tratar erros HTTP com {title,detail,status,fieldErrors?}, exibir detail em português e manter o formulário preenchido.
- Recarregar o snapshot depois de cada mutação para atualizar indicadores, relatórios e atividades.
- Relatórios filtram a data de abertura; produtividade considera a data de conclusão. Informar esses critérios.

Melhore a experiência mobile com cards de ordens e técnicos em telas pequenas. Evite esconder ações em tabelas largas. Use estados vazios, botões com carregamento e confirmação de exclusão.

Na apresentação do produto e README, usar a marca FieldOps, suas funcionalidades e tecnologias. Não incluir marcas de plataformas de criação nem afirmações inventadas sobre autoria, clientes ou uso em produção.
```

Para conectar uma interface hospedada, a API precisa de endereço HTTPS acessível, autenticação/autorização implementadas e CORS limitado à origem da interface. O backend entregue nesta etapa é para execução local sem login.
