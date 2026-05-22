/* Supabase конфигурация */
const SUPABASE_URL       = 'https://spxpityarnzjgrilymnl.supabase.co';
const SUPABASE_ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNweHBpdHlhcm56amdyaWx5bW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTU1NTcsImV4cCI6MjA5NDk5MTU1N30.00IYG_EDqJZY9v1_4R2R32rHro6sbhIOAaNP68mSIfk';

// ── Поля Supabase ────────────────────────────────────────────
const USERS_TABLE    = 'users';
const BOOKINGS_TABLE = 'bookings';
const PAYMENTS_TABLE = 'payments';
const ORDERS_TABLE   = 'orders';

// Инициализация клиента — вызывается автоматически при загрузке этого файла
async function initSupabase() {
  const SDK = window.supabase || window['@supabase/supabase-js'];
  if (!SDK) {
    console.warn('[Supabase] SDK не найден — работа в локальном режиме');
    return;
  }
  if (!window.supabaseClient) {
    try {
      window.supabaseClient = SDK.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true }
      });
      console.log('[Supabase] Подключен:', SUPABASE_URL);
    } catch (e) {
      console.error('[Supabase] Ошибка инициализации:', e.message);
    }
  }
}

// Запускаем сразу при загрузке config.js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabase);
} else {
  initSupabase();
}
