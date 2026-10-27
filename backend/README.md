# Obsidian PC CLUB — Backend API
> Серверна частина системи автоматизованого управління кіберспортивним клубом нового покоління (навчальний аналог SENET Cloud).

**Розробник:** Максим (Backend Developer)  
**Технологічний стек:** Node.js, NestJS, TypeScript, PostgreSQL 16, Prisma ORM, Swagger/OpenAPI, Docker.  
**Етап проєкту:** Тиждень 1. Каркас (Схема і скелет API)

---

## 🎯 ТЗ Тиждень 1: Реалізовані вимоги

1. **База даних PostgreSQL (18 таблиць):**
   * `користувачі` (`users`)
   * `зони` (`zones`)
   * `місця` (`places`)
   * `тарифи` (`tariffs`)
   * `ремонти` (`repairs`)
   * `броні` (`bookings`)
   * `допи до броні` (`booking_extras`)
   * `сесії` (`sessions`)
   * `меню` (`menu`)
   * `замовлення` (`orders`)
   * `позиції замовлення` (`order_items`)
   * `журнал балансу` (`balance_ledger`)
   * `платежі` (`payments`)
   * `турніри` (`tournaments`)
   * `матчі` (`matches`)
   * `заявки` (`tournament_applications`)
   * `досягнення` (`achievements`)
   * `сповіщення` (`notifications`)

2. **Фіксовані Enum (відповідають ТЗ):**
   * **місце (`PlaceStatus`):** `'вільно'`, `'зайнято'`, `'бронь'`, `'ремонт'`
   * **оплата (`PaymentMethod`):** `'готівка'`, `'картка'`, `'баланс'`
   * **замовлення (`OrderStatus`):** `'new'`, `'preparing'`, `'issued'`
   * **турнір (`TournamentStatus`):** `'реєстрація'`, `'live'`, `'завершено'`

3. **Міграції:**
   * Створено міграцію `prisma/migrations/20261027000000_init_schema`, що розгортає всі типи та таблиці з нуля на чистій базі.

4. **OpenAPI / Swagger:**
   * Інтерактивна специфікація та DTO-контракти доступні за адресою `http://localhost:5000/api/docs`.

5. **Чистота кодової бази:**
   * Без Redis, без зовнішніх платіжних шлюзів, без зайвих процесів — виключно чистий та стабільний NestJS API.

---

## 🚀 Швидкий старт для команди (Setup Guide)

Ця інструкція призначена для **Розробника №1 (Admin Frontend)**, **Розробника №3 (Client Frontend / DevOps)** та всієї команди для розгортання бекенду за 3 хвилини.

### 1. Системні вимоги
* **Node.js:** версія `20.x` або вище (рекомендовано `22+ LTS`).
* **npm:** версія `10.x` або вище.
* **Docker Desktop** (запущений) або локальний PostgreSQL 16+.

---

### 2. Кроки встановлення та запуску

#### Крок 1: Перейдіть у папку бекенду
```bash
cd backend
```

#### Крок 2: Встановіть залежності
```bash
npm install
```

#### Крок 3: Запустіть базу даних PostgreSQL через Docker
Переконайтеся, що Docker Desktop запущено, і виконайте:
```bash
docker compose -f docker-compose.dev.yml up -d
```
> Контейнер `senet_postgres` підніметься у фоновому режимі на порту `5432`.

#### Крок 4: Застосуйте міграції БД та наповніть її тестовими даними (Seed)
```bash
# 1. Генерація типів Prisma Client
npm run db:generate

# 2. Застосування міграцій (створює всі 18 таблиць і 4 enum з нуля)
npx prisma migrate deploy

# Примітка: якщо база вже містила старі чернетки таблиць, для повного чистого перезапуску виконайте:
# npx prisma migrate reset --force

# 3. Наповнення бази демо-даними (зони PC/PS/VR, турніри, ачівки, бар, акаунти)
npm run db:seed
```

#### Крок 5: Запустіть сервер бекенду
```bash
# Режим розробки з автоперезавантаженням (Hot Reload)
npm run start:dev
```

---

## 📚 Інтерактивна документація API (Swagger)

Після запуску сервера вся документація з можливістю тестування прямо в браузері доступна тут:
* **Swagger UI:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **OpenAPI JSON схема:** [http://localhost:5000/api/docs-json](http://localhost:5000/api/docs-json) *(для імпорту в Postman або автогенерації типів фронтенду)*
* **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Тестові облікові записи (Пароль для всіх: `Password123!`)

| Роль | Email / Login | Рівень / Рамка | Призначення для тестування |
| :--- | :--- | :--- | :--- |
| **Власник (Owner)** | `owner@obsidianclub.ua` | Lvl 50 (`frame_gold_master`) | Фінансова аналітика, повні налаштування клубу |
| **Адміністратор (Admin)** | `admin@obsidianclub.ua` | Lvl 25 (`frame_cyber_admin`) | Карта залу, каса, скан QR-чекіну, пересадка клієнтів |
| **Клієнт 1 (Player)** | `player1@gmail.com` (`s1mple_pro`) | Lvl 18 (`frame_pro_sniper`) | Баланс 450 грн, розблоковані ачівки «Верблюд» та «Рання пташка» |
| **Клієнт 2 (Player)** | `player2@gmail.com` (`b1t_clutch`) | Lvl 12 (`frame_headshot_king`) | Баланс 180 грн, учасник турніру FC 24 |

---

## 🗄️ Візуальний перегляд бази даних (Prisma Studio)

Щоб переглядати таблиці, користувачів, турніри чи комп'ютери через веб-інтерфейс у браузері:
```bash
npm run db:studio
```
Інтерфейс відкриється за адресою: [http://localhost:5555](http://localhost:5555)


