-- ============================================================
-- Схема для Supabase (PostgreSQL) — обновлённая версия
-- Включает: таблица classes, безопасные RLS-политики,
--           JSON Claim проверка на роль admin
-- ============================================================

-- ─── Таблица классов ─────────────────────────────────────────
create table if not exists classes (
  id        bigint primary key generated always as identity,
  name      text    not null,
  type      text    not null,
  day       text    not null,
  time      text    not null,
  room      text    default 'Основной зал',
  trainer   text,
  max_seats int     default 0,
  created_at timestamptz default now()
);

-- ─── Таблица пользователей ───────────────────────────────────
create table if not exists users (
  id            bigint      primary key,
  name          text        not null,
  email         text        unique not null,
  phone         text,
  subscription  jsonb,
  created_at    timestamptz default now()
);

-- ─── Таблица записей на тренировки ───────────────────────────
create table if not exists bookings (
  id         bigint      primary key generated always as identity,
  user_id    bigint      not null,
  class_name text        not null,
  day        text        not null,
  time       text        not null,
  name       text,
  phone      text,
  created_at timestamptz default now()
);

-- ─── Таблица платежей ────────────────────────────────────────
create table if not exists payments (
  id          bigint      primary key generated always as identity,
  user_id     bigint      not null,
  item        text,
  price       numeric,
  status      text        default 'Оплачено',
  created_at  timestamptz default now()
);

-- ─── Таблица заказов мерча ───────────────────────────────────
create table if not exists orders (
  id          bigint      primary key generated always as identity,
  user_id     bigint      not null,
  items       text,
  total       numeric,
  status      text        default 'Оплачено',
  created_at  timestamptz default now()
);

-- ─── Включаем RLS на все таблицы ─────────────────────────────
alter table users     enable row level security;
alter table classes   enable row level security;
alter table bookings  enable row level security;
alter table payments  enable row level security;
alter table orders    enable row level security;

-- ─── Вспомогательная функция: проверка является ли пользователь админом ──
-- Проверяет JSON Claim role в токене Supabase Auth
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ─── users ────────────────────────────────────────────────────
--    Анонимные пользователи могут читать все записи
drop policy if exists "users read anon" on users;
create policy "users read anon"
  on users for select
  using (true);

--    Авторизованные пользователи видят все профили
drop policy if exists "users read auth" on users;
create policy "users read auth"
  on users for select
  using (auth.uid() is not null);

--    Изменять могут только админы
drop policy if exists "users admin write" on users;
create policy "users admin write"
  on users for all
  using (is_admin())
  with check (is_admin());

-- ─── classes ──────────────────────────────────────────────────
--    Все могут читать расписание
drop policy if exists "classes read all" on classes;
create policy "classes read all"
  on classes for select
  using (true);

--    Изменять может только админ
drop policy if exists "classes admin write" on classes;
create policy "classes admin write"
  on classes for all
  using (is_admin())
  with check (is_admin());

-- ─── bookings ─────────────────────────────────────────────────
--    Запись на тренировку: авторизованный или анонимный пользователь может создать запись
drop policy if exists "bookings insert auth or anon" on bookings;
create policy "bookings insert auth or anon"
  on bookings for insert
  with check (true);

--    Читать все записи может любой авторизованный пользователь
drop policy if exists "bookings select auth" on bookings;
create policy "bookings select auth"
  on bookings for select
  using (auth.uid() is not null);

--    Удалять может только админ
drop policy if exists "bookings admin del" on bookings;
create policy "bookings admin del"
  on bookings for delete
  using (is_admin());

-- ─── payments ─────────────────────────────────────────────────

--    Читать может только админ
drop policy if exists "payments admin all" on payments;
create policy "payments admin all"
  on payments for all
  using (is_admin())
  with check (is_admin());

-- ─── orders ───────────────────────────────────────────────────

--    Читать может только админ
drop policy if exists "orders admin all" on orders;
create policy "orders admin all"
  on orders for all
  using (is_admin())
  with check (is_admin());

-- ┌─────────────────────────────────────────────────────────────┐
-- │ ПРИМЕЧАНИЕ ПО НАСТРОЙКЕ АДМИНА В SUPABASE:                  │
-- │                                                             │
-- │ В Supabase Dashboard → Authentication → Users выберите      │
-- │ админского пользователя → Edit → Add app_metadata JSON:     │
-- │                                                             │
-- │   { "role": "admin" }                                       │
-- │                                                             │
-- │ После этого политики выше автоматически предоставят         │
-- │ админу полный доступ к bookings, payments, orders и users.  │
-- └─────────────────────────────────────────────────────────────┘
