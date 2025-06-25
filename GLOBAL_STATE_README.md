# 🚀 Глобальное состояние в финансовом трекере

## ✅ Что было реализовано

### 📁 Структура файлов

```
src/app/
├── types/
│   └── index.ts              # Типы данных (User, BankAccount, Transaction, Plan)
├── context/
│   ├── BalanceContext.tsx    # Основной контекст приложения
│   └── appReducer.ts         # Reducer для управления состоянием
├── hooks/
│   ├── index.ts              # Экспорт хуков
│   └── useAuth.ts            # Существующий хук авторизации (интегрирован)
├── components/
│   ├── Header.tsx            # Обновлен для использования глобального состояния
│   └── GlobalStateDemo.tsx   # Демонстрационный компонент
├── layout.tsx                # Обновлен с AppProvider
└── page.tsx                  # Обновлена главная страница
```

### 🎯 Основные компоненты

#### 1. **Типы данных** (`types/index.ts`)
- `User` - информация о пользователе
- `BankAccount` - банковские счета
- `Transaction` - финансовые транзакции
- `Plan` - планы сбережений
- `AppState` - общее состояние приложения
- `AppAction` - действия для reducer

#### 2. **Контекст** (`context/BalanceContext.tsx`)
- Интегрирован с существующим `useAuth`
- Автоматическая загрузка данных при авторизации
- API вызовы к существующим endpoints
- Обработка состояний загрузки и ошибок

#### 3. **Reducer** (`context/appReducer.ts`)
- Управление всеми состояниями
- Optimistic updates
- Централизованная логика

## 🔧 Интегрированные API endpoints

Глобальное состояние автоматически использует ваши существующие API:

- `/api/getBankAccountsRedis` - загрузка банковских счетов
- `/api/getTransRedis` - загрузка транзакций
- `/api/getPlans` - загрузка планов
- `/api/addNewAccountRedis` - создание нового счета
- `/api/addTrans` - создание транзакции
- `/api/deleteAccountRedis` - удаление счета
- `/api/delTransRedis` - удаление транзакции
- `/api/auth/logout` - выход из системы

## 💻 Примеры использования

### Базовое использование

```tsx
import { useAppContext } from './context/BalanceContext';

function MyComponent() {
  const { state, dispatch } = useAppContext();
  
  return (
    <div>
      <p>Пользователь: {state.user.data?.login}</p>
      <p>Счетов: {state.bankAccounts.data.length}</p>
      <p>Баланс: ₽{state.bankAccounts.data.reduce((t, a) => t + a.balance, 0)}</p>
    </div>
  );
}
```

### Создание нового счета

```tsx
const { state, dispatch } = useAppContext();

const createAccount = async () => {
  if (!state.user.isAuthenticated) return;
  
  const response = await fetch('/api/addNewAccountRedis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      login: state.user.data.login,
      bankName: 'Новый счет',
      balance: 10000,
    }),
  });

  if (response.ok) {
    dispatch({ 
      type: 'ADD_BANK_ACCOUNT', 
      payload: { name: 'Новый счет', balance: 10000, id: Date.now().toString() }
    });
  }
};
```

### Создание транзакции

```tsx
const createTransaction = async () => {
  if (!state.user.isAuthenticated) return;
  
  const response = await fetch('/api/addTrans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      login: state.user.data.login,
      amount: -1000,
      description: 'Покупка продуктов',
      date: new Date().toISOString(),
      bankName: 'Основной счет',
    }),
  });

  if (response.ok) {
    dispatch({ 
      type: 'ADD_TRANSACTION', 
      payload: {
        amount: -1000,
        description: 'Покупка продуктов',
        date: new Date().toISOString(),
        type: 'expense',
        bankAccount: 'Основной счет',
        id: Date.now().toString()
      }
    });
  }
};
```

## 🎨 Компоненты

### Header компонент
Обновлен для показа информации о пользователе и общем балансе в реальном времени.

### GlobalStateDemo компонент  
Демонстрирует возможности глобального состояния:
- Показ статистики в реальном времени
- Создание тестовых данных
- Отображение состояний загрузки и ошибок

## ⚡ Преимущества

1. **Централизация данных** - все в одном месте
2. **Автосинхронизация** - изменения мгновенно отражаются везде
3. **Совместимость** - использует существующие API
4. **Типизация** - полная поддержка TypeScript
5. **Optimistic updates** - быстрый отклик интерфейса
6. **Состояния загрузки** - централизованная обработка

## 🚀 Как использовать

1. **Импортируйте контекст** в любом компоненте:
   ```tsx
   import { useAppContext } from './context/BalanceContext';
   ```

2. **Используйте состояние**:
   ```tsx
   const { state, dispatch } = useAppContext();
   ```

3. **Данные обновляются автоматически** при авторизации пользователя

4. **Создавайте optimistic updates** для быстрого отклика

## 🔄 Автоматическая синхронизация

Глобальное состояние автоматически:
- Синхронизируется с `useAuth` хуком
- Загружает данные при авторизации
- Очищает состояние при выходе
- Обрабатывает ошибки сети

## 🎯 Тестирование

На главной странице доступен компонент `GlobalStateDemo` для:
- Просмотра текущего состояния
- Создания тестовых данных
- Проверки синхронизации
- Мониторинга производительности

---

**Глобальное состояние успешно интегрировано и готово к использованию!** 🎉 