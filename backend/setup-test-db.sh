#!/bin/bash

# Script para configurar banco de dados de teste

echo "🔧 Configurando banco de dados de teste..."

# Carregar variáveis de ambiente de teste
export $(cat .env.test | xargs)

# Criar banco de dados de teste se não existir
echo "📦 Criando banco de dados taskflow_test..."
PGPASSWORD=expinhosoft psql -h localhost -p 5532 -U taskflow -d postgres -c "CREATE DATABASE taskflow_test;" 2>/dev/null || echo "⚠️  Banco de dados já existe"

# Rodar migrations no banco de teste
echo "🔄 Aplicando migrations..."
pnpm prisma migrate deploy

# Gerar Prisma Client
echo "⚡ Gerando Prisma Client..."
pnpm prisma generate

echo "✅ Banco de dados de teste configurado com sucesso!"
echo ""
echo "Para rodar os testes:"
echo "  pnpm test"
