#!/bin/bash

# 🚀 Comandos Rápidos - Sistema de Autenticação TaskFlow

echo "🔐 Sistema de Autenticação TaskFlow"
echo "===================================="
echo ""
echo "Escolha uma opção:"
echo ""
echo "1) 🔧 Setup completo (primeira vez)"
echo "2) 🗃️  Aplicar migration"
echo "3) 🔄 Regenerar Prisma Client"
echo "4) 👁️  Abrir Prisma Studio"
echo "5) 🧪 Testar endpoints (curl)"
echo "6) 📊 Ver status das migrations"
echo "7) 🔍 Verificar erros TypeScript"
echo "8) 🚀 Iniciar servidor"
echo "0) ❌ Sair"
echo ""
read -p "Digite o número da opção: " choice

case $choice in
  1)
    echo ""
    echo "🔧 Executando setup completo..."
    ./setup-auth.sh
    ;;
  2)
    echo ""
    echo "🗃️  Aplicando migration..."
    npx prisma migrate dev --name add_auth_session_table
    ;;
  3)
    echo ""
    echo "🔄 Regenerando Prisma Client..."
    npx prisma generate
    ;;
  4)
    echo ""
    echo "👁️  Abrindo Prisma Studio em http://localhost:5555"
    npx prisma studio
    ;;
  5)
    echo ""
    echo "🧪 Testando endpoints..."
    echo ""
    echo "1. Registrando usuário de teste..."
    curl -X POST http://localhost:3000/auth/register \
      -H "Content-Type: application/json" \
      -d '{"name":"Usuario Teste","email":"teste@example.com","password":"senha12345"}' \
      -c /tmp/cookies.txt \
      -w "\n\nStatus: %{http_code}\n\n"
    
    echo "2. Verificando dados do usuário..."
    curl -X GET http://localhost:3000/auth/me \
      -b /tmp/cookies.txt \
      -w "\n\nStatus: %{http_code}\n\n"
    
    echo "3. Fazendo logout..."
    curl -X POST http://localhost:3000/auth/logout \
      -b /tmp/cookies.txt \
      -w "\n\nStatus: %{http_code}\n\n"
    
    echo "✅ Testes concluídos!"
    ;;
  6)
    echo ""
    echo "📊 Status das migrations:"
    npx prisma migrate status
    ;;
  7)
    echo ""
    echo "🔍 Verificando erros TypeScript..."
    pnpm exec tsc --noEmit
    ;;
  8)
    echo ""
    echo "🚀 Iniciando servidor..."
    pnpm dev
    ;;
  0)
    echo ""
    echo "👋 Até logo!"
    exit 0
    ;;
  *)
    echo ""
    echo "❌ Opção inválida!"
    exit 1
    ;;
esac
