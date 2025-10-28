# 🚚 CargoTracker Local

> Система учёта грузоперевозок с локальным развёртыванием и интеграцией Yandex Cloud

## 📋 Описание проекта

CargoTracker Local - это современное приложение для управления грузоперевозками автомобильным транспортом. Приложение работает локально с веб-интерфейсом и интегрируется с облачными сервисами Yandex Cloud для синхронизации данных.

### ✨ Основные возможности

- 📦 **Управление грузоперевозками** - создание, редактирование, отслеживание рейсов
- 👨‍✈️ **База водителей** - управление персоналом
- 🚛 **Учёт транспорта** - регистрация и мониторинг транспортных средств
- 📊 **Статистика и отчёты** - аналитика по перевозкам
- 🔄 **Офлайн-режим** - работа без интернета с автоматической синхронизацией
- ☁️ **Облачная интеграция** - синхронизация с Yandex Cloud

## 🏗️ Архитектура

### Локальный стек
- **Frontend**: Vue.js 3 + Vite + Bootstrap 5
- **Backend**: Node.js + Express
- **База данных**: SQLite (для оффлайн кэша)
- **State Management**: Pinia

### Yandex Cloud сервисы
1. **Yandex Cloud Functions** - бизнес-логика
2. **Yandex Message Queue** - асинхронная обработка
3. **Yandex Cloud Databases (PostgreSQL)** - основное хранилище
4. **Yandex Lockbox** - хранение секретов
5. **Yandex Object Storage** - хранение документов

## 🚀 Быстрый старт (актуально)

### Предварительные требования

- Node.js 16+ 
- npm или yarn
- Git

### Установка

1. **Установите зависимости**
```bash
npm install
```

2. **Запустите приложение**
```bash
# Backend
npm run server

# Отдельно фронтенд (в новом окне терминала)
npm run client
```

Приложение будет доступно по адресу:
- Frontend: http://localhost:3000
- API Server: http://localhost:3001

## 📁 Структура проекта

```
cargotracker-local/
├── public/              # Статические файлы
│   ├── index.html      # HTML шаблон
│   └── sw.js           # Service Worker
├── src/                # Исходный код frontend
│   ├── components/     # Vue компоненты
│   │   ├── Home.vue
│   │   ├── Shipments.vue
│   │   ├── Drivers.vue
│   │   ├── Vehicles.vue
│   │   └── Statistics.vue
│   ├── stores/         # Pinia stores
│   │   └── shipments.js
│   ├── api/           # API клиенты
│   │   └── client.js
│   ├── App.vue        # Главный компонент
│   ├── main.js        # Точка входа
│   ├── router.js      # Vue Router
│   └── style.css      # Глобальные стили
├── server/            # Backend сервер
│   ├── local-server.js    # Express сервер
│   └── sync-manager.js    # Менеджер синхронизации
├── database/          # База данных
│   ├── setup.js       # Скрипт настройки БД
│   └── migrations/    # Миграции
├── config/            # Конфигурация
│   └── local-config.js
├── .env.example       # Пример настроек
├── package.json       # Зависимости
├── vite.config.js     # Конфигурация Vite
└── README.md          # Документация
```

## 🔧 Конфигурация

### Проверка
```bash
# Здоровье backend (показывает статус облака)
curl -s http://localhost:3001/api/health

# Список перевозок (онлайн/офлайн)
curl -s http://localhost:3001/api/shipments | jq .

# Тест загрузки в Object Storage
printf 'hello' | base64 > /tmp/payload.b64
curl -s -X POST http://localhost:3001/api/upload \
  -H 'Content-Type: application/json' \
  -d '{
    "bucket": "<bucket>",
    "key": "test/hello.txt",
    "contentBase64": "'"$(cat /tmp/payload.b64)"'",
    "contentType": "text/plain"
  }'
```

## 📖 Использование

### Управление грузоперевозками

1. Перейдите в раздел "Грузоперевозки"
2. Нажмите "Создать перевозку"
3. Заполните форму с данными о рейсе
4. Сохраните - данные автоматически синхронизируются с облаком

### Оффлайн работа

При отсутствии интернета:
- ✅ Все функции остаются доступными
- 💾 Данные сохраняются локально
- 🔄 Автоматическая синхронизация при восстановлении связи
- ⚠️ Индикатор оффлайн режима в навигации

### API Endpoints

```
GET    /api/health              - Статус системы
GET    /api/shipments           - Список перевозок
POST   /api/shipments           - Создать перевозку
PUT    /api/shipments/:id       - Обновить перевозку
DELETE /api/shipments/:id       - Удалить перевозку
GET    /api/statistics          - Статистика
GET    /api/sync/status         - Статус синхронизации
POST   /api/sync/force          - Принудительная синхронизация
```

## 🔄 Синхронизация

### Автоматическая синхронизация
- Выполняется каждые 5 минут (настраивается в `.env`)
- Синхронизирует отложенные операции
- Обновляет локальный кэш

### Ручная синхронизация
Нажмите кнопку "Синхронизировать" в навигационной панели

## 🛠️ Разработка

### Доступные команды

```bash
npm run dev         # Запуск в режиме разработки
npm run build       # Сборка для production
npm run preview     # Предпросмотр production сборки
npm run server      # Запустить только backend сервер
npm run client      # Запустить только frontend
npm run setup-db    # Настроить базу данных
```

### Технологический стек

**Frontend:**
- Vue.js 3 - прогрессивный JavaScript фреймворк
- Vite - быстрый build tool
- Pinia - state management
- Vue Router - маршрутизация
- Bootstrap 5 - UI framework
- Bootstrap Icons - иконки

**Backend:**
- Express.js - веб-фреймворк
- SQLite3 - локальная БД
- Axios - HTTP клиент
- node-cron - планировщик задач
- JWT - аутентификация

## 🔐 Безопасность

- 🔒 Секреты хранятся в Yandex Lockbox
- 🛡️ Helmet.js для защиты Express
- 🔑 JWT токены для аутентификации
- 📝 Валидация данных
- 🚫 CORS настроен

## 🐛 Отладка

### Логи сервера
Сервер выводит подробные логи в консоль:
```bash
npm run server
```

### Инструменты разработчика
- Vue DevTools для отладки компонентов
- Network tab для мониторинга запросов
- Console для ошибок JavaScript

## 📈 Производительность

- ⚡ Vite обеспечивает мгновенную горячую перезагрузку
- 💾 SQLite кэш ускоряет работу с данными
- 🔄 Service Worker кэширует статические ресурсы
- 📦 Code splitting для оптимизации загрузки
