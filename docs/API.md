# API do FieldOps

Base local: `http://localhost:8080/api/v1`. Requisições e respostas utilizam JSON. A API não exige autenticação nesta etapa e se destina à execução local.

## Endpoints

| Método | Caminho | Resposta de sucesso |
| --- | --- | --- |
| GET | `/health` | `{ "status": "ok", "mode": "demo" ou "postgres" }` |
| GET | `/snapshot` | `{ technicians, orders, activities }` |
| GET | `/technicians` | Array de técnicos |
| POST | `/technicians` | Técnico criado |
| PUT | `/technicians/{id}` | Técnico atualizado |
| DELETE | `/technicians/{id}` | HTTP 204, sem corpo |
| GET | `/work-orders` | Array de ordens |
| POST | `/work-orders` | Ordem criada |
| PUT | `/work-orders/{id}` | Ordem atualizada |
| DELETE | `/work-orders/{id}` | HTTP 204, sem corpo |
| POST | `/work-orders/{id}/assign` | Ordem atualizada |
| GET | `/activities` | Array de atividades |
| GET | `/reports` | Relatório calculado com os filtros informados |

GET, PUT e atribuição retornam HTTP 200; POST de cadastro retorna HTTP 201; DELETE retorna HTTP 204. Coleções retornam arrays sem paginação nesta etapa. Para detalhamento, a interface pode selecionar um registro do snapshot ou da coleção. Identificadores nos caminhos são UUIDs.

## Modelos

### Técnico

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | string UUID | Gerado pelo serviço |
| `name` | string | Nome fictício na demonstração |
| `registration` | string | Matrícula única sem distinção de caixa |
| `specialty` | string | Especialidade |
| `region` | string | Região de atendimento |
| `available` | boolean | Disponibilidade para novas atribuições |
| `capacity` | integer | Entre 1 e 20 ordens ativas |

POST e PUT recebem todos os campos, exceto `id`:

```json
{
  "name": "Marina Costa",
  "registration": "TEC-120",
  "specialty": "Elétrica",
  "region": "Zona Norte",
  "available": true,
  "capacity": 5
}
```

Reduzir a capacidade para menos que a quantidade de ordens ativas é um conflito. Excluir um técnico com qualquer ordem vinculada também falha; reorganize os vínculos antes da exclusão.

### Ordem de serviço

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | string UUID | Gerado pelo serviço |
| `code` | string | Único, gerado e imutável |
| `title` | string | De 3 a 120 caracteres |
| `description` | string | Até 2.000 caracteres |
| `technicianId` | string UUID ou null | Referência ao técnico |
| `priority` | enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | enum | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `createdAt` | ISO datetime | Gerado pelo serviço |
| `updatedAt` | ISO datetime | Atualizado pelo serviço |
| `dueDate` | `YYYY-MM-DD` | Prazo no calendário de negócio |
| `completedAt` | ISO datetime ou null | Preenchido ao concluir |

POST e PUT usam o mesmo modelo de entrada. Identidade e datas de auditoria não são campos editáveis:

```json
{
  "title": "Inspecionar quadro de distribuição",
  "description": "Verificar conexões e registrar a inspeção de rotina.",
  "technicianId": null,
  "priority": "HIGH",
  "status": "OPEN",
  "dueDate": "2030-11-20"
}
```

O prazo do exemplo é ilustrativo; use uma data real igual ou posterior ao dia de abertura. A interface apresenta os enums em português brasileiro:

| API | Interface |
| --- | --- |
| `OPEN` | Aberta |
| `ASSIGNED` | Atribuída |
| `IN_PROGRESS` | Em andamento |
| `COMPLETED` | Concluída |
| `CANCELLED` | Cancelada |
| `LOW` | Baixa |
| `MEDIUM` | Média |
| `HIGH` | Alta |
| `CRITICAL` | Crítica |

### Atividade e snapshot

Uma atividade possui `id`, `message`, `createdAt` e `workOrderId`, que pode ser `null`. O texto descreve uma operação realizada. As atividades são geradas pelos serviços, sem endpoint público para criação arbitrária.

```json
{
  "technicians": [],
  "orders": [],
  "activities": []
}
```

Esse é um snapshot vazio válido. A propriedade de ordens se chama `orders`, embora o recurso HTTP use `/work-orders`.

## Atribuição e transições

`POST /work-orders/{id}/assign` recebe:

```json
{
  "technicianId": "00000000-0000-4000-8000-000000000001"
}
```

O UUID acima é apenas um placeholder. Use o identificador de um técnico retornado pela API.

A atribuição coloca a ordem em `ASSIGNED`. Uma ordem concluída ou cancelada precisa ser reaberta antes de utilizar esse endpoint.

- Uma ordem `OPEN` não pode ter técnico. `ASSIGNED` e `IN_PROGRESS` exigem técnico.
- Novas atribuições validam disponibilidade e capacidade, contando somente ordens `ASSIGNED` ou `IN_PROGRESS`.
- Editar uma ordem ativa mantendo o técnico atual é permitido quando a disponibilidade dele mudou. Retornar de um status terminal para ativo exige nova validação.
- `COMPLETED` preenche `completedAt` automaticamente. Reabrir limpa essa data.
- `COMPLETED` e `CANCELLED` podem preservar o técnico como histórico.
- A alteração e sua atividade correspondente são persistidas em uma mesma transação no backend.

Uma ordem atrasada tem `dueDate` anterior ao dia atual e status não terminal. Atraso é um indicador derivado, não um sexto status.

## Relatórios

`GET /reports` aceita os parâmetros opcionais:

| Parâmetro | Formato | Critério |
| --- | --- | --- |
| `from` | `YYYY-MM-DD` | Primeiro dia, inclusivo |
| `to` | `YYYY-MM-DD` | Último dia, inclusivo |
| `status` | Enum de status | Status atual da ordem |
| `technicianId` | UUID | Técnico vinculado |

Exemplo: `/api/v1/reports?from=2030-11-01&to=2030-11-30&status=COMPLETED`.

Sem `to`, a data final é hoje; sem `from`, o início é 29 dias antes da data final, totalizando 30 dias inclusivos. O início não pode ser posterior ao fim e o intervalo admite até 3.661 dias.

```json
{
  "criteria": {
    "from": "2030-11-01",
    "to": "2030-11-30",
    "status": "COMPLETED",
    "technicianId": null,
    "dateBasis": "createdAt"
  },
  "totals": {
    "total": 0,
    "open": 0,
    "assigned": 0,
    "inProgress": 0,
    "completed": 0,
    "cancelled": 0,
    "overdue": 0,
    "completionRate": 0
  },
  "byStatus": [],
  "byTechnician": [],
  "productivity": []
}
```

O exemplo mostra a estrutura e não representa um conjunto de dados executado. `completionRate` é um percentual de 0 a 100. `byStatus` contém `{ status, total }`; `byTechnician`, `{ technicianId, name, assigned, inProgress, completed, total }`; e `productivity`, `{ date, completed }`.

Totais, status e técnicos filtram pelo dia de `createdAt`. A produtividade usa o dia de `completedAt`, dentro do período e com os demais filtros, sem exigir que a abertura também esteja no período. Os resultados desses dois critérios podem, portanto, ter totais diferentes. As datas usam `APP_TIME_ZONE` no backend.

## Erros

Erros seguem um formato consistente:

```json
{
  "title": "Dados inválidos",
  "detail": "Revise os campos informados.",
  "status": 400,
  "fieldErrors": {
    "title": "Informe um título válido."
  }
}
```

As mensagens acima são ilustrativas; o texto pode variar conforme a validação. `fieldErrors` é opcional.

| HTTP | Situação |
| --- | --- |
| 400 | Entrada ou filtro inválido |
| 404 | Recurso não encontrado |
| 409 | Conflito de regra, unicidade ou vínculo |
| 500 | Falha interna não prevista |

O cliente deve usar `detail` para explicar a falha e associar `fieldErrors` aos campos quando presentes. Em uma falha de rede, apresente a indisponibilidade da API e permita tentar novamente; não leia dados de demonstração como se viessem do servidor.
