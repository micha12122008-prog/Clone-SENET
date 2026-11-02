# OBSIDIAN PC CLUB — Клієнтський фронтенд (Тиждень 1. Каркас)

**Розробник:** Михайло (`client`, Docker Compose, GitHub Actions CI)  
**Стек:** React 19, TypeScript, Vite, Tailwind CSS.

## Що реалізовано в Тижні 1

1. **Каркас клієнта (`client/`):**
   - Підключено **Tailwind CSS** (`@tailwindcss/vite`).
   - **Заставка (Splash)** за вайрфреймом **OBSIDIAN PC CLUB** на чистому Tailwind CSS.
   - **Короткий онбординг (3 кроки)**: ігрові зони (PC / PS5 / VR), правила бронювання й пакет `3+1`, керування живою сесією, бар «Димочок» та турніри.
   - **Перемикач мови (`UA` / `EN`)** виключно для підписів оболонки (шапка, навігація оболонки, статус-бар). Основні тексти інтерфейсу — українською мовою.
   - **Клієнт OpenAPI скелета (`src/api/openapiClient.ts`)**: звертається до заглушок скелета OpenAPI (`/api/health`, `/api/settings/public`, `/api/zones`, `/api/tariffs`), підтримує підстановку JWT-токена та узгоджені Enum Тижня 1 (`PlaceStatus`, `PaymentMethod`, `OrderStatus`, `TournamentStatus`).

2. **Docker Compose (`docker-compose.yml` у корені репозиторію):**
   - Піднімає чотири сервіси: `postgres`, `backend`, `admin`, `client`.

3. **GitHub Actions CI (`.github/workflows/ci.yml` у корені репозиторію):**
   - На `push` та `pull_request` виконує `lint` і `build` усіх трьох частин (`client`, `admin`, `backend`).

## Локальний запуск клієнта

```bash
cd client
npm install
npm run dev
```

Перевірка лінтера та збірки:

```bash
npm run lint
npm run build
```

Запуск усього проєкту через Docker Compose з кореня репозиторію:

```bash
docker compose up --build
```
