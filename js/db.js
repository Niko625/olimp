/* ===== База данных: localStorage + Supabase (опционально) ===== */
const DB = {
  data: null,
  ready: null
};

const LS = {
  users: 'olimp_users',
  session: 'olimp_current_user',
  cart: 'olimp_cart',
  bookings: 'olimp_bookings',
  payments: 'olimp_payments',
  orders: 'olimp_orders'
};

/* ── Инициализация ── */
DB.ready = (async () => {
  const res = await fetch('data/olimp.json');
  if (!res.ok) throw new Error('Не удалось загрузить data/olimp.json');
  DB.data = await res.json();
  OLIMP.clubLat = DB.data.site.lat;
  OLIMP.clubLng = DB.data.site.lng;
  OLIMP.clubAddress = DB.data.site.address;
  return DB.data;
})();

function dbGet(path) {
  return path.split('.').reduce((o, k) => o?.[k], DB.data);
}

/* ── localStorage helpers ── */
function lsGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

/* ====================================================
   ПОЛЬЗОВАТЕЛИ
   ==================================================== */
function getUsers() { return lsGet(LS.users); }
function saveUsers(users) { lsSet(LS.users, users); }

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(LS.session) || 'null'); }
  catch { return null; }
}
function setCurrentUser(user) {
  if (user) localStorage.setItem(LS.session, JSON.stringify(user));
  else localStorage.removeItem(LS.session);
}

function isAdmin(user) {
  return user && (user.isAdmin === true || user.role === 'admin');
}

let _adminCache = null;
let _adminCacheTime = 0;
const ADMIN_CACHE_TTL = 5000; // 5 секунд

async function isAdminUser() {
  const user = getCurrentUser();
  if (isAdmin(user)) return true;

  if (window.supabaseClient && user?.email) {
    const now = Date.now();
    if (_adminCache && (now - _adminCacheTime) < ADMIN_CACHE_TTL) {
      return _adminCache;
    }
    try {
      const { data } = await window.supabaseClient
        .from('users').select('isAdmin,role').eq('email', user.email).single();
      const result = !!(data?.isAdmin || data?.role === 'admin');
      _adminCache = result;
      _adminCacheTime = now;
      return result;
    } catch { return false; }
  }
  return false;
}

/** Регистрация: пишет в localStorage + в Supabase (если подключен) */
async function registerUser({ name, email, phone, password }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) throw new Error('Email уже занят');
  const now = new Date().toISOString();
  const user = { id: Date.now(), name, email, phone, password, subscription: null, createdAt: now };
  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  console.log('[Register] localStorage обновлён для:', email);

  // Пишем в Supabase
  if (window.supabaseClient) {
    try {
      const payload = { id: user.id, name: user.name, email: user.email, phone: user.phone, created_at: user.createdAt };
      console.log('[Register] Отправка в Supabase:', payload);
      const { data, error } = await window.supabaseClient
        .from('users')
        .insert(payload)
        .select();
      if (error) {
        console.error('[Register] Supabase ошибка:', error.message, error.details, error.hint);
      } else {
        console.log('[Register] ✅ Записан в Supabase:', data);
      }
    } catch (e) {
      console.error('[Register] Supabase исключение:', e.message);
    }
  }
  return user;
}

/** Авторизация: проверяет localStorage (Supabase Auth отдельно, если нужен) */
function loginUser(login, password) {
  // Сначала проверяем localStorage
  const users = getUsers();
  const localUser = users.find(u => (u.email === login || u.phone === login) && u.password === password);
  if (localUser) {
    setCurrentUser(localUser);
    return localUser;
  }

  // Если не найден локально — проверяем Supabase Password Auth
  if (window.supabaseClient) {
    console.log('[Login] Пользователь не найден в localStorage, проверяем Supabase...');
    throw new Error('Пользователь не найден в локальной базе. Используйте Supabase Auth для входа.');
  }

  throw new Error('Неверные данные');
}

function updateCurrentUser(patch) {
  const user = getCurrentUser();
  if (!user) return;
  Object.assign(user, patch);
  setCurrentUser(user);
  const users = getUsers();
  const i = users.findIndex(u => u.id === user.id);
  if (i >= 0) users[i] = user;
  saveUsers(users);
}

/** Назначает пользователя админом (в localStorage) */
function makeAdmin(userId) {
  const users = getUsers();
  const i = users.findIndex(u => u.id === userId);
  if (i < 0) return null;
  users[i].isAdmin = true;
  users[i].role = 'admin';
  saveUsers(users);
  if (getCurrentUser()?.id === userId) setCurrentUser(users[i]);

  // Также пробуем обновить в Supabase
  if (window.supabaseClient) {
    window.supabaseClient.from('users').update({ isAdmin: true, role: 'admin' })
      .eq('id', userId).then(() => console.log('Роль админа сохранена в Supabase'))
      .catch(e => console.warn('Supabase makeAdmin:', e.message));
  }
  return users[i];
}

/* ====================================================
   КОРЗИНА
   ==================================================== */
function getCart() { return lsGet(LS.cart); }
function saveCart(cart) { lsSet(LS.cart, cart); updateCartBadge?.(); }

/* ====================================================
   ЗАПИСИ НА ТРЕНИРОВКИ
   ==================================================== */
function getBookings() {
  const raw = lsGet(LS.bookings);
  // Нормализуем ключи: поддерживаем и camelCase (локальные), и snake_case (из Supabase)
  return raw.map(b => ({
    id: b.id,
    userId: b.userId ?? b.user_id ?? null,
    userEmail: b.userEmail ?? b.email ?? '',
    className: b.className ?? b.class_name ?? '',
    day: b.day,
    time: b.time,
    name: b.name ?? b.clientName ?? '',
    phone: b.phone ?? b.clientPhone ?? '',
    date: b.date ?? ''
  }));
}

function addBooking(booking) {
  const normalized = {
    id: booking.id,
    userId: booking.userId ?? booking.user_id,
    userEmail: booking.userEmail ?? booking.email ?? '',
    className: booking.className ?? booking.class_name ?? '',
    day: booking.day,
    time: booking.time,
    name: booking.name,
    phone: booking.phone,
    date: booking.date || new Date().toLocaleDateString('ru-RU')
  };
  const list = getBookings();
  list.push(normalized);
  lsSet(LS.bookings, list);
  // Сохраняем в Supabase
  if (window.supabaseClient && normalized.userId) {
    window.supabaseClient.from('bookings').insert({
      user_id: normalized.userId,
      class_name: normalized.className,
      day: normalized.day,
      time: normalized.time,
      name: normalized.name,
      phone: normalized.phone,
      created_at: normalized.date ? new Date(normalized.date).toISOString() : new Date().toISOString()
    }).catch(e => console.warn('Supabase addBooking:', e.message));
  }
}

function getBookingsForUser(userId, userEmail) {
  return getBookings().filter(b => b.userId === userId || b.userEmail === userEmail);
}

function cancelBooking(bookingId) {
  const list = getBookings().filter(b => b.id !== bookingId);
  lsSet(LS.bookings, list);
  // Удаляем из Supabase
  if (window.supabaseClient) {
    window.supabaseClient.from('bookings').delete().eq('id', bookingId)
      .catch(e => console.warn('Supabase cancelBooking:', e.message));
  }
}

/* ====================================================
   ПЛАТЕЖИ
   ==================================================== */
function getPayments() { return lsGet(LS.payments); }

function addPayment(payment) {
  const list = getPayments();
  list.push(payment);
  lsSet(LS.payments, list);
  // Сохраняем в Supabase
  if (window.supabaseClient && payment.userId) {
    window.supabaseClient.from('payments').insert({
      user_id: payment.userId,
      item: payment.item,
      price: payment.price,
      status: payment.status || 'Оплачено'
    }).catch(e => console.warn('Supabase addPayment:', e.message));
  }
}

function getPaymentsForUser(userId) {
  return getPayments().filter(p => p.userId === userId);
}

/* ====================================================
   ЗАКАЗЫ МЕРЧА
   ==================================================== */
function getOrders() { return lsGet(LS.orders); }

function addOrder(order) {
  const list = getOrders();
  list.push(order);
  lsSet(LS.orders, list);
  // Сохраняем в Supabase
  if (window.supabaseClient && order.userId) {
    window.supabaseClient.from('orders').insert({
      user_id: order.userId,
      items: order.items,
      total: order.total,
      status: order.status || 'Оплачено'
    }).catch(e => console.warn('Supabase addOrder:', e.message));
  }
}

function getOrdersForUser(userId) {
  return getOrders().filter(o => o.userId === userId);
}

/* ====================================================
   КЛАССЫ РАСПИСАНИЯ (CRUD для админа)
   ==================================================== */
function getClasses() {
  return lsGet('olimp_classes', DB.data?.schedule ?? []);
}
function saveClasses(classes) { lsSet('olimp_classes', classes); }

function addAdminClass(cls) {
  const list = getClasses();
  list.push({ ...cls, id: Date.now() });
  saveClasses(list);
  // Сохраняем в Supabase
  if (window.supabaseClient) {
    window.supabaseClient.from('classes').insert({
      name: cls.name, type: cls.type, day: cls.day,
      time: cls.time, room: cls.room, trainer: cls.trainer, max_seats: cls.max_seats
    }).catch(e => console.warn('Supabase addAdminClass:', e.message));
  }
}

function updateAdminClass(clsId, patch) {
  const list = getClasses().map(c => c.id === clsId ? { ...c, ...patch } : c);
  saveClasses(list);
  if (window.supabaseClient) {
    window.supabaseClient.from('classes').update(patch).eq('id', clsId)
      .catch(e => console.warn('Supabase updateAdminClass:', e.message));
  }
}

function removeAdminClass(clsId) {
  saveClasses(getClasses().filter(c => c.id !== clsId));
  if (window.supabaseClient) {
    window.supabaseClient.from('classes').delete().eq('id', clsId)
      .catch(e => console.warn('Supabase removeAdminClass:', e.message));
  }
}
