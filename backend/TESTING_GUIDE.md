# Guia de Testes - Backend

## 📋 Visão Geral

Este projeto utiliza **Jest** e **Supertest** para testes de integração e unitários do sistema de autenticação.

## 🛠️ Configuração Inicial

### 1. Instalar Dependências

As dependências de teste já estão no `package.json`:

```bash
pnpm install
```

### 2. Configurar Banco de Dados de Teste

O banco de teste usa uma instância separada do PostgreSQL:

```bash
# Dar permissão de execução ao script
chmod +x setup-test-db.sh

# Executar o script de configuração
./setup-test-db.sh
```

Ou manualmente:

```bash
# Criar banco de dados
PGPASSWORD=expinhosoft psql -h localhost -p 5532 -U taskflow -d postgres -c "CREATE DATABASE taskflow_test;"

# Aplicar migrations
DATABASE_URL="postgresql://taskflow:expinhosoft@localhost:5532/taskflow_test" pnpm prisma migrate deploy

# Gerar Prisma Client
pnpm prisma generate
```

### 3. Variáveis de Ambiente

O arquivo `.env.test` já está configurado:

```env
NODE_ENV=test
DATABASE_URL="postgresql://taskflow:expinhosoft@localhost:5532/taskflow_test"
JWT_SECRET="test-secret-key-super-secret"
PORT=4001
```

## 🧪 Rodando os Testes

### Todos os Testes

```bash
pnpm test
```

### Testes em Modo Watch

```bash
pnpm test --watch
```

### Testes de um Arquivo Específico

```bash
pnpm test auth-register
```

### Testes com Coverage

```bash
pnpm test --coverage
```

## 📁 Estrutura de Testes

```
src/tests/
├── setup.ts                    # Configuração global do Jest
├── utils/
│   └── test-helpers.ts        # Funções auxiliares
├── integration/               # Testes de integração (E2E)
│   ├── auth-register.test.ts
│   ├── auth-login.test.ts
│   ├── auth-refresh.test.ts
│   ├── auth-logout.test.ts
│   └── auth-me.test.ts
└── unit/                      # Testes unitários
    └── auth-middleware.test.ts
```

## ✅ Cobertura de Testes

### Testes de Integração

#### 1. **POST /api/auth/register**
- ✅ Registro de novo usuário com sucesso
- ✅ Erro ao omitir email
- ✅ Erro ao omitir senha
- ✅ Erro ao usar email duplicado
- ✅ Cookies httpOnly são configurados
- ✅ Sessão é criada no banco de dados

#### 2. **POST /api/auth/login**
- ✅ Login com credenciais válidas
- ✅ Erro com email inválido
- ✅ Erro com senha inválida
- ✅ Erro ao omitir email
- ✅ Erro ao omitir senha
- ✅ Nova sessão é criada no login
- ✅ Cookies httpOnly e SameSite são configurados

#### 3. **POST /api/auth/refresh**
- ✅ Refresh de tokens com token válido
- ✅ Erro sem refresh token
- ✅ Erro com refresh token inválido
- ✅ Rotação de tokens (revoga sessão antiga e cria nova)
- ✅ Tokens revogados não podem ser reutilizados

#### 4. **POST /api/auth/logout**
- ✅ Logout com sucesso
- ✅ Sessão é revogada no banco
- ✅ Cookies são limpos
- ✅ Erro sem autenticação
- ✅ Sessão não pode ser reutilizada após logout

#### 5. **GET /api/auth/me**
- ✅ Retorna dados do usuário com token válido
- ✅ Erro sem token
- ✅ Erro com token inválido

### Testes Unitários

#### 1. **Auth Middleware (requireAuth)**
- ✅ Permite acesso com token válido
- ✅ Bloqueia sem token (401)
- ✅ Bloqueia com token inválido (401)
- ✅ Bloqueia com token expirado (401)
- ✅ Adiciona dados do usuário ao Request

## 🔧 Funções Auxiliares

### `createTestUser(data?)`
Cria um usuário de teste no banco:

```typescript
const user = await createTestUser({
  email: 'test@example.com',
  password: 'Password@123',
});
```

### `getAuthCookies(app, email, password)`
Faz login e retorna os cookies de autenticação:

```typescript
const cookies = await getAuthCookies(app, 'test@example.com', 'Password@123');
```

### `extractCookie(cookies, name)`
Extrai um cookie específico dos headers:

```typescript
const accessToken = extractCookie(cookies, 'access_token');
```

## 📊 Exemplo de Teste

```typescript
import request from 'supertest';
import app from '../../app';
import { createTestUser } from '../utils/test-helpers';
import '../setup';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const testUser = await createTestUser({
      email: 'login@example.com',
      password: 'Password@123',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUser.email);
  });
});
```

## 🧹 Limpeza Automática

O arquivo `setup.ts` garante que:
- O banco é conectado antes dos testes
- Dados são limpos após cada teste
- Conexão é fechada após todos os testes

## 🚀 CI/CD

Para integração contínua, adicione ao seu workflow:

```yaml
- name: Setup test database
  run: ./setup-test-db.sh

- name: Run tests
  run: pnpm test --ci --coverage
```

## 📝 Notas Importantes

1. **Banco de Teste Separado**: Sempre use `taskflow_test`, nunca o banco de desenvolvimento
2. **Limpeza de Dados**: Os testes limpam dados automaticamente após cada execução
3. **Isolamento**: Cada teste é independente e não afeta outros testes
4. **Cookies**: Use `extractCookie()` para trabalhar com cookies nos testes
5. **TypeScript**: Todos os testes são escritos em TypeScript com tipos adequados

## 🐛 Troubleshooting

### "Cannot find module"
```bash
pnpm prisma generate
```

### "Connection refused"
Verifique se o PostgreSQL está rodando:
```bash
docker-compose ps
```

### "Database does not exist"
Execute o script de setup:
```bash
./setup-test-db.sh
```

### Testes falhando intermitentemente
Limpe o banco de teste:
```bash
DATABASE_URL="postgresql://taskflow:expinhosoft@localhost:5532/taskflow_test" pnpm prisma migrate reset --force
```
