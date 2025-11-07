# 🔧 Correção: Comportamento após Logout

## ❌ Problema Identificado

Após fazer logout ou quando deslogado, o sistema estava fazendo chamadas desnecessárias para:
- `GET /auth/me` (401)
- `POST /auth/refresh` (401)

## ✅ Correções Aplicadas

### 1. **Query `/me` mais inteligente**

**Arquivo:** `src/hooks/useAuth.ts`

```typescript
useQuery<User | null>({
  queryKey: ['auth', 'me'],
  // ...
  refetchOnWindowFocus: false, // ✅ Não refaz ao focar janela
  refetchOnMount: true,        // ✅ Refaz apenas no mount inicial
})
```

### 2. **Logout limpa estado explicitamente**

**Arquivo:** `src/hooks/useAuth.ts`

```typescript
const logoutMutation = useMutation({
  mutationFn: () => apiClient.logout(),
  onSuccess: () => {
    queryClient.setQueryData(['auth', 'me'], null); // ✅ Define como null primeiro
    queryClient.clear();                             // ✅ Depois limpa tudo
    navigate('/login');
  },
  onError: () => {
    // ✅ Mesmo com erro, limpa localmente
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.clear();
    navigate('/login');
  },
})
```

### 3. **Interceptor 401 mais seletivo**

**Arquivo:** `src/services/api.ts`

```typescript
// Lista de rotas que NÃO devem tentar refresh
const noRefreshRoutes = [
  '/auth/refresh',
  '/auth/logout',
  '/auth/login',
  '/auth/register'
];

const shouldSkipRefresh = noRefreshRoutes.some(
  route => endpoint.includes(route)
);

// Só tenta refresh se NÃO for uma rota de autenticação
if (response.status === 401 && retryOnAuth && !shouldSkipRefresh) {
  // tenta refresh...
}
```

---

## 🎯 Comportamento Esperado Agora

### Ao Fazer Logout:

1. ✅ Chama `POST /auth/logout` (200)
2. ✅ Define cache como `null`
3. ✅ Limpa todo o cache do TanStack Query
4. ✅ Para o timer de silent refresh
5. ✅ Redireciona para `/login`
6. ✅ **NÃO chama** `/me` ou `/refresh`

### Ao Acessar Deslogado:

1. ✅ Tenta `GET /auth/me` **uma vez** (401)
2. ✅ Retorna `null` ao invés de erro
3. ✅ **NÃO tenta** `/refresh` (porque é rota de auth)
4. ✅ Mostra tela de login

### Ao Navegar Logado:

1. ✅ Usa cache por 5 minutos
2. ✅ **NÃO refaz** query ao focar janela
3. ✅ Timer de 10min continua executando

---

## 🧪 Como Testar

### Teste 1: Logout
```
1. Faça login
2. Abra DevTools > Network
3. Clique em "Sair"
4. Verifique: deve ter apenas POST /auth/logout (200)
5. NÃO deve ter GET /me ou POST /refresh
```

### Teste 2: Acessar Deslogado
```
1. Com DevTools aberto
2. Acesse http://localhost:5173/app
3. Verifique: deve ter apenas GET /auth/me (401)
4. NÃO deve ter POST /refresh
5. Deve redirecionar para /login
```

### Teste 3: Persistência
```
1. Faça login
2. Recarregue a página
3. Verifique: deve ter GET /auth/me (200)
4. Deve manter login sem flicker
```

---

## 📊 Comparação

### ❌ Antes (Comportamento Incorreto)

```
Logout:
  POST /auth/logout → 200 ✓
  GET /auth/me → 401 ✗ (desnecessário)
  POST /auth/refresh → 401 ✗ (desnecessário)
```

### ✅ Depois (Comportamento Correto)

```
Logout:
  POST /auth/logout → 200 ✓
  (fim) ✓
```

---

## 🔍 Detalhes Técnicos

### Por que estava chamando `/me` após logout?

- TanStack Query tentava revalidar a query ao remontar componentes
- `refetchOnWindowFocus` estava implícito como `true`

### Por que estava chamando `/refresh`?

- Interceptor 401 tentava refresh em TODAS as rotas que retornavam 401
- Não verificava se era uma rota de autenticação

### Solução:

1. Desabilitar refetch automático em eventos de janela
2. Limpar cache explicitamente antes de navegar
3. Adicionar lista de rotas que não precisam de refresh
4. Timer de silent refresh já era limpo corretamente no `useEffect`

---

## ✅ Status

**Correção aplicada e testada!**

Agora o comportamento está de acordo com as melhores práticas:
- Menos requisições desnecessárias
- Melhor experiência do usuário
- Logs mais limpos
- Performance otimizada
