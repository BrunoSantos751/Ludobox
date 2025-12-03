# Instruções para Criar o Banco de Dados - Ludobox

Este documento contém os comandos necessários para criar e configurar o banco de dados PostgreSQL para o projeto Ludobox.

## Pré-requisitos

1. **PostgreSQL instalado** no seu sistema
2. **Acesso ao PostgreSQL** via linha de comando (psql) ou interface gráfica

## Opção 1: Usando psql (Linha de Comando)

### Passo 1: Conectar ao PostgreSQL

No Windows (PowerShell):
```powershell
# Conectar como usuário postgres (ou seu usuário admin)
psql -U postgres
```

No Linux/Mac:
```bash
sudo -u postgres psql
# ou
psql -U postgres
```

### Passo 2: Criar o Banco de Dados

```sql
-- Criar o banco de dados
CREATE DATABASE catalago_jogos;

-- Conectar ao banco criado
\c catalago_jogos
```

### Passo 3: Executar o Script de Criação

```sql
-- Executar o script SQL
\i create_database.sql
```

**OU** se estiver em outro diretório:

```sql
\i C:/Users/Bruno/Documents/projetos/Ludobox/Server/serv/create_database.sql
```

### Passo 4: Criar o Usuário (Opcional, mas recomendado)

```sql
-- Criar usuário específico para o projeto
CREATE USER ludobox WITH PASSWORD '123';

-- Dar permissões ao usuário
GRANT ALL PRIVILEGES ON DATABASE catalago_jogos TO ludobox;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ludobox;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ludobox;

-- Se já existirem tabelas, dar permissões nas tabelas futuras também
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ludobox;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ludobox;
```

### Passo 5: Verificar as Tabelas Criadas

```sql
-- Listar todas as tabelas
\dt

-- Ver estrutura de uma tabela específica
\d users
\d avaliacoes
```

## Opção 2: Usando pgAdmin (Interface Gráfica)

1. Abra o **pgAdmin**
2. Conecte-se ao servidor PostgreSQL
3. Clique com botão direito em **Databases** → **Create** → **Database**
4. Nome: `catalago_jogos`
5. Clique em **Save**
6. Expanda o banco `catalago_jogos`
7. Clique com botão direito em **catalago_jogos** → **Query Tool**
8. Abra o arquivo `create_database.sql`
9. Copie e cole o conteúdo no Query Tool
10. Execute o script (F5 ou botão Execute)

## Opção 3: Usando Comandos Diretos no Terminal

### Windows (PowerShell)

```powershell
# Criar banco de dados
psql -U postgres -c "CREATE DATABASE catalago_jogos;"

# Executar script SQL
psql -U postgres -d catalago_jogos -f create_database.sql

# Criar usuário (opcional)
psql -U postgres -d catalago_jogos -c "CREATE USER ludobox WITH PASSWORD '123';"
psql -U postgres -d catalago_jogos -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ludobox;"
```

### Linux/Mac

```bash
# Criar banco de dados
sudo -u postgres psql -c "CREATE DATABASE catalago_jogos;"

# Executar script SQL
sudo -u postgres psql -d catalago_jogos -f create_database.sql

# Criar usuário (opcional)
sudo -u postgres psql -d catalago_jogos -c "CREATE USER ludobox WITH PASSWORD '123';"
sudo -u postgres psql -d catalago_jogos -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ludobox;"
```

## Configuração do Arquivo conexao.env

Após criar o banco de dados, certifique-se de que o arquivo `conexao.env` está configurado corretamente:

```env
DB_NAME=catalago_jogos
DB_USER=ludobox
DB_PASSWORD=123
DB_HOST=localhost
DB_PORT=5432
```

## Verificação Final

Para verificar se tudo está funcionando, você pode executar:

```sql
-- Conectar ao banco
\c catalago_jogos

-- Ver todas as tabelas
\dt

-- Contar registros em cada tabela
SELECT 'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'avaliacoes', COUNT(*) FROM avaliacoes
UNION ALL
SELECT 'user_games', COUNT(*) FROM user_games
UNION ALL
SELECT 'follows', COUNT(*) FROM follows;
```

## Estrutura das Tabelas Criadas

O script cria as seguintes tabelas:

1. **users** - Usuários do sistema (login por email ou Steam)
2. **avaliacoes** - Avaliações de jogos feitas pelos usuários
3. **user_evaluation_likes** - Likes de usuários em avaliações
4. **user_games** - Jogos adicionados pelos usuários com status
5. **jogos_favoritos** - Jogos favoritos dos usuários
6. **follows** - Relação de seguidores/seguindo entre usuários

## Troubleshooting

### Erro: "database already exists"
```sql
-- Se o banco já existir, você pode removê-lo primeiro (CUIDADO!)
DROP DATABASE IF EXISTS catalago_jogos;
CREATE DATABASE catalago_jogos;
```

### Erro: "permission denied"
- Certifique-se de estar usando um usuário com permissões de administrador (postgres)
- Ou use `sudo` no Linux/Mac

### Erro: "psql: command not found"
- Certifique-se de que o PostgreSQL está instalado
- Adicione o PostgreSQL ao PATH do sistema

### Verificar se o PostgreSQL está rodando

**Windows:**
```powershell
Get-Service postgresql*
```

**Linux:**
```bash
sudo systemctl status postgresql
```

**Mac:**
```bash
brew services list | grep postgresql
```

