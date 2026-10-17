# PostgreSQL no Supabase

O FieldOps usa o Supabase como hospedagem PostgreSQL através do backend Java. A interface chama a API FieldOps; ela não recebe a senha do banco, uma chave `service_role` ou uma URL JDBC. O profile `postgres` representa uma conexão real e não é ativado pela demonstração localStorage.

## Escolher a conexão

No painel do projeto Supabase, abra **Connect** e copie host, porta e usuário da opção adequada. Para um backend persistente, use conexão direta quando a rede suportar o endereço disponível; em uma rede somente IPv4, o **Session pooler** é uma alternativa. O usuário e o host do pooler diferem da conexão direta, portanto copie os valores apresentados. [Documentação de conexões do Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Este guia utiliza conexão direta ou session pooling. Transaction pooling exige ajustes próprios de JDBC e não é o alvo do setup inicial.

Converta os dados copiados para uma URL JDBC, mantendo a senha em variável separada:

```dotenv
DB_URL=jdbc:postgresql://HOST_COPIADO:PORTA_COPIADA/postgres?sslmode=require
DB_USERNAME=USUARIO_COPIADO
DB_PASSWORD=SUBSTITUA_LOCALMENTE
```

`sslmode=require` exige criptografia, mas não verifica a identidade do servidor. Uma configuração com validação de certificado usa `verify-full` e o certificado correspondente. [Orientações oficiais de SSL](https://supabase.com/docs/guides/database/connecting-to-postgres#ssl).

Os valores acima são placeholders. Não os use literalmente e não versione credenciais. Arquivos `.env` locais são ignorados pelo Git; a aplicação Spring recebe as variáveis do processo e não carrega esses arquivos automaticamente.

## Executar no Windows

Em PowerShell, dentro de `backend/`, substitua os placeholders apenas no ambiente local:

```powershell
$env:SPRING_PROFILES_ACTIVE = "postgres"
$env:DB_URL = "jdbc:postgresql://HOST_COPIADO:PORTA_COPIADA/postgres?sslmode=require"
$env:DB_USERNAME = "USUARIO_COPIADO"
$env:DB_PASSWORD = "SUBSTITUA_LOCALMENTE"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
$env:APP_TIME_ZONE = "America/Sao_Paulo"
.\mvnw.cmd spring-boot:run
```

## Executar em Linux ou macOS

Dentro de `backend/`:

```bash
export SPRING_PROFILES_ACTIVE=postgres
export DB_URL='jdbc:postgresql://HOST_COPIADO:PORTA_COPIADA/postgres?sslmode=require'
export DB_USERNAME='USUARIO_COPIADO'
export DB_PASSWORD='SUBSTITUA_LOCALMENTE'
export CORS_ALLOWED_ORIGINS='http://localhost:5173,http://127.0.0.1:5173'
export APP_TIME_ZONE='America/Sao_Paulo'
./mvnw spring-boot:run
```

Em ambientes hospedados, configure as variáveis pelo mecanismo de segredos da plataforma. Reinicie o backend após modificá-las. Valores `DB_*` nunca pertencem a `frontend/.env.local`.

## Schema e migrações

Flyway cria e evolui as tabelas no schema `fieldops`, separado de `public`. JPA utiliza o mesmo schema. O usuário usado na inicialização precisa das permissões necessárias para executar as migrações. Não duplique manualmente as tabelas pelo SQL Editor, nem altere migrações já aplicadas; novas mudanças devem entrar em um novo arquivo de migração.

O profile `postgres` não aplica o seed fictício. Uma base nova começa vazia e pode receber técnicos e ordens pela API/interface. Os registros localStorage não são importados automaticamente.

Mantenha `fieldops` fora da lista de schemas expostos na Data API do Supabase. Como o projeto usa JDBC, não há necessidade de disponibilizar essas tabelas via REST/GraphQL do Supabase ou conceder acesso a `anon` e `authenticated`. Se a Data API não for usada por outra aplicação, ela pode ser desabilitada no projeto. [Controles de exposição da Data API](https://supabase.com/docs/guides/api/securing-your-api).

Essa separação não substitui permissões PostgreSQL nem a futura autenticação da API Java. Para uma implantação pública, defina papéis de banco com privilégios mínimos e uma estratégia separada para migrações antes de abrir o serviço.

## Conectar a interface

Em `frontend/.env.local`:

```dotenv
VITE_DATA_MODE=api
VITE_API_URL=http://localhost:8080/api/v1
```

Reinicie o Vite. `GET /api/v1/health` deve retornar `mode: "postgres"` depois que o backend inicializar. Esse endpoint identifica o profile da aplicação; sozinho, não comprova todos os fluxos de persistência.

## Verificação da integração

Em uma instância reservada para desenvolvimento:

1. Verifique a inicialização do Flyway e a existência das tabelas em `fieldops`.
2. Crie um técnico e uma OS pela interface em modo API.
3. Atribua a OS, inicie e conclua; confira status, `completedAt` e atividades.
4. Reinicie o processo Java e confirme que os registros permanecem.
5. Confira conflitos de matrícula, capacidade, indisponibilidade e exclusão de técnico vinculado.
6. Compare relatório de abertura com produtividade por conclusão, usando um período conhecido.

Consulta apenas de leitura para localizar as tabelas:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'fieldops'
order by table_name;
```

Este roteiro é uma verificação a executar com credenciais próprias. A presença da configuração no repositório não significa que uma conta Supabase foi conectada ou que esses passos foram realizados.
