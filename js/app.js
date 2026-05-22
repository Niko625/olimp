/* ===== SPA: роутер и рендер страниц ===== */
const ROUTES = {
  home: renderHome,
  services: renderServices,
  trainers: renderTrainers,
  price: renderPrice,
  schedule: renderSchedule,
  shop: renderShop,
  cart: renderCart,
  about: renderAbout,
  contacts: renderContacts,
  login: renderLogin,
  register: renderRegister,
  profile: renderProfile,
  admin: renderAdmin
};

let scheduleFilter = 'all';

function $(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function visual(type, icon, extraClass = '') {
  return `<div class="visual visual--${type} ${extraClass}"><i class="fas ${icon}"></i></div>`;
}

function pageHero(title, subtitle) {
  return `<section class="page-hero"><div class="container" data-aos="fade-up">
    <h1>${title}</h1>
    ${subtitle ? `<p class="section-subtitle" style="margin:12px auto 0">${subtitle}</p>` : ''}
  </div></section>`;
}

function navigate(route) {
  if (route === 'profile' && !getCurrentUser()) route = 'login';
  if (route === 'admin' && !isAdminUser()) { showToast('Доступ запрещён', 'error'); route = 'profile'; }
  location.hash = `#/${route}`;
}

function getRoute() {
  const h = location.hash.replace('#/', '') || 'home';
  return ROUTES[h] ? h : 'home';
}

async function render() {
  const app = document.getElementById('app');
  const route = getRoute();
  document.querySelectorAll('.nav__link').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
  document.title = `${titles[route] || 'Олимп'} — СПОРТКОМПЛЕКС «ОЛИМП»`;
  app.innerHTML = '';
  const content = await ROUTES[route]();
  app.innerHTML = '';
  if (content instanceof DocumentFragment) {
    app.append(...content.children);
  } else {
    app.appendChild(content);
  }
  fixHtml(app);
  window.scrollTo(0, 0);
  if (typeof AOS !== 'undefined') AOS.refreshHard();
  afterRender(route);
}

function fixHtml() {}

const titles = {
  home: 'Главная', services: 'Услуги', trainers: 'Тренеры', price: 'Прайс',
  schedule: 'Расписание', shop: 'Мерч', cart: 'Корзина', about: 'О нас',
  contacts: 'Контакты', login: 'Вход', register: 'Регистрация', profile: 'Кабинет',
  admin: 'Админ-панель'
};

let adminTab = 'stats';

function afterRender(route) {
  initFAQ();
  if (route === 'home') initReviewsSwiper();
  if (route === 'schedule') bindSchedule();
  if (route === 'login') bindLogin();
  if (route === 'register') bindRegister();
  if (route === 'profile') bindProfile();
  if (route === 'admin') bindAdmin();
  if (route === 'contacts') {
    document.getElementById('geo-btn')?.addEventListener('click', showUserLocation);
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Сообщение отправлено!');
      e.target.reset();
    });
  }
  bindTrainerForm();
  updateHeaderAuth();
  updateCartBadge();
}

function bindTrainerForm() {
  const form = document.getElementById('trainer-book-form');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal('trainer-modal');
    showToast('Заявка отправлена! Мы свяжемся с вами.');
    form.reset();
  });
}

function updateHeaderAuth() {
  const user = getCurrentUser();
  const loginBtn = document.getElementById('hdr-login');
  const regBtn = document.getElementById('hdr-register');
  const profileBtn = document.getElementById('hdr-profile');
  const navLogin = document.getElementById('nav-login');
  const navRegister = document.getElementById('nav-register');
  if (user) {
    loginBtn?.classList.add('hidden');
    regBtn?.classList.add('hidden');
    navLogin?.classList.add('hidden');
    navRegister?.classList.add('hidden');
    profileBtn?.classList.remove('hidden');
  } else {
    loginBtn?.classList.remove('hidden');
    regBtn?.classList.remove('hidden');
    navLogin?.classList.remove('hidden');
    navRegister?.classList.remove('hidden');
    profileBtn?.classList.add('hidden');
  }
}

/* ---------- HOME ---------- */
function renderHome() {
  const d = DB.data;
  const benefits = d.benefits.map(b => `
    <article class="glass-card benefit-card" data-aos="fade-up">
      <div class="benefit-card__icon"><i class="fas ${b.icon}"></i></div>
      <h3>${b.title}</h3><p>${b.text}</p>
    </article>`).join('');

  const services = d.services.slice(0, 3).map(s => `
    <article class="glass-card service-card" data-aos="fade-up">
      ${visual(s.visual, s.icon, 'service-card__img')}
      <div class="service-card__body"><h3>${s.title}</h3><p>${s.short}</p>
      <button class="btn btn-primary btn-sm" data-route="services">Подробнее</button></div>
    </article>`).join('');

  const reviews = d.reviews.map(r => `
    <div class="swiper-slide"><div class="glass-card review-card">
      <div class="review-card__stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      <p class="review-card__text">«${r.text}»</p>
      <p class="review-card__author">${r.author}</p><p class="review-card__role">${r.role}</p>
    </div></div>`).join('');

  const faq = d.faq.map(f => `
    <div class="faq-item"><button class="faq-question">${f.q} <i class="fas fa-chevron-down"></i></button>
    <div class="faq-answer"><p>${f.a}</p></div></div>`).join('');

  const html = `
    <div class="page-home">
      <section class="hero">
        ${visual('gym', 'fa-dumbbell', 'hero__bg')}
        <div class="hero__overlay"></div>
        <div class="container hero__content">
          <h1 class="hero__title">СПОРТКОМПЛЕКС<br><span>«ОЛИМП»</span></h1>
          <p class="hero__slogan">${d.site.slogan}</p>
          <div class="hero__buttons">
            <button class="btn btn-primary" data-route="register"><i class="fas fa-user-plus"></i> Записаться</button>
            <button class="btn btn-outline" data-route="price"><i class="fas fa-id-card"></i> Купить карту</button>
          </div>
        </div>
      </section>
      <section class="section"><div class="container">
        <h2 class="section-title" data-aos="fade-up">Почему выбирают нас</h2>
        <p class="section-subtitle" data-aos="fade-up">Премиальный фитнес-клуб с полным спектром услуг для ваших целей</p>
        <div class="benefits-grid">${benefits}</div>
      </div></section>
      <section class="section" style="background:var(--bg-secondary)"><div class="container">
        <h2 class="section-title" data-aos="fade-up">Популярные услуги</h2>
        <p class="section-subtitle" data-aos="fade-up">Выберите направление для достижения ваших целей</p>
        <div class="services-grid">${services}</div>
        <div style="text-align:center;margin-top:32px" data-aos="fade-up"><button class="btn btn-outline" data-route="services">Все услуги</button></div>
      </div></section>
      <section class="section reviews-section"><div class="container">
        <h2 class="section-title" data-aos="fade-up">Отзывы клиентов</h2>
        <p class="section-subtitle" data-aos="fade-up">Реальные истории наших клиентов</p>
        <div class="swiper reviews-swiper"><div class="swiper-wrapper">${reviews}</div>
        <div class="swiper-pagination"></div></div>
      </div></section>
      <section class="section"><div class="container">
        <h2 class="section-title" data-aos="fade-up">Частые вопросы</h2>
        <div class="faq-list">${faq}</div>
      </div></section>
      <section class="section" style="background:var(--bg-secondary)"><div class="container">
        <h2 class="section-title" data-aos="fade-up">Как нас найти</h2>
        <div class="map-section" data-aos="fade-up">
          <div class="map-container"><iframe src="https://yandex.ru/map-widget/v1/?ll=${d.site.lng}%2C${d.site.lat}&z=16&pt=${d.site.lng}%2C${d.site.lat}%2Cpm2rdm" loading="lazy"></iframe></div>
          <div class="glass-card contact-info"><h3>Контакты</h3>
            <div class="contact-item"><i class="fas fa-map-marker-alt"></i><span>${d.site.address}</span></div>
            <div class="contact-item"><i class="fas fa-phone"></i><span>${d.site.phone}</span></div>
            <div class="contact-item"><i class="fas fa-envelope"></i><span>${d.site.email}</span></div>
            <div class="contact-item"><i class="fas fa-clock"></i><span>${d.site.hours}</span></div>
            <button class="btn btn-primary" data-route="contacts" style="margin-top:16px">Все контакты</button>
          </div>
        </div>
      </div></section>
    </div>`;
  const t = document.createElement('template');
  t.innerHTML = html;
  return t.content;
}

function initReviewsSwiper() {
  if (typeof Swiper === 'undefined' || !document.querySelector('.reviews-swiper')) return;
  new Swiper('.reviews-swiper', {
    slidesPerView: 1, spaceBetween: 24, loop: true,
    autoplay: { delay: 5000 },
    pagination: { el: '.swiper-pagination', clickable: true },
    breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
  });
}

/* ---------- SERVICES ---------- */
function renderServices() {
  const cards = DB.data.services.map(s => `
    <article class="glass-card service-card" data-aos="fade-up">
      ${visual(s.visual, s.icon, 'service-card__img')}
      <div class="service-card__body">
        <h3>${s.title}</h3>
        <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:8px">${s.short}</p>
        <p>${s.desc}</p>
        <button class="btn btn-primary btn-sm" data-service="${s.id}" style="margin-top:16px">Подробнее</button>
      </div>
    </article>`).join('');
  const t = document.createElement('template');
  t.innerHTML = pageHero('Наши услуги', 'Полный спектр тренировок для любого уровня подготовки') +
    `<section class="section"><div class="container"><div class="services-grid">${cards}</div></div></section>`;
  const el = t.content;
  el.querySelectorAll('[data-service]').forEach(btn => {
    btn.addEventListener('click', () => openServiceModal(btn.dataset.service));
  });
  return el;
}

function openServiceModal(id) {
  const s = DB.data.services.find(x => x.id === id);
  if (!s) return;
  document.getElementById('service-modal-title').textContent = s.title;
  document.getElementById('service-modal-desc').textContent = s.desc;
  const box = document.getElementById('service-modal-visual');
  box.className = `visual visual--${s.visual} modal-visual`;
  box.innerHTML = `<i class="fas ${s.icon}"></i>`;
  // Кнопка "Записаться": если вошёл — на расписание, если нет — на регистрацию
  const btn = document.getElementById('service-modal-cta');
  if (btn) {
    const user = getCurrentUser();
    btn.innerHTML = user ? '<i class="fas fa-calendar-check"></i> Записаться' : '<i class="fas fa-user-plus"></i> Зарегистрироваться';
    btn.onclick = () => {
      closeModal('service-modal');
      if (user) navigate('schedule');
      else navigate('register');
    };
  }
  openModal('service-modal');
}

/* ---------- TRAINERS ---------- */
function renderTrainers() {
  const cards = DB.data.trainers.map(t => `
    <article class="glass-card trainer-card" data-aos="fade-up">
      <div class="trainer-card__photo avatar-visual visual--${t.visual}">${t.initials}</div>
      <div class="trainer-card__body"><h3>${t.name}</h3>
      <p class="trainer-card__spec">${t.spec}</p><p class="trainer-card__exp">Стаж: ${t.exp}</p>
      <p style="color:var(--text-secondary)">${t.desc}</p>
      <button class="btn btn-primary btn-sm" data-trainer="${t.name}">Записаться к тренеру</button></div>
    </article>`).join('');
  const t = document.createElement('template');
  t.innerHTML = pageHero('Наши тренеры', 'Профессионалы с международными сертификатами и опытом от 5 лет') +
    `<section class="section"><div class="container"><div class="trainers-grid">${cards}</div></div></section>`;
  const el = t.content;
  el.querySelectorAll('[data-trainer]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('trainer-modal-name').textContent = btn.dataset.trainer;
      document.getElementById('trainer-book-name').value = btn.dataset.trainer;
      openModal('trainer-modal');
    });
  });
  return el;
}

/* ---------- PRICE ---------- */
function renderPrice() {
  const cards = DB.data.prices.map(p => `
    <div class="glass-card price-card ${p.featured ? 'featured' : ''}" data-aos="fade-up">
      ${p.badge ? `<span class="price-card__badge">${p.badge}</span>` : ''}
      <h3 class="price-card__name">${p.name}</h3>
      <p class="price-card__price">${formatPrice(p.price)} <small>₽${p.period || ''}</small></p>
      <ul class="price-card__features">${p.features.map(f => `<li><i class="fas fa-check"></i>${f}</li>`).join('')}</ul>
      <button class="btn btn-primary btn-block" data-pay="${p.name}" data-price="${p.price}">Оплатить</button>
    </div>`).join('');
  const t = document.createElement('template');
  t.innerHTML = pageHero('Прайс и абонементы', 'Выберите подходящий тариф или начните с пробного занятия') +
    `<section class="section"><div class="container"><div class="price-grid">${cards}</div></div></section>`;
  const el = t.content;
  el.querySelectorAll('[data-pay]').forEach(btn => {
    btn.addEventListener('click', () => openPayment(btn.dataset.pay, +btn.dataset.price, 'subscription'));
  });
  return el;
}

/* ---------- SCHEDULE ---------- */
function renderSchedule() {
  const t = document.createElement('template');
  t.innerHTML = pageHero('Расписание тренировок', 'Запишитесь на занятие в один клик — данные сохраняются в личном кабинете') + `
    <section class="section"><div class="container">
      <div class="schedule-filters">
        <button class="filter-btn ${scheduleFilter === 'all' ? 'active' : ''}" data-f="all">Все</button>
        <button class="filter-btn ${scheduleFilter === 'yoga' ? 'active' : ''}" data-f="yoga">Йога</button>
        <button class="filter-btn ${scheduleFilter === 'strength' ? 'active' : ''}" data-f="strength">Силовые</button>
        <button class="filter-btn ${scheduleFilter === 'pool' ? 'active' : ''}" data-f="pool">Бассейн</button>
      </div>
      <div class="schedule-table-wrap glass-card"><table class="schedule-table">
        <thead><tr><th>Время</th><th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th></tr></thead>
        <tbody id="schedule-body"></tbody>
      </table></div>
    </div></section>`;
  const el = t.content;
  el.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => {
    scheduleFilter = b.dataset.f;
    render();
  }));
  return el;
}

function bindSchedule() {
  const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const TIMES = [...new Set(DB.data.schedule.map(c => c.time))].sort();
  const filtered = scheduleFilter === 'all' ? DB.data.schedule : DB.data.schedule.filter(c => c.type === scheduleFilter);
  const tbody = document.getElementById('schedule-body');
  if (!tbody) return;
  tbody.innerHTML = TIMES.map(time => {
    const cells = DAYS.map(day => {
      const classes = filtered.filter(c => c.day === day && c.time === time);
      if (!classes.length) return '<td>—</td>';
      return `<td>${classes.map(c =>
        `<span class="schedule-class ${c.type}" data-class="${c.name}" data-day="${day}" data-time="${time}">${c.name}</span>`
      ).join('')}</td>`;
    }).join('');
    return `<tr><td><strong>${time}</strong></td>${cells}</tr>`;
  }).join('');
  tbody.querySelectorAll('.schedule-class').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('booking-info').innerHTML = `<p><strong>${el.dataset.class}</strong></p><p style="color:var(--text-secondary)">${el.dataset.day}, ${el.dataset.time}</p>`;
      const modal = document.getElementById('booking-modal');
      modal.dataset.className = el.dataset.class;
      modal.dataset.day = el.dataset.day;
      modal.dataset.time = el.dataset.time;
      openModal('booking-modal');
    });
  });
  const form = document.getElementById('booking-form');
  if (form && !form.dataset.bound) {
    form.dataset.bound = '1';
    form.addEventListener('submit', onBookingSubmit);
  }
}

function onBookingSubmit(e) {
  e.preventDefault();
  const modal = document.getElementById('booking-modal');
  const user = getCurrentUser();
  const form = e.target;
  addBooking({
    id: Date.now(),
    className: modal.dataset.className,
    day: modal.dataset.day,
    time: modal.dataset.time,
    userId: user?.id,
    userEmail: user?.email,
    name: form.name.value || user?.name,
    phone: form.phone.value || user?.phone,
    date: new Date().toLocaleString('ru-RU')
  });
  closeModal('booking-modal');
  showToast('Вы записаны на тренировку!');
  form.reset();
}

/* ---------- SHOP & CART ---------- */
function renderShop() {
  const cards = DB.data.products.map(p => `
    <article class="glass-card product-card" data-aos="fade-up">
      ${visual(p.visual, p.icon, 'product-card__img')}
      <div class="product-card__body"><span style="color:var(--accent-purple);font-size:0.8rem">${p.category}</span>
      <h3>${p.name}</h3><p style="color:var(--text-secondary);font-size:0.85rem">${p.desc}</p>
      <p class="product-card__price">${formatPrice(p.price)} ₽</p>
      <button class="btn btn-primary btn-block" data-add="${p.id}"><i class="fas fa-cart-plus"></i> В корзину</button>
      </div>
    </article>`).join('');
  const t = document.createElement('template');
  t.innerHTML = pageHero('Мерч Олимп', 'Официальная экипировка и аксессуары клуба — 12 товаров') +
    `<section class="section"><div class="container"><div class="shop-grid">${cards}</div></div></section>`;
  const el = t.content;
  el.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addProductToCart(+btn.dataset.add));
  });
  return el;
}

function addProductToCart(id) {
  const p = DB.data.products.find(x => x.id === id);
  const cart = getCart();
  const ex = cart.find(i => i.id === id);
  if (ex) ex.qty++; else cart.push({ ...p, qty: 1 });
  saveCart(cart);
  showToast(`${p.name} добавлен в корзину`);
}

function renderCart() {
  const cart = getCart();
  let total = 0;
  const items = cart.length ? cart.map(item => {
    const sum = item.price * item.qty;
    total += sum;
    return `<div class="glass-card cart-item">
      ${visual(item.visual, item.icon, 'cart-item__img')}
      <div class="cart-item__info"><h3>${item.name}</h3><p>${formatPrice(item.price)} ₽</p></div>
      <div class="cart-item__qty">
        <button class="qty-btn" data-qty="${item.id}" data-d="-1">−</button><span>${item.qty}</span>
        <button class="qty-btn" data-qty="${item.id}" data-d="1">+</button>
      </div>
      <strong>${formatPrice(sum)} ₽</strong>
      <button class="qty-btn" data-rm="${item.id}"><i class="fas fa-trash"></i></button>
    </div>`;
  }).join('') : '<div class="empty-state glass-card"><p>Корзина пуста</p><button class="btn btn-primary" data-route="shop">В магазин</button></div>';

  const t = document.createElement('template');
  t.innerHTML = pageHero('Корзина', 'Оформление заказа с сохранением в личном кабинете') + `
    <section class="section"><div class="container cart-layout">
      <div id="cart-list">${items}</div>
      <div class="glass-card cart-summary"><h3>Итого</h3>
        <div class="cart-summary__row"><span>Сумма</span><strong class="cart-summary__total">${formatPrice(total)} ₽</strong></div>
        <button id="checkout-btn" class="btn btn-primary btn-block" ${!cart.length ? 'disabled' : ''}>Оформить заказ</button>
        <button class="btn btn-outline btn-block" data-route="shop" style="margin-top:12px">Продолжить покупки</button>
      </div>
    </div></section>`;
  const el = t.content;
  el.querySelectorAll('[data-qty]').forEach(b => b.addEventListener('click', () => {
    changeCartQty(+b.dataset.qty, +b.dataset.d);
    render();
  }));
  el.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
    saveCart(getCart().filter(i => i.id !== +b.dataset.rm));
    render();
  }));
  el.querySelector('#checkout-btn')?.addEventListener('click', checkout);
  return el;
}

function changeCartQty(id, d) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += d;
  saveCart(item.qty > 0 ? cart : cart.filter(i => i.id !== id));
}

function checkout() {
  const cart = getCart();
  if (!cart.length) return;
  const user = getCurrentUser();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  addOrder({ id: Date.now(), items: cart.map(i => `${i.name}×${i.qty}`).join(', '), price: total, total, userId: user?.id, date: new Date().toLocaleString('ru-RU'), status: 'Оплачено' });
  saveCart([]);
  showToast('Заказ оформлен!');
  navigate('profile');
}

/* ---------- ABOUT & CONTACTS ---------- */
function renderAbout() {
  const a = DB.data.about;
  const stats = a.stats.map(s => `<div class="glass-card stat-card" data-aos="zoom-in"><div class="stat-card__number">${s.value}</div><div class="stat-card__label">${s.label}</div></div>`).join('');
  const zones = a.zones.map(z => `<div class="zone-card glass-card">${visual(z.visual, z.icon)}<h4 style="padding:0 16px 16px">${z.title}</h4></div>`).join('');
  const advantages = (a.advantages || []).map(ad => `
    <div class="glass-card benefit-card"><div class="benefit-card__icon"><i class="fas ${ad.icon}"></i></div>
    <h3>${ad.title}</h3><p>${ad.text}</p></div>`).join('');
  const t = document.createElement('template');
  t.innerHTML = pageHero('О комплексе «Олимп»', 'С 2010 года меняем жизни через спорт') + `
    <section class="section"><div class="container">
      <div class="about-grid">
        <div data-aos="fade-right"><h2 class="section-title" style="text-align:left">Наша история</h2>
        <p style="color:var(--text-secondary);margin-bottom:16px">${a.history}</p>
        <p style="color:var(--text-secondary)"><strong>Миссия:</strong> ${a.mission}</p></div>
        ${visual('gym', 'fa-building', 'about-visual')}
      </div>
      <div class="stats-grid">${stats}</div>
      ${advantages ? `<h2 class="section-title">Преимущества</h2><div class="benefits-grid">${advantages}</div>` : ''}
      <h2 class="section-title">Зоны комплекса</h2>
      <div class="gallery-grid">${zones}</div>
      <div class="deploy-note" data-aos="fade-up"><h3></h3><ul>
        
    </div></section>`;
  return t.content;
}

function renderContacts() {
  const s = DB.data.site;
  const t = document.createElement('template');
  t.innerHTML = pageHero('Контакты', 'Свяжитесь с нами или постройте маршрут до клуба') + `
    <section class="section"><div class="container map-section">
      <div class="map-container"><iframe src="https://yandex.ru/map-widget/v1/?ll=${s.lng}%2C${s.lat}&z=16&pt=${s.lng}%2C${s.lat}%2Cpm2rdm" allowfullscreen loading="lazy"></iframe></div>
      <div class="glass-card contact-info"><h3>Контактная информация</h3>
        <div class="contact-item"><i class="fas fa-map-marker-alt"></i><span>${s.address}</span></div>
        <div class="contact-item"><i class="fas fa-phone"></i><span>${s.phone}</span></div>
        <div class="contact-item"><i class="fas fa-envelope"></i><span>${s.email}</span></div>
        <div class="contact-item"><i class="fas fa-clock"></i><span>${s.hours}</span></div>
        <div class="footer__social" style="margin-top:20px">
          <a href="#" aria-label="VK"><i class="fab fa-vk"></i></a>
          <a href="#" aria-label="Telegram"><i class="fab fa-telegram"></i></a>
          <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        </div>
        <button id="geo-btn" class="btn btn-primary" style="margin-top:20px"><i class="fas fa-location-arrow"></i> Показать моё местоположение</button>
        <div id="geo-result" style="margin-top:16px;color:var(--text-secondary)"></div>
      </div>
    </div></section>
    <section class="section" style="padding-top:0"><div class="container">
      <div class="glass-card" style="max-width:600px;margin:0 auto">
        <h2 style="text-align:center;margin-bottom:24px">Форма обратной связи</h2>
        <form id="contact-form">
          <div class="form-group"><label>Имя</label><input name="name" required placeholder="Ваше имя"></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" required placeholder="email@example.com"></div>
          <div class="form-group"><label>Сообщение</label><textarea name="message" rows="4" required placeholder="Ваш вопрос..."></textarea></div>
          <button type="submit" class="btn btn-primary btn-block">Отправить</button>
        </form>
      </div>
    </div></section>`;
  return t.content;
}

/* ---------- AUTH ---------- */
function renderLogin() {
  const t = document.createElement('template');
  t.innerHTML = `
    <section class="auth-view section"><div class="container" style="max-width:440px;position:relative">
      <button class="auth-close auth-close--inline" id="auth-close" type="button" aria-label="Закрыть"><i class="fas fa-times"></i></button>
      <div class="glass-card auth-card">
        <h2 style="text-align:center;margin-bottom:8px">Вход в личный кабинет</h2>
        <p style="text-align:center;color:var(--text-secondary);margin-bottom:24px;font-size:0.9rem">Email или телефон и пароль</p>
        <form id="login-form">
          <div class="form-group"><label>Email или телефон</label><input name="login" required placeholder="email@example.com"></div>
          <div class="form-group"><label>Пароль</label><input type="password" name="password" required placeholder="••••••"></div>
          <button type="submit" class="btn btn-primary btn-block">Войти</button>
        </form>
        <p class="auth-link">Нет аккаунта? <a href="#/register">Зарегистрироваться</a></p>
        <button type="button" class="auth-back-link btn btn-outline btn-block" data-route="home" style="margin-top:12px"><i class="fas fa-arrow-left"></i> На главную</button>
      </div>
    </div></section>`;
  return t.content;
}

function renderRegister() {
  const t = document.createElement('template');
  t.innerHTML = `
    <section class="auth-view section"><div class="container" style="max-width:440px;position:relative">
      <button class="auth-close auth-close--inline" id="auth-close" type="button" aria-label="Закрыть"><i class="fas fa-times"></i></button>
      <div class="glass-card auth-card">
        <h2 style="text-align:center;margin-bottom:8px">Регистрация</h2>
        <p style="text-align:center;color:var(--text-secondary);margin-bottom:24px;font-size:0.9rem">Создайте аккаунт для записи и покупок</p>
        <form id="register-form">
          <div class="form-group"><label>Имя</label><input name="name" required placeholder="Ваше имя"></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" required placeholder="email@example.com"></div>
          <div class="form-group"><label>Телефон</label><input name="phone" required placeholder="+7 (999) 000-00-00"></div>
          <div class="form-group"><label>Пароль</label><input type="password" name="password" minlength="6" required placeholder="Минимум 6 символов"></div>
          <button type="submit" class="btn btn-primary btn-block">Создать аккаунт</button>
        </form>
        <p class="auth-link">Уже есть аккаунт? <a href="#/login">Войти</a></p>
        <button type="button" class="auth-back-link btn btn-outline btn-block" data-route="home" style="margin-top:12px"><i class="fas fa-arrow-left"></i> На главную</button>
      </div>
    </div></section>`;
  return t.content;
}

function bindLogin() {
  bindAuthClose();
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await loginUser(e.target.login.value.trim().toLowerCase(), e.target.password.value);
      showToast('Добро пожаловать!');
      navigate('profile');
    } catch (err) { showToast(err.message, 'error'); }
  });
}

function bindRegister() {
  bindAuthClose();
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await registerUser({ name: f.name.value.trim(), email: f.email.value.trim().toLowerCase(), phone: f.phone.value.trim(), password: f.password.value });
      showToast('Регистрация успешна!');
      navigate('profile');
    } catch (err) { showToast(err.message, 'error'); }
  });
}

function bindAuthClose() {
  const close = () => navigate('home');
  document.getElementById('auth-close')?.addEventListener('click', close);
  document.querySelectorAll('.auth-back-link').forEach(b => b.addEventListener('click', close));
}

function renderProfile() {
  const user = getCurrentUser();
  if (!user) { navigate('login'); return document.createDocumentFragment(); }
  const adminLink = isAdmin(user)
    ? `<button class="btn btn-primary btn-sm" data-route="admin" style="margin-top:16px"><i class="fas fa-tachometer-alt"></i> Админ-панель</button>`
    : '';
  const t = document.createElement('template');
  t.innerHTML = pageHero('Личный кабинет', `Добро пожаловать, ${user.name}`) + `
    <section class="section" id="profile-content"><div class="container profile-grid">
      <aside class="glass-card profile-sidebar">
        <div class="profile-avatar" id="profile-avatar">${user.name.charAt(0)}</div>
        <h3 id="profile-name">${user.name}</h3>
        <p id="profile-email" style="color:var(--text-secondary)">${user.email}</p>
        <p id="profile-phone" style="color:var(--text-secondary);font-size:0.85rem">${user.phone}</p>
        ${adminLink}
        <button id="logout-btn" class="btn btn-outline btn-block" style="margin-top:20px">Выход</button>
      </aside>
      <main>
        <div class="profile-section glass-card"><h3>Активный абонемент</h3><div id="profile-subscription"></div></div>
        <div class="profile-section"><h3>История заказов</h3><div id="profile-orders"></div></div>
        <div class="profile-section"><h3>Записи на тренировки</h3><div id="profile-bookings"></div></div>
      </main>
    </div></section>`;
  return t.content;
}

function bindProfile() {
  const user = getCurrentUser();
  const sub = document.getElementById('profile-subscription');
  if (sub) {
    sub.innerHTML = user.subscription
      ? `<span class="subscription-badge">${user.subscription.name}</span><p style="margin-top:12px;color:var(--text-secondary)">Действует до: ${user.subscription.until}</p>`
      : `<p style="color:var(--text-secondary)">Нет активного абонемента.</p><button class="btn btn-primary btn-sm" data-route="price" style="margin-top:12px">Выбрать тариф</button>`;
  }
  renderProfileLists();
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    setCurrentUser(null);
    showToast('Вы вышли из аккаунта');
    navigate('home');
  });
}

function renderProfileLists() {
  const orders = document.getElementById('profile-orders');
  const bookings = document.getElementById('profile-bookings');
  const user = getCurrentUser();
  // Страница профиля: показываем ТОЛЬКО данные текущего аккаунта
  const myPayments = user ? getPaymentsForUser(user.id) : [];
  const myOrders = user ? getOrdersForUser(user.id) : [];
  const all = [...myPayments, ...myOrders].sort((a, b) => b.id - a.id);
  orders.innerHTML = all.length ? all.map(o => `
    <div class="order-item"><div><strong>${o.item || o.items}</strong>
    <p style="color:var(--text-secondary);font-size:0.85rem">${o.date}</p></div>
    <div><span>${formatPrice(o.price || o.total)} ₽</span> <span class="status-paid">${o.status || 'Оплачено'}</span></div></div>`).join('')
    : '<p class="empty-state">Заказов пока нет</p>';
  const bks = getBookingsForUser(user?.id, user?.email);
  bookings.innerHTML = bks.length ? bks.map(b => `
    <div class="booking-item" data-bid="${b.id}"><div><strong>${b.className}</strong>
    <p style="color:var(--text-secondary);font-size:0.85rem">${b.day} · ${b.time}</p></div>
    <button class="btn btn-outline btn-sm cancel-booking-btn" data-bid="${b.id}">Отменить</button></div>`).join('')
    : '<p class="empty-state">Записей на тренировки нет</p>';
  // привязываем отмену в личном кабинете
  document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
    btn.addEventListener('click', () => { cancelBooking(+btn.dataset.bid); showToast('Запись отменена'); renderProfileLists(); });
  });
}

/* ========== АДМИН-ПАНЕЛЬ ========== */

const ADMIN_TABS = {
  stats:    { label: 'Сводка',       icon: 'fa-chart-line' },
  users:    { label: 'Пользователи', icon: 'fa-users' },
  classes:  { label: 'Расписание',   icon: 'fa-calendar-alt' },
  bookings: { label: 'Записи',       icon: 'fa-book' }
};

function switchAdminTab(tab) {
  adminTab = tab;
  if (location.hash !== '#/admin') location.hash = '#/admin';
  else render();
}

function renderAdmin() {
  if (!isAdminUser()) return pageHero('Доступ запрещён', '');
  const t = document.createElement('template');
  t.innerHTML = pageHero('Панель мониторинга', 'Административный доступ') + `
    <section class="section"><div class="container">
      <div class="admin-tabs">
        ${Object.entries(ADMIN_TABS).map(([k, v]) =>
          `<button class="admin-tab-btn ${adminTab === k ? 'active' : ''}" data-atab="${k}">
            <i class="fas ${v.icon}"></i> ${v.label}
          </button>`
        ).join('')}
      </div>
      <div id="admin-panel" class="glass-card admin-panel"></div>
    </div></section>`;
  const el = t.content;
  el.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAdminTab(btn.dataset.atab));
  });
  const panel = el.getElementById('admin-panel');
  if (adminTab === 'users') {
    renderAdminUsers().then(content => panel.appendChild(content));
  } else {
    switch (adminTab) {
      case 'stats':    panel.appendChild(renderAdminStats());    break;
      case 'classes':  panel.appendChild(renderAdminClasses());  break;
      case 'bookings': panel.appendChild(renderAdminBookings()); break;
    }
  }
  return el;
}

/* ---- Вкладка "Сводка" ---- */
function renderAdminStats() {
  const classes = getClasses();
  const allBookings = getBookings();
  const allPayments = getPayments();
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const todayBk = allBookings.filter(b => b.date && b.date.includes(today) || b.day === 'Пн'); // простая проверка по дню
  const currMonth = new Date().toLocaleDateString('ru-RU', { month: 'long' });
  const monthPay = allPayments.reduce((s, p) => s + (p.price || p.total || 0), 0);
  const grid = $(`
    <div class="admin-stats-grid">
      <div class="admin-stat-card" data-aos="zoom-in">
        <div class="admin-stat-card__icon"><i class="fas fa-users"></i></div>
        <div class="admin-stat-card__value">${getUsers().length}</div>
        <div class="admin-stat-card__label">Клиентов</div>
      </div>
      <div class="admin-stat-card" data-aos="zoom-in" data-aos-delay="100">
        <div class="admin-stat-card__icon" style="background:linear-gradient(135deg,#3b82f6,#10b981)"><i class="fas fa-calendar-check"></i></div>
        <div class="admin-stat-card__value">${allBookings.length}</div>
        <div class="admin-stat-card__label">Всего записей</div>
      </div>
      <div class="admin-stat-card" data-aos="zoom-in" data-aos-delay="200">
        <div class="admin-stat-card__icon" style="background:linear-gradient(135deg,#8b5cf6,#ef4444)"><i class="fas fa-chart-bar"></i></div>
        <div class="admin-stat-card__value">${formatPrice(monthPay)} ₽</div>
        <div class="admin-stat-card__label">Платежей за ${currMonth}</div>
      </div>
      <div class="admin-stat-card" data-aos="zoom-in" data-aos-delay="300">
        <div class="admin-stat-card__icon" style="background:linear-gradient(135deg,#f59e0b,#ef4444)"><i class="fas fa-dumbbell"></i></div>
        <div class="admin-stat-card__value">${classes.length}</div>
        <div class="admin-stat-card__label">Занятий в расписании</div>
      </div>
    </div>
  `);
  if (typeof AOS !== 'undefined') AOS.refreshHard();
  return grid;
}

/* ---- Вкладка "Пользователи" ---- */
async function renderAdminUsers() {
  let users = getUsers();

  // Пробуем подгрузить пользователей из Supabase, если клиент подключен
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient.from('users').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        // Мержим Supabase + localStorage, убирая дубли по email
        const localEmails = new Set(users.map(u => u.email));
        const merged = [...data, ...users.filter(u => !localEmails.has(u.email))];
        // Приводим структуру Supabase-записей к формату приложения
        users = merged.map(u => ({
          id: u.id,
          name: u.name || '',
          email: u.email,
          phone: u.phone || '',
          subscription: u.subscription || null,
          createdAt: u.created_at || u.createdAt || '',
          isAdmin: u.isAdmin || u.role === 'admin' || false
        }));
      }
    } catch (e) {
      console.warn('Не удалось загрузить пользователей из Supabase:', e.message);
    }
  }

  // Сортируем по дате регистрации (новые сверху)
  users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const t = document.createElement('template');
  t.innerHTML = `
    <div class="admin-users-section">
      <div class="admin-users-count"><i class="fas fa-users"></i> Всего пользователей: <strong>${users.length}</strong></div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>ID</th><th>Имя</th><th>Email</th><th>Телефон</th>
            <th>Абонемент</th><th>Роль</th><th>Дата регистрации</th>
          </tr></thead>
          <tbody>
            ${users.length ? users.map(u => `
              <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.phone || '—'}</td>
                <td>${u.subscription ? `<span class="subscription-badge">${u.subscription.name}</span><br><small style="color:var(--text-secondary);font-size:0.75rem">до ${u.subscription.until}</small>` : '<span style="color:var(--text-secondary)">Нет</span>'}</td>
                <td>${u.isAdmin ? '<span style="color:var(--accent-purple)"><i class="fas fa-shield-alt"></i> Админ</span>' : 'Пользователь'}</td>
                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
              </tr>
            `).join('') : '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-secondary)">Пользователей пока нет</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;

  if (typeof AOS !== 'undefined') AOS.refreshHard();
  return t.content;
}

/* ---- Вкладка "Расписание" ---- */
let adminClassDay = 'all';

function renderAdminClasses() {
  const list = getClasses();
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const t = document.createElement('template');
  t.innerHTML = pageHero('Управление расписанием', 'Добавление, редактирование и удаление занятий') + `
    <section class="section"><div class="container">
      <div class="admin-classes-filters">
        <label><i class="fas fa-filter"></i> День недели:</label>
        <select id="class-day-filter">
          <option value="all" ${adminClassDay === 'all' ? 'selected' : ''}>Все дни</option>
          ${days.map(d => `<option value="${d}" ${adminClassDay === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="admin-table-wrap glass-card" id="admin-classes-table-wrap"></div>
    </div></section>`;
  const el = t.content;

  el.querySelector('#class-day-filter')?.addEventListener('change', (e) => {
    adminClassDay = e.target.value;
    render();
  });

  const filtered = adminClassDay === 'all' ? list : list.filter(c => c.day === adminClassDay);
  const wrap = el.getElementById('admin-classes-table-wrap');
  if (wrap) {
    wrap.innerHTML = `
      <table class="admin-table">
        <thead><tr>
          <th>ID</th><th>Название</th><th>Тип</th><th>День</th>
          <th>Время</th><th>Зал</th><th>Тренер</th><th>Лимит</th>
          <th>Действия</th>
        </tr></thead>
        <tbody>
          ${filtered.length ? filtered.map(c => `
            <tr data-cid="${c.id}">
              <td>${c.id}</td>
              <td>${c.name}</td>
              <td>${c.type || '—'}</td>
              <td>${c.day}</td>
              <td>${c.time}</td>
              <td>${c.room || 'Основной'}</td>
              <td>${c.trainer || '—'}</td>
              <td>${c.max_seats || '∞'}</td>
              <td class="admin-actions-cell">
                <button class="btn btn-outline btn-sm edit-class-btn" data-cid="${c.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-outline btn-sm del-class-btn"  data-cid="${c.id}"><i class="fas fa-trash"></i></button>
              </td>
            </tr>
          `).join('') : '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text-secondary)">Занятий нет</td></tr>'}
        </tbody>
      </table>
      <button class="btn btn-primary btn-sm" id="add-class-btn" style="margin:20px 0 0"><i class="fas fa-plus"></i> Добавить занятие</button>
    `;
    wrap.querySelectorAll('.edit-class-btn').forEach(b => {
      b.addEventListener('click', () => openClassEditModal(+b.dataset.cid));
    });
    wrap.querySelectorAll('.del-class-btn').forEach(b => {
      b.addEventListener('click', () => { removeAdminClass(+b.dataset.cid); showToast('Занятие удалено'); render(); });
    });
    wrap.querySelector('#add-class-btn')?.addEventListener('click', openClassAddModal);
  }

  return el;
}

function openClassAddModal() {
  const formHtml = `
    <div id="class-form-modal" class="form-modal">
      <div class="glass-card form-modal-card">
        <h3>Новое занятие</h3>
        <form id="admin-class-form">
          <div class="form-group"><label>Название</label><input name="name" required placeholder="Йога"></div>
          <div class="form-group"><label>Тип</label>
            <select name="type"><option value="yoga">Йога</option><option value="strength">Силовые</option><option value="pool">Бассейн</option><option value="other">Другое</option></select>
          </div>
          <div class="form-group"><label>День недели</label>
            <select name="day"><option>Пн</option><option>Вт</option><option>Ср</option><option>Чт</option><option>Пт</option><option>Сб</option><option>Вс</option></select>
          </div>
          <div class="form-group"><label>Время</label><input name="time" type="time" required></div>
          <div class="form-group"><label>Зал</label><input name="room" placeholder="Основной зал"></div>
          <div class="form-group"><label>Тренер</label><input name="trainer" placeholder="Имя тренера"></div>
          <div class="form-group"><label>Лимит мест (0 = безлимит)</label><input name="max_seats" type="number" min="0" value="0"></div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button type="submit" class="btn btn-primary btn-block">Сохранить</button>
            <button type="button" class="btn btn-outline btn-block" id="close-class-form">Отмена</button>
          </div>
        </form>
      </div>
    </div>`;
  const t = document.createElement('template');
  t.innerHTML = formHtml;
  const node = t.content.firstElementChild;
  node.querySelector('#close-class-form')?.addEventListener('click', () => node.remove());
  document.body.appendChild(node);
  node.querySelector('#admin-class-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    addAdminClass({
      name: f.name.value.trim(),
      type: f.type.value,
      day: f.day.value,
      time: f.time.value,
      room: f.room.value.trim(),
      trainer: f.trainer.value.trim(),
      limit: +f.limit.value || 0
    });
    node.remove();
    showToast('Занятие добавлено');
    render();
  });
}

function openClassEditModal(clsId) {
  const cls = getClasses().find(c => c.id === clsId);
  if (!cls) return;
  const formHtml = `
    <div id="class-form-modal" class="form-modal">
      <div class="glass-card form-modal-card">
        <h3>Редактировать занятие</h3>
        <form id="admin-class-form">
          <input type="hidden" name="id" value="${clsId}">
          <div class="form-group"><label>Название</label><input name="name" value="${cls.name}" required></div>
          <div class="form-group"><label>Тип</label>
            <select name="type">
              <option value="yoga" ${cls.type==='yoga'?'selected':''}>Йога</option>
              <option value="strength" ${cls.type==='strength'?'selected':''}>Силовые</option>
              <option value="pool" ${cls.type==='pool'?'selected':''}>Бассейн</option>
              <option value="other" ${cls.type==='other'||(!cls.type)?'selected':''}>Другое</option>
            </select>
          </div>
          <div class="form-group"><label>День недели</label>
            <select name="day">
              ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => `<option ${cls.day===d?'selected':''}>${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Время</label><input name="time" type="time" value="${cls.time}" required></div>
          <div class="form-group"><label>Зал</label><input name="room" value="${cls.room||''}" placeholder="Основной зал"></div>
          <div class="form-group"><label>Тренер</label><input name="trainer" value="${cls.trainer||''}" placeholder="Имя тренера"></div>
          <div class="form-group"><label>Лимит мест</label><input name="limit" type="number" min="0" value="${cls.limit||0}"></div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button type="submit" class="btn btn-primary btn-block">Сохранить</button>
            <button type="button" class="btn btn-outline btn-block" id="close-class-form">Отмена</button>
          </div>
        </form>
      </div>
    </div>`;
  const t = document.createElement('template');
  t.innerHTML = formHtml;
  const node = t.content.firstElementChild;
  node.querySelector('#close-class-form')?.addEventListener('click', () => node.remove());
  document.body.appendChild(node);
  node.querySelector('#admin-class-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    updateAdminClass(clsId, {
      name: f.name.value.trim(),
      type: f.type.value,
      day: f.day.value,
      time: f.time.value,
      room: f.room.value.trim(),
      trainer: f.trainer.value.trim(),
      limit: +f.limit.value || 0
    });
    node.remove();
    showToast('Занятие обновлено');
    render();
  });
}

/* ---- Вкладка "Записи" ---- */
function renderAdminBookings() {
  const all = getBookings();
  // Группировка по классу
  const groups = {};
  all.forEach(b => {
    const key = `${b.className} (${b.day}, ${b.time})`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });
  const searchInp = $(`<input type="text" id="booking-search" class="form-modal__search" placeholder="Поиск по имени клиента..." style="width:100%;padding:12px 16px;margin-bottom:20px;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:var(--radius-sm);color:var(--text-primary);font-family:var(--font)">`);
  const listWrap = $(`<div class="admin-bookings-list"></div>`);

  const renderList = (q = '') => {
    const ql = q.toLowerCase();
    let html = '';
    Object.entries(groups).forEach(([className, bookings]) => {
      const filtered = q ? bookings.filter(b => (b.name||'').toLowerCase().includes(ql)) : bookings;
      if (!filtered.length && q) return;
      html += `<div class="admin-booking-group glass-card">
        <div class="admin-booking-group__header"><i class="fas fa-dumbbell"></i> ${className}</div>
        <table class="admin-booking-table">
          <thead><tr><th>Клиент</th><th>Телефон</th><th>Дата записи</th><th>Действие</th></tr></thead>
          <tbody>
            ${filtered.map(b => `
              <tr>
                <td>${b.name || '—'}</td>
                <td>${b.phone || '—'}</td>
                <td>${b.date || '—'}</td>
                <td><button class="btn btn-outline btn-sm cancel-bk-btn" data-bid="${b.id}">Отменить</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>`;
    });
    if (!html) html = '<p class="empty-state" style="padding:30px">Записи не найдены</p>';
    listWrap.innerHTML = html;
    listWrap.querySelectorAll('.cancel-bk-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cancelBooking(+btn.dataset.bid);
        showToast('Бронь отменена');
        renderList(ql);
      });
    });
  };

  searchInp.addEventListener('input', () => renderList(searchInp.value));
  renderList();

  const wrap = $('<div class="admin-bookings-section"></div>');
  wrap.appendChild(searchInp);
  wrap.appendChild(listWrap);
  return wrap;
}

function bindAdmin() {
  // Ничего специфичного — вкладки привязаны при рендере
}

/* ========== СЛУШАТЕЛИ ========== */
document.addEventListener('click', (e) => {
  const route = e.target.closest('[data-route]');
  if (route) { e.preventDefault(); navigate(route.dataset.route); }
});

window.addEventListener('hashchange', render);

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await DB.ready;
    if (!location.hash) location.hash = '#/home';
    initLoader();
    initAppUI();
    await render();
    if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true });
  } catch (err) {
    document.getElementById('app').innerHTML = `<p class="empty-state">Ошибка загрузки: ${err.message}. Запустите через <code>npx serve .</code></p>`;
  }
});
