# Apresentação técnica

## Descrição curta do repositório

FieldOps: gerenciamento de ordens de serviço e equipes técnicas com React, TypeScript e Spring Boot. Demonstração localStorage, API REST, regras de atribuição e suporte a PostgreSQL via JDBC.

## Texto curto para publicação

O FieldOps organiza ordens de serviço, técnicos e distribuição de trabalho em cinco páginas. O monorepo combina React e TypeScript com uma API Java 21/Spring Boot, incluindo validação, controle de capacidade, histórico de atividades e relatórios calculados a partir dos registros.

Há três formas de execução: demonstração no navegador, API com H2 em memória e API com PostgreSQL. A configuração PostgreSQL mantém credenciais no backend e utiliza migrações Flyway no schema `fieldops`. O MVP ainda não inclui autenticação e se destina à demonstração e ao desenvolvimento local.

## Pontos para demonstrar

- Criar uma OS e mostrar que dashboard, tabela e relatórios refletem o mesmo registro.
- Atribuir uma ordem, observar a carga do técnico e reproduzir um bloqueio por indisponibilidade ou capacidade.
- Concluir uma OS e conferir a data de conclusão e a atividade correspondente.
- Explicar a diferença entre recorte por data de abertura e produtividade por data de conclusão.
- Mostrar a seleção de adaptadores de dados e o contrato HTTP compartilhado.
- Apresentar migrações, configuração de ambiente e comandos de verificação.

## Materiais para acompanhar a publicação

- README com instruções de execução para Windows, Linux e macOS.
- Diagrama de arquitetura e contrato da API.
- Capturas das telas com dados fictícios.
- [Resultados da verificação local](VALIDATION.md): 14 testes de backend, 20 testes de frontend, build e roteiro HTTP.

## Evolução proposta

Autenticação, permissões por função, paginação no servidor, ampliação dos testes PostgreSQL, controle de versões para edições concorrentes e observabilidade.
