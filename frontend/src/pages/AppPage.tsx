import { useAuthContext } from '../contexts/AuthContext';

export function AppPage() {
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Olá, <strong>{user?.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Bem-vindo ao TaskFlow! 🎉
              </h2>
              <p className="text-gray-600">
                Sistema de autenticação configurado com sucesso.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Email: {user?.email}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
