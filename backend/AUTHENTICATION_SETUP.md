# 🔐 Sistema de Autenticação - TaskFlow

## ✅ Arquivos Criados

### Configuração
- `src/config/auth.config.ts` - Configurações de JWT, cookies e rate limit

### Serviços
- `src/services/auth.service.ts` - Lógica de hash, JWT e refresh tokens

### Controllers
- `src/controllers/auth.controller.ts` - Handlers dos endpoints de autenticação

### Middlewares
- `src/middlewares/auth.middleware.ts` - Validação de JWT
- `src/middlewares/rate-limit.middleware.ts` - Proteção contra brute force

### Rotas
- `src/modules/auth/auth.routes.ts` - Endpoints de autenticação (atualizado)

### Schema
- `prisma/schema.prisma` - Modelos User e Session (atualizado)

## 📋 Próximos Passos

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env` e adicione:
- `DATABASE_URL` com suas credenciais do PostgreSQL
- `JWT_SECRET` com uma chave secreta forte (gere uma usando `openssl rand -base64 32`)
- `NODE_ENV=development` (ou production quando em produção)

### 2. Criar e Aplicar a Migration do Prisma

O schema já foi atualizado com os modelos `User` e `Session`. Agora você precisa criar a migration:

```bash
# Entre na pasta backend
cd backend

# Crie a migration
npx prisma migrate dev --name add_auth_tables

# Isso irá:
# 1. Criar uma nova migration na pasta prisma/migrations/
# 2. Aplicar a migration no banco de dados
# 3. Gerar o Prisma Client atualizado
```

**Observação:** Se você já tem dados no banco e quer apenas adicionar as novas tabelas sem afetar as existentes, o Prisma criará automaticamente a migration incremental.

### 3. Verificar a Migration

```bash
# Ver o status das migrations
npx prisma migrate status

# Ver o schema no Prisma Studio (interface visual)
npx prisma studio
```

### 4. Testar os Endpoints

Inicie o servidor:

```bash
pnpm dev
```

#### Registrar um novo usuário
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456"
  }' \
  -c cookies.txt
```

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123456"
  }' \
  -c cookies.txt
```

#### Renovar tokens
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

#### Buscar dados do usuário autenticado
```bash
curl -X GET http://localhost:3000/auth/me \
  -b cookies.txt
```

#### Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

## 🔧 Ajustes Opcionais

### 1. Usar Redis para Rate Limit (Recomendado para Produção)

Atualmente o rate limit usa memória in-process. Para ambientes com múltiplas instâncias, use Redis.

Instale o cliente Redis:
```bash
pnpm add ioredis
```

Modifique `src/middlewares/rate-limit.middleware.ts` para usar Redis ao invés de memória local.

### 2. Adicionar Logs

Instale e configure o Pino (já está no package.json):

```typescript
// src/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});
```

Use nos controllers:
```typescript
import { logger } from '../utils/logger';

logger.info({ userId: user.id }, 'Usuário registrado com sucesso');
logger.error({ error }, 'Erro ao fazer login');
```

### 3. Validação de Dados (Zod)

Para validação mais robusta, instale o Zod:

```bash
pnpm add zod
```

Crie schemas de validação:

```typescript
// src/validators/auth.validator.ts
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});
```

### 4. Proteger Rotas de Tasks

Para proteger rotas que requerem autenticação, use o middleware:

```typescript
// src/modules/tasks/tasks.routes.ts
import { requireAuth } from '../../middlewares/auth.middleware';

taskRouter.use(requireAuth); // Protege todas as rotas abaixo
taskRouter.get('/', getMyTasks);
taskRouter.post('/', createTask);
```

### 5. CORS em Produção

No `src/app.ts`, configure CORS para aceitar apenas seu domínio de produção:

```typescript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://seudominio.com']
  : ['http://localhost:5173'];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
```

## 🔒 Segurança

### Checklist de Segurança Implementado

- ✅ **Senhas com bcrypt** (12 rounds)
- ✅ **JWT de curta duração** (15 minutos)
- ✅ **Refresh tokens rotativos** (30 dias)
- ✅ **Cookies httpOnly** + SameSite=Lax
- ✅ **Rate limiting** por IP e email (5 tentativas/minuto)
- ✅ **Refresh tokens no banco** (podem ser revogados)
- ✅ **Sessões com metadados** (userAgent, IP)
- ✅ **Mensagens de erro genéricas** (não expõe se email existe)

### Recomendações Adicionais

1. **JWT_SECRET forte**: Use no mínimo 32 caracteres aleatórios
2. **HTTPS em produção**: Configure SSL/TLS
3. **Helmet configurado**: Já está ativo para headers de segurança
4. **Validação de entrada**: Considere adicionar Zod ou Joi
5. **Monitoramento**: Configure logs e alertas para tentativas de brute force
6. **2FA (futuro)**: Considere implementar autenticação de dois fatores

## 🧪 Testes

Crie testes para os endpoints:

```typescript
// src/tests/auth.test.ts
import request from 'supertest';
import app from '../app';

describe('Auth Endpoints', () => {
  it('deve registrar um novo usuário', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Teste',
        email: 'teste@example.com',
        password: 'senha12345',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('teste@example.com');
  });

  // Mais testes...
});
```

## 📚 Endpoints Disponíveis

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/register` | Registrar novo usuário | Não |
| POST | `/auth/login` | Fazer login | Não |
| POST | `/auth/refresh` | Renovar tokens | Sim (refresh token) |
| POST | `/auth/logout` | Fazer logout | Não |
| GET | `/auth/me` | Dados do usuário autenticado | Sim |

## 🔄 Fluxo Completo

1. **Registro**: User se registra → Recebe access + refresh tokens em cookies
2. **Login**: User faz login → Recebe access + refresh tokens em cookies
3. **Request Autenticado**: Frontend envia cookies automaticamente → Backend valida access token
4. **Token Expira**: Access token expira após 15min → Frontend chama `/auth/refresh`
5. **Refresh**: Backend valida refresh token → Rotaciona refresh + emite novo access
6. **Logout**: User faz logout → Refresh token é revogado → Cookies são limpos

## 🎯 Status

✅ Schema Prisma atualizado com User e Session
✅ Serviço de autenticação completo
✅ Controllers implementados
✅ Middlewares de auth e rate limit
✅ Rotas configuradas
✅ Integração no app principal

**Próximo passo**: Aplicar a migration no banco de dados!
