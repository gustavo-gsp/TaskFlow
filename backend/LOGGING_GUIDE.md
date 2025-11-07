# 📝 Sistema de Logs - TaskFlow Backend

## ✅ Configuração Implementada

### Logger com Pino Pretty

O sistema de logs foi configurado usando **Pino** com transporte **Pino Pretty** para logs coloridos e legíveis.

**Arquivo**: `src/utils/logger.ts`

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    }
  }
});
```

### Níveis de Log Disponíveis

- `trace` - Muito detalhado (debugging)
- `debug` - Informações de debug
- `info` - Informações gerais (padrão)
- `warn` - Avisos
- `error` - Erros
- `fatal` - Erros fatais

## 📍 Onde os Logs Foram Adicionados

### 1. Server (src/server.ts)
```typescript
logger.info({ port: PORT }, 'Backend rodando');
```

### 2. App - Middleware Global (src/app.ts)
Loga todas as requisições recebidas:
```typescript
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }, 'Requisição recebida');
  next();
});
```

### 3. Auth Controller (src/controllers/auth.controller.ts)

#### Register
- ✅ Tentativa de registro
- ✅ Campos faltando
- ✅ Senha muito curta
- ✅ Email já cadastrado
- ✅ Usuário criado
- ✅ Sessão criada
- ✅ Registro completo
- ✅ Erros

#### Login
- ✅ Tentativa de login
- ✅ Campos faltando
- ✅ Usuário não encontrado
- ✅ Senha incorreta
- ✅ Login bem-sucedido
- ✅ Sessão criada
- ✅ Login completo
- ✅ Erros

### 4. Rate Limit Middleware (src/middlewares/rate-limit.middleware.ts)
- ✅ Verificação de rate limit
- ✅ Rate limit excedido

## 🎯 Exemplo de Output

Ao fazer uma requisição, você verá logs assim:

```
[23:24:23] INFO: Backend rodando
    port: "4000"
[23:24:30] INFO: Requisição recebida
    method: "POST"
    url: "/auth/register"
    ip: "::1"
    userAgent: "curl/7.81.0"
[23:24:30] DEBUG: Verificando rate limit por IP
    ip: "::1"
    url: "/auth/register"
[23:24:30] INFO: Tentativa de registro
    body: {
      "name": "Teste",
      "email": "teste@example.com",
      "password": "***"
    }
[23:24:30] INFO: Criando usuário
    email: "teste@example.com"
[23:24:31] INFO: Usuário criado com sucesso
    userId: "uuid-aqui"
    email: "teste@example.com"
[23:24:31] INFO: Sessão criada
    userId: "uuid-aqui"
    sessionId: "session-uuid"
[23:24:31] INFO: Registro completo, cookies definidos
    userId: "uuid-aqui"
```

## 🔧 Configuração Personalizada

### Alterar Nível de Log

No arquivo `.env`:

```bash
# Valores: trace, debug, info, warn, error, fatal
LOG_LEVEL=debug
```

### Logs em Produção

Para produção, configure sem pino-pretty (melhor performance):

```typescript
// src/utils/logger.ts (produção)
export const logger = pino({
  level: 'info',
  // Sem transport, saída JSON direto para stdout
});
```

### Rotação de Logs

Para salvar logs em arquivo com rotação:

```bash
pnpm add -D pino-roll
```

```typescript
export const logger = pino(
  pino.destination({
    dest: './logs/app.log',
    minLength: 4096,
    sync: false
  })
);
```

## 📊 Monitoramento

### Ver logs em tempo real

```bash
cd backend
pnpm dev
```

### Filtrar logs por nível

```bash
# Apenas erros
pnpm dev | grep ERROR

# Debug e acima
LOG_LEVEL=debug pnpm dev
```

### Logs estruturados

Todos os logs incluem metadata estruturada que pode ser parseada:

```typescript
logger.info({ 
  userId: user.id, 
  action: 'login',
  ip: req.ip 
}, 'Usuário fez login');
```

## 🐛 Debug

Para debugar problemas, aumente o nível de log:

```bash
LOG_LEVEL=debug pnpm dev
```

Ou diretamente no código:

```typescript
logger.debug({ data: someData }, 'Debug info');
logger.trace({ deepData: veryDetailedData }, 'Trace info');
```

## ✅ Checklist de Logs Implementados

- ✅ Servidor inicializando
- ✅ Todas as requisições HTTP
- ✅ Tentativas de registro
- ✅ Tentativas de login
- ✅ Erros de validação
- ✅ Criação de usuários
- ✅ Criação de sessões
- ✅ Rate limiting
- ✅ Erros gerais

## 🎨 Próximas Melhorias (Opcional)

- [ ] Logs de performance (tempo de resposta)
- [ ] Correlação de logs por request ID
- [ ] Integração com ELK Stack ou similar
- [ ] Alertas em caso de muitos erros
- [ ] Dashboard de logs
- [ ] Logs de queries do Prisma

## 📚 Documentação do Pino

- [Documentação Oficial](https://getpino.io/)
- [Pino Pretty](https://github.com/pinojs/pino-pretty)
- [Best Practices](https://getpino.io/#/docs/best-practices)
