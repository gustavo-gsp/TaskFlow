# 🗃️ Guia de Migration - Prisma

## O que foi alterado no schema.prisma

1. **Model Session adicionado**: Nova tabela para gerenciar refresh tokens
2. **Model User atualizado**: Adicionada relação `sessions Session[]`

## Como aplicar a migration

### Opção 1: Migration de Desenvolvimento (Recomendado)

```bash
cd backend
npx prisma migrate dev --name add_auth_session_table
```

**O que este comando faz:**
1. Analisa as mudanças no `schema.prisma`
2. Cria um arquivo SQL de migration em `prisma/migrations/`
3. Aplica a migration no banco de dados
4. Regenera o Prisma Client

### Opção 2: Apenas Gerar o Client (sem alterar DB)

Se você só quer atualizar os tipos TypeScript sem tocar no banco:

```bash
npx prisma generate
```

### Opção 3: Migration de Produção

Para aplicar migrations em produção:

```bash
npx prisma migrate deploy
```

## Verificar Status

### Ver status das migrations
```bash
npx prisma migrate status
```

### Ver o schema no banco visualmente
```bash
npx prisma studio
```

Isso abre uma interface web em `http://localhost:5555` onde você pode:
- Ver todas as tabelas
- Adicionar/editar/remover registros
- Explorar relações

## Estrutura da tabela Session

```sql
CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "refreshToken" TEXT UNIQUE NOT NULL,
  "userAgent" TEXT,
  "ip" TEXT,
  "isRevoked" BOOLEAN DEFAULT false,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

## Possíveis Erros e Soluções

### Erro: "Connection refused"
**Solução**: Verifique se o PostgreSQL está rodando e se `DATABASE_URL` está correto no `.env`

```bash
# Verificar se o PostgreSQL está rodando
sudo systemctl status postgresql
# ou
docker ps  # se estiver usando Docker
```

### Erro: "P3009: migrate found failed migrations"
**Solução**: Resete as migrations (CUIDADO: apaga dados!)

```bash
npx prisma migrate reset
```

### Erro: "P1001: Can't reach database"
**Solução**: Verifique a `DATABASE_URL` no arquivo `.env`

Formato correto:
```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco?schema=public"
```

## Reset do Banco (Desenvolvimento)

Se precisar começar do zero:

```bash
# ATENÇÃO: Isso apaga TODOS os dados!
npx prisma migrate reset

# Depois, crie as migrations novamente
npx prisma migrate dev
```

## Comandos Úteis

```bash
# Formatar o schema.prisma
npx prisma format

# Validar o schema
npx prisma validate

# Ver o SQL que será executado (sem aplicar)
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script

# Criar migration sem aplicar
npx prisma migrate dev --create-only --name add_auth_tables
```

## Ordem Recomendada de Execução

1. ✅ Certifique-se que o PostgreSQL está rodando
2. ✅ Configure o `.env` com `DATABASE_URL` correto
3. ✅ Execute `npx prisma migrate dev --name add_auth_session_table`
4. ✅ Verifique no Prisma Studio se as tabelas foram criadas
5. ✅ Inicie o servidor com `pnpm dev`
6. ✅ Teste os endpoints de autenticação

Pronto! Seu banco de dados estará configurado com as tabelas de autenticação.
