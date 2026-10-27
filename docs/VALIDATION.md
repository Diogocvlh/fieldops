# Verificação do MVP

Verificações locais realizadas em 16 de outubro de 2026, com Java 21 e Node.js 24. A integração contínua também está configurada para Java 21 e Node.js 22.

| Verificação | Resultado |
| --- | --- |
| Backend — Maven Wrapper `verify` | 14 testes passaram |
| PostgreSQL — teste condicional de migrações | Ignorado localmente: `DB_URL` não fornecida |
| Frontend — Vitest | 20 testes passaram |
| Frontend — TypeScript | Verificação de tipos passou |
| Frontend — Vite | Build de produção passou |
| API — teste HTTP com servidor H2 | Fluxo completo passou |
| CORS — origem `http://127.0.0.1:5173` | Origem aceita pela API local |
| Interface React + API Java | Leitura e criação real de OS passaram |
| API desligada | Erro e opção de tentar novamente, sem fallback para localStorage |

## Regras exercitadas

Os testes automatizados cobrem disponibilidade, capacidade, matrícula única, conclusão, reabertura, exclusão de técnico vinculado, rollback de transações e duas atribuições concorrentes para uma única vaga. No navegador, os testes de serviços cobrem falha de gravação, dados corrompidos, unicidade de códigos, datas, filtros e exportação CSV.

O roteiro `scripts/smoke_api.py` criou registros fictícios na API de demonstração e verificou respostas HTTP de criação, validação, conflitos, atribuição, conclusão, atividades, relatórios e reabertura. Os registros de trabalho criados pelo roteiro foram removidos ao final.

## Navegação e apresentação

As cinco páginas foram abertas no navegador. O roteiro manual criou uma ordem fictícia de inspeção de nobreak, atribuiu Rafael Martins, confirmou a mudança de carga, concluiu a ordem e verificou a data de conclusão e o histórico. A ordem permaneceu após recarregar a página.

O filtro de concluídas exibiu 17 ordens e taxa de conclusão de 100%. A exportação CSV gerou um arquivo legível com os 37 registros do recorte completo exibido depois da atualização da interface.

Foram conferidos os layouts em viewports de 1440 × 1000 e 390 × 844. No celular, as ordens usam cards, sem rolagem horizontal. O menu móvel transfere o foco ao abrir, fecha com Escape, devolve o foco ao botão e torna a navegação oculta inativa.

O frontend foi iniciado temporariamente com `VITE_DATA_MODE=api`. A página carregou as 32 ordens do seed Java e criou uma nova ordem pelo formulário, chegando a 33 registros no servidor. Ao encerrar a API e recarregar a página, a interface apresentou o erro de conexão com a ação de tentar novamente. A configuração padrão dos fontes continua sendo demonstração localStorage.

## Integrações externas

A conexão com uma instância Supabase não foi executada: depende das credenciais do projeto. O profile PostgreSQL, as migrações e o teste condicional estão preparados para essa etapa.

Em 27 de outubro de 2026, a [primeira execução da CI no GitHub Actions](https://github.com/Diogocvlh/fieldops/actions/runs/40580904412) concluiu com sucesso os jobs do frontend e do backend. O job Java disponibilizou um PostgreSQL 17 temporário para a verificação de migrações; isso valida o ambiente da CI, sem substituir a verificação de uma instância Supabase configurada pelo usuário.

## Atualização de dependências

Em 27 de outubro de 2026, o Vite foi atualizado para 8.1.6 para corrigir os alertas identificados no repositório. Após a atualização, a verificação TypeScript, os 20 testes do frontend e o build de produção passaram. A consulta `npm audit` não apontou vulnerabilidades no conjunto de dependências daquele momento; novos avisos podem surgir conforme a base de alertas evolui.
