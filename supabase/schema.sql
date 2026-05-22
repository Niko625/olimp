-- ============================================================
-- Схема для Supabase (PostgreSQL)
-- ============================================================

-- ─── Таблица классов ─────────────────────────────────────────
create table if not exists classes (
  id         bigint primary key generated always as identity,
  name       text    not null,
  type       text    not null,
  day        text    not null,
  time       text    not null,
  room       text    default 'Основной зал',
  trainer    text,
  max_seats  int     default 0,
  created_at timestamptz default now()
);

-- ─── Таблица пользователей ───────────────────────────────────
create table if not exists users (
  id           bigint      primary key,
  name         text        not null,
  email        text        unique not null,
  phone        text,
  subscription jsonb,
  isAdmin      boolean     default false,
  role         text        default 'user',
  created_at   timestamptz default now()
);

-- ─── Таблица записей на тренировки ───────────────────────────
create table if not exists bookings (
  id          bigint      primary key generated always as identity,
  user_id     bigint      not null,
  class_name  text        not null,
  day         text        not null,
  time        text        not null,
  name        text,
  phone       text,
  created_at  timestamptz default now()
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

-- ─── is_admin: проверка роль из JWT claim ─────────────────────────
-- Поддерживает оба варианта: app_metadata (рекомендуемый) и корневой claim
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (auth.jwt() ->> 'role') = 'admin',
    false);
$$;

-- ═══ USERS ═══════════════════════════════════════════════════
-- Читать всем
drop policy if exists "users read all" on users;
create policy "users read all"
  on users for select using (true);

-- Записывать могут все (разрешаем регистрацию с сайта)
drop policy if exists "users insert all" on users;
create policy "users insert all"
  on users for insert with check (true);

-- Изменять/удалять только админ
drop policy if exists "users admin write" on users;
create policy "users admin write"
  on users for all
  using (is_admin())
  with check (is_admin());

-- ═══ CLASSES ═════════════════════════════════════════════════
drop policy if exists "classes read all" on classes;
create policy "classes read all"
  on classes for select using (true);

drop policy if exists "classes admin write" on classes;
create policy "classes admin write"
  on classes for all
  using (is_admin())
  with check (is_admin());

-- ═══ BOOKINGS ════════════════════════════════════════════════
drop policy if exists "bookings insert any" on bookings;
create policy "bookings insert any"
  on bookings for insert
  with check (true);

drop policy if exists "bookings select auth" on bookings;
create policy "bookings select auth"
  on bookings for select
  using (auth.uid() is not null);

drop policy if exists "bookings admin del" on bookings;
create policy "bookings admin del"
  on bookings for delete
  using (is_admin());

-- ═══ PAYMENTS ════════════════════════════════════════════════
drop policy if exists "payments admin all" on payments;
create policy "payments admin all"
  on payments for all
  using (is_admin())
  with check (is_admin());

-- ═══ ORDERS ═════════════════════════════════════════════════
drop policy if exists "orders admin all" on orders;
create policy "orders admin all"
  on orders for all
  using (is_admin())
  with check (is_admin());

-- ┌─────────────────────────────────────────────────────────────┐
-- │ Service role (выполняется через SDK / API ключ)             │
-- │ Политики выше с is_admin() работают для app-роли            │
-- └─────────────────────────────────────────────────────────────┘
