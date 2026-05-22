/* ===== ОЛИМП — основной JS ===== */
const OLIMP = {
  clubLat: 55.751244,
  clubLng: 37.618423,
  clubAddress: 'г. Москва, ул. Спортивная, 15'
};

/* Инициализация UI — вызывается из app.js после загрузки БД */
function initAppUI() {
  initHeader();
  initBurger();
  initModals();
  initPaymentModal();
}

function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 600);
  });
  setTimeout(() => loader.classList.add('hidden'), 3000);
}

function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function initBurger() {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('open');
    document.body.classList.toggle('no-scroll');
  });

  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      nav.classList.remove('open');
      document.body.classList.remove('no-scroll');
    });
  });
}

function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });
}

function initModals() {
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const id = trigger.dataset.modal;
      openModal(id);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.querySelectorAll('.modal__close').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    });
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.classList.add('no-scroll');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
}

function initPaymentModal() {
  const form = document.getElementById('payment-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = form.dataset.item || 'Услуга';
    const price = parseFloat(form.dataset.price) || 0;

    const payment = {
      id: Date.now(),
      item,
      price,
      date: new Date().toLocaleString('ru-RU'),
      status: 'Оплачено'
    };

    addPayment(payment);

    if (form.dataset.type === 'subscription' && getCurrentUser()) {
      updateCurrentUser({ subscription: { name: item, until: getSubscriptionEnd(item) } });
    }

    closeModal('payment-modal');
    showToast('Оплата прошла успешно!', 'success');
    form.reset();

    if (getRoute?.() === 'profile') render();
  });
}

function getSubscriptionEnd(plan) {
  const d = new Date();
  if (plan.includes('1 месяц')) d.setMonth(d.getMonth() + 1);
  else if (plan.includes('3 месяц')) d.setMonth(d.getMonth() + 3);
  else if (plan.includes('6 месяц')) d.setMonth(d.getMonth() + 6);
  else if (plan.includes('VIP')) d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('ru-RU');
}

function openPayment(item, price, type = 'service') {
  const form = document.getElementById('payment-form');
  const title = document.getElementById('payment-title');
  if (!form) return;

  form.dataset.item = item;
  form.dataset.price = price;
  form.dataset.type = type;
  if (title) title.textContent = `Оплата: ${item} — ${price} ₽`;
  openModal('payment-modal');
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : type === 'info' ? 'info' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function highlightActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

function updateCartBadge() {
  const badge = document.querySelector('.cart-badge__count');
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem('olimp_cart') || '[]');
  const count = cart.reduce((s, i) => s + i.qty, 0);
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function formatPrice(n) {
  return new Intl.NumberFormat('ru-RU').format(n);
}
