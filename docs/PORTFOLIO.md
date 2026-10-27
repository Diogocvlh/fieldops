# Apresentação técnica

[Repositório](https://github.com/Diogocvlh/fieldops) · [Visão geral e execução](../README.md) · [Arquitetura](ARCHITECTURE.md) · [Integração contínua](https://github.com/Diogocvlh/fieldops/actions/workflows/ci.yml)

## Descrição curta do repositório

FieldOps: gerenciamento de ordens de serviço e equipes técnicas com React, TypeScript e Spring Boot. Demonstração localStorage, API REST, regras de atribuição e suporte a PostgreSQL via JDBC.

## Texto curto para publicação

O FieldOps organiza ordens de serviço, técnicos e distribuição de trabalho em cinco páginas. O monorepo combina React e TypeScript com uma API Java 21/Spring Boot, incluindo validação, controle de capacidade, histórico de atividades e relatórios calculados a partir dos registros.

Há três formas de execução: demonstração no navegador, API com H2 em memória e API com PostgreSQL. A configuração PostgreSQL mantém credenciais no backend e utiliza migrações Flyway no schema `fieldops`. O MVP ainda não inclui autenticação e se destina à demonstração e ao desenvolvimento local.

## O que o projeto demonstra

| Decisão | Aplicação no FieldOps | Evidência |
| --- | --- | --- |
| Separar interface e persistência | Adaptadores localStorage e HTTP selecionados por configuração | [Serviços do frontend](../frontend/src/services/) |
| Centralizar regras de negócio | Disponibilidade, capacidade, transições de status e atividades em serviços Java | [Serviços do backend](../backend/src/main/java/com/fieldops/service/) |
| Manter um contrato explícito | Campos, estados, erros e regras documentados para integrar React e Java | [Contrato de integração](../CONTRACT.md) |
| Versionar a estrutura de dados | Migração inicial e profiles independentes para H2 e PostgreSQL | [Migrações Flyway](../backend/src/main/resources/db/migration/) |
| Verificar mudanças automaticamente | Jobs de frontend e backend, com PostgreSQL temporário para testar migrações | [Workflow CI](../.github/workflows/ci.yml) |

## Pontos para demonstrar

- Criar uma OS e mostrar que dashboard, tabela e relatórios refletem o mesmo registro.
- Atribuir uma ordem, observar a carga do técnico e reproduzir um bloqueio por indisponibilidade ou capacidade.
- Concluir uma OS e conferir a data de conclusão e a atividade correspondente.
- Explicar a diferença entre recorte por data de abertura e produtividade por data de conclusão.
- Mostrar a seleção de adaptadores de dados e o contrato HTTP compartilhado.
- Apresentar migrações, configuração de ambiente e comandos de verificação.

## Materiais para acompanhar a publicação

- [README](../README.md) com instruções de execução para Windows, Linux e macOS.
- [Diagrama de arquitetura](ARCHITECTURE.md) e [contrato da API](API.md).
- Capturas com dados fictícios: [dashboard](assets/dashboard-desktop.jpg), [ordens no desktop](assets/ordens-desktop.jpg) e [ordens no celular](assets/ordens-mobile.jpg).
- [Resultados da verificação local](VALIDATION.md): 14 testes de backend, 20 testes de frontend, build e roteiro HTTP.

## Evolução proposta

Autenticação, permissões por função, paginação no servidor, ampliação dos testes PostgreSQL, controle de versões para edições concorrentes e observabilidade.
