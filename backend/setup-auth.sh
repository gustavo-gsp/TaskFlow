#!/bin/bash

# Script para configurar o ambiente de autenticação

echo "🔧 Configurando ambiente de autenticação..."

# 1. Instalar tipos TypeScript faltantes
echo ""
echo "📦 Instalando tipos TypeScript..."
pnpm add -D @types/bcrypt @types/cors

# 2. Verificar se o .env existe
echo ""
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📝 Copiando .env.example para .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Por favor, configure suas variáveis de ambiente."
else
    echo "✅ Arquivo .env já existe."
fi

# 3. Gerar Prisma Client
echo ""
echo "🔄 Gerando Prisma Client..."
npx prisma generate

# 4. Verificar se o banco está acessível
echo ""
echo "🗃️  Verificando conexão com o banco de dados..."
if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
    echo "✅ Conexão com o banco de dados OK!"
    
    # 5. Aplicar migrations
    echo ""
    echo "🚀 Aplicando migrations..."
    npx prisma migrate dev --name add_auth_session_table
    
    echo ""
    echo "✅ Setup concluído com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Verifique o arquivo .env e configure o JWT_SECRET"
    echo "2. Execute 'pnpm dev' para iniciar o servidor"
    echo "3. Teste os endpoints de autenticação"
else
    echo "⚠️  Não foi possível conectar ao banco de dados."
    echo "📝 Verifique:"
    echo "   1. Se o PostgreSQL está rodando"
    echo "   2. Se a DATABASE_URL no .env está correta"
    echo "   3. Execute 'npx prisma migrate dev' manualmente após configurar"
fi

echo ""
echo "📚 Documentação disponível em:"
echo "   - AUTHENTICATION_SETUP.md"
echo "   - PRISMA_MIGRATION_GUIDE.md"
echo "   - FRONTEND_INTEGRATION.md"
