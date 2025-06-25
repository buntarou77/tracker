import RegisterForm from './components/SendForm';
import GlobalStateDemo from './components/GlobalStateDemo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="header bg-dark m-auto flex justify-center py-8">
        <RegisterForm />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Финансовый Трекер с Глобальным Состоянием
        </h1>
        
        <div className="mb-8">
          <GlobalStateDemo />
        </div>
        
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            🚀 Глобальное состояние успешно интегрировано!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">📦 Централизованные данные</h3>
              <p>Все данные приложения в одном месте</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">🔄 Автосинхронизация</h3>
              <p>Изменения мгновенно отражаются везде</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">⚡ Optimistic updates</h3>
              <p>Быстрый отклик интерфейса</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}