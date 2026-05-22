/* ===== База данных: localStorage (локально, без облака) ===== */
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

function lsGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

/* --- Пользователи --- */
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

function registerUser({ name, email, phone, password }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) throw new Error('Email уже занят');
  const user = { id: Date.now(), name, email, phone, password, subscription: null, createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  return user;
}

function loginUser(login, password) {
  const users = getUsers();
  const user = users.find(u => (u.email === login || u.phone === login) && u.password === password);
  if (!user) throw new Error('Неверные данные');
  setCurrentUser(user);
  return user;
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

/* --- Админ-хелперы --- */
function makeAdmin(userId) {
  const users = getUsers();
  const i = users.findIndex(u => u.id === userId);
  if (i < 0) return null;
  users[i].isAdmin = true;
  users[i].role = 'admin';
  saveUsers(users);
  if (getCurrentUser()?.id === userId) setCurrentUser(users[i]);
  return users[i];
}

function isAdminUser() {
  return isAdmin(getCurrentUser());
}

/* --- Корзина --- */
function getCart() { return lsGet(LS.cart); }
function saveCart(cart) { lsSet(LS.cart, cart); updateCartBadge?.(); }

/* --- Записи и заказы --- */
function getBookings() { return lsGet(LS.bookings); }
function addBooking(booking) {
  booking.user_id = booking.userId || null;
  booking.userEmail = booking.userEmail || null;
  const list = getBookings();
  list.push(booking);
  lsSet(LS.bookings, list);
}
function getBookingsForUser(userId, userEmail) {
  return getBookings().filter(b => b.user_id === userId || b.userEmail === userEmail);
}
function cancelBooking(bookingId) {
  const list = getBookings().filter(b => b.id !== bookingId);
  lsSet(LS.bookings, list);
}

function getPayments() { return lsGet(LS.payments); }
function addPayment(payment) {
  payment.user_id = payment.userId || null;
  const list = getPayments();
  list.push(payment);
  lsSet(LS.payments, list);
}
function getPaymentsForUser(userId) {
  return getPayments().filter(p => p.user_id === userId);
}

function getOrders() { return lsGet(LS.orders); }
function addOrder(order) {
  order.user_id = order.userId || null;
  const list = getOrders();
  list.push(order);
  lsSet(LS.orders, list);
}
function getOrdersForUser(userId) {
  return getOrders().filter(o => o.user_id === userId);
}

/* --- Классы расписания (CRUD для админа) --- */
function getClasses() {
  return lsGet('olimp_classes', DB.data?.schedule ?? []);
}
function saveClasses(classes) { lsSet('olimp_classes', classes); }

function addAdminClass(cls) {
  const list = getClasses();
  list.push({ ...cls, id: Date.now() });
  saveClasses(list);
}

function updateAdminClass(clsId, patch) {
  const list = getClasses().map(c => c.id === clsId ? { ...c, ...patch } : c);
  saveClasses(list);
}

function removeAdminClass(clsId) {
  saveClasses(getClasses().filter(c => c.id !== clsId));
}

function lsGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

/* --- Пользователи --- */
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

async function registerUser({ name, email, phone, password }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) throw new Error('Email уже занят');
  const user = { id: Date.now(), name, email, phone, password, subscription: null, createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  if (window.supabaseClient) {
    const payload = { id: user.id, name: user.name, email: user.email, phone: user.phone, created_at: user.createdAt };
    // Если в таблице есть столбец password_hash — добавим его
    try {
      const { error } = await supabaseClient.from('users').insert(payload);
      if (error && error.message.includes('password_hash')) {
        await supabaseClient.from('users').insert({ ...payload, password_hash: password });
      }
    } catch (e) {
      console.warn('Supabase insert users:', e.message);
    }
  }
  return user;
}

async function loginUser(login, password) {
  const users = getUsers();
  const user = users.find(u => (u.email === login || u.phone === login) && u.password === password);
  if (!user) throw new Error('Неверные данные');
  setCurrentUser(user);
  return user;
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

/* --- Админ-хелперы --- */
function makeAdmin(userId) {
  const users = getUsers();
  const i = users.findIndex(u => u.id === userId);
  if (i < 0) return null;
  users[i].isAdmin = true;
  users[i].role = 'admin';
  saveUsers(users);
  if (getCurrentUser()?.id === userId) setCurrentUser(users[i]);
  return users[i];
}

function isAdminUser() {
  return isAdmin(getCurrentUser());
}

/* --- Корзина --- */
function getCart() { return lsGet(LS.cart); }
function saveCart(cart) { lsSet(LS.cart, cart); updateCartBadge?.(); }

/* --- Записи и заказы --- */
function getBookings() { return lsGet(LS.bookings); }
function addBooking(booking) {
  booking.user_id = booking.userId || null;
  booking.userEmail = booking.userEmail || null;
  const list = getBookings();
  list.push(booking);
  lsSet(LS.bookings, list);
}
function getBookingsForUser(userId, userEmail) {
  return getBookings().filter(b => b.user_id === userId || b.userEmail === userEmail);
}
function cancelBooking(bookingId) {
  const list = getBookings().filter(b => b.id !== bookingId);
  lsSet(LS.bookings, list);
}

function getPayments() { return lsGet(LS.payments); }
function addPayment(payment) {
  payment.user_id = payment.userId || null;
  const list = getPayments();
  list.push(payment);
  lsSet(LS.payments, list);
}
function getPaymentsForUser(userId) {
  return getPayments().filter(p => p.user_id === userId);
}

function getOrders() { return lsGet(LS.orders); }
function addOrder(order) {
  order.user_id = order.userId || null;
  const list = getOrders();
  list.push(order);
  lsSet(LS.orders, list);
}
function getOrdersForUser(userId) {
  return getOrders().filter(o => o.user_id === userId);
}

function addPayment(payment) {
  payment.user_id = payment.userId || null;
  const list = getPayments();
  list.push(payment);
  lsSet(LS.payments, list);
}

function addOrder(order) {
  order.user_id = order.userId || null;
  const list = getOrders();
  list.push(order);
  lsSet(LS.orders, list);
}
function getBookingsForUser(userId, userEmail) {
  return getBookings().filter(b => b.userId === userId || b.userEmail === userEmail);
}
function cancelBooking(bookingId) {
  const list = getBookings().filter(b => b.id !== bookingId);
  lsSet(LS.bookings, list);
}

function getPayments() { return lsGet(LS.payments); }
function addPayment(payment) {
  const list = getPayments();
  list.push(payment);
  lsSet(LS.payments, list);
}
function getPaymentsForUser(userId) {
  return getPayments().filter(p => p.userId === userId);
}

function getOrders() { return lsGet(LS.orders); }
function addOrder(order) {
  const list = getOrders();
  list.push(order);
  lsSet(LS.orders, list);
}
function getOrdersForUser(userId) {
  return getOrders().filter(o => o.userId === userId);
}

/* --- Классы расписания (CRUD для админа) --- */
function getClasses() {
  return lsGet('olimp_classes', DB.data?.schedule ?? []);
}
function saveClasses(classes) { lsSet('olimp_classes', classes); }

function addAdminClass(cls) {
  const list = getClasses();
  list.push({ ...cls, id: Date.now() });
  saveClasses(list);
}

function updateAdminClass(clsId, patch) {
  const list = getClasses().map(c => c.id === clsId ? { ...c, ...patch } : c);
  saveClasses(list);
}

function removeAdminClass(clsId) {
  saveClasses(getClasses().filter(c => c.id !== clsId));
}
