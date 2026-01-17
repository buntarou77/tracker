# 💰 Finance Tracker

Персональное приложение для отслеживания финансов, планирования бюджета и аналитики расходов.

## 🚀 Возможности

- 📊 Аналитика расходов и доходов
- 🎯 Планирование бюджета с категориями
- 💳 Управление банковскими счетами
- 📈 Визуализация данных через графики
- 🔐 Безопасная аутентификация

## 🛠️ Технологии

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Chart.js, React-Chartjs-2
- **Database:** MongoDB
- **Auth:** JWT, bcryptjs

## 🚀 Быстрый старт

### Вариант 1: С Docker (Рекомендуется)

1. **Клонируйте репозиторий**
   ```bash
   git clone <your-repo-url>
   cd my-next
   ```

2. **Запустите базы данных**
   ```bash
   docker-compose up -d
   ```

3. **Установите зависимости**
   ```bash
   npm install
   ```

4. **Запустите приложение**
   ```bash
   npm run dev
   ```

5. **Откройте браузер**
   ```
   http://localhost:3000
   ```

### Вариант 2: Локальная установка

1. **Установите MongoDB**
- MongoDB: https://docs.mongodb.com/manual/installation/

2. **Запустите сервис**
   ```bash
   # MongoDB
   mongod
   ```

3. **Установите зависимости и запустите приложение**
   ```bash
   npm install
   npm run dev
   ```

## ⚙️ Конфигурация

Приложение использует централизованную конфигурацию в `lib/config.ts`. Все настройки базы данных и приложения можно изменить там.

### Переменные окружения (опционально)

Создайте `.env.local` для переопределения настроек по умолчанию:

```bash
# Скопируйте пример
cp env.example .env.local

# Отредактируйте .env.local
```

### Доступные переменные:
- `MONGODB_URI` - URI подключения к MongoDB
- `MONGODB_DB_NAME` - Название базы данных
- `COLLECTION_NAME` - Название коллекции
- `JWT_SECRET` - Секретный ключ для JWT токенов
- `NEXT_PUBLIC_BASE_URL` - Базовый URL приложения

## 🗄️ База данных

### MongoDB
- **База данных:** `users` (по умолчанию)
- **Коллекция:** `users` (по умолчанию)

### Структура пользователя:
```json
{
  "user": "username",
  "email": "user@example.com",
  "password_hash": "hashed_password",
  "banks": [...],
  "plans": [...],
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## 📁 Структура проекта

```
src/
├── app/
│   ├── api/          # API роуты
│   ├── components/   # React компоненты
│   ├── context/      # React Context
│   ├── hooks/        # Кастомные хуки
│   ├── utils/        # Утилиты
│   └── ...
lib/
├── config.ts         # Централизованная конфигурация
└── ...
```

## 🤝 Разработка

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшн версии
npm start

# Линтинг
npm run lint
```

## 📝 Лицензия

MIT License
