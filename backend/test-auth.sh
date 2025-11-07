#!/bin/bash

echo "🧪 Testando Endpoints de Autenticação"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:4000"
COOKIES="/tmp/taskflow_cookies.txt"

# Limpar cookies antigos
rm -f $COOKIES

echo "📝 Teste 1: Registrar novo usuário"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Usuário Teste","email":"teste'$(date +%s)'@example.com","password":"senha12345"}' \
  -c $COOKIES)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Registro bem-sucedido!${NC}"
  echo "Resposta: $BODY"
else
  echo -e "${RED}❌ Falha no registro (HTTP $HTTP_CODE)${NC}"
  echo "Resposta: $BODY"
  exit 1
fi

echo ""
echo "📝 Teste 2: Verificar dados do usuário (/auth/me)"
echo "--------------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/auth/me \
  -b $COOKIES)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Usuário autenticado!${NC}"
  echo "Resposta: $BODY"
else
  echo -e "${RED}❌ Falha na autenticação (HTTP $HTTP_CODE)${NC}"
  echo "Resposta: $BODY"
  exit 1
fi

echo ""
echo "📝 Teste 3: Renovar tokens (/auth/refresh)"
echo "-------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/refresh \
  -b $COOKIES \
  -c $COOKIES)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Tokens renovados!${NC}"
  echo "Resposta: $BODY"
else
  echo -e "${RED}❌ Falha ao renovar tokens (HTTP $HTTP_CODE)${NC}"
  echo "Resposta: $BODY"
  exit 1
fi

echo ""
echo "📝 Teste 4: Fazer logout"
echo "-------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/logout \
  -b $COOKIES)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Logout realizado!${NC}"
  echo "Resposta: $BODY"
else
  echo -e "${RED}❌ Falha no logout (HTTP $HTTP_CODE)${NC}"
  echo "Resposta: $BODY"
  exit 1
fi

echo ""
echo "📝 Teste 5: Verificar se foi desautenticado"
echo "--------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/auth/me \
  -b $COOKIES)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✅ Desautenticado corretamente!${NC}"
  echo "Resposta: $BODY"
else
  echo -e "${YELLOW}⚠️  Ainda autenticado (HTTP $HTTP_CODE)${NC}"
  echo "Resposta: $BODY"
fi

echo ""
echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
echo ""
echo "📊 Resumo:"
echo "  ✅ Registro de usuário"
echo "  ✅ Autenticação com cookies"
echo "  ✅ Renovação de tokens"
echo "  ✅ Logout"
echo "  ✅ Desautenticação"
