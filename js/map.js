/* ===== Карта и геолокация ===== */
document.addEventListener('DOMContentLoaded', () => {
  const geoBtn = document.getElementById('geo-btn');
  if (geoBtn) geoBtn.addEventListener('click', showUserLocation);
});

function showUserLocation() {
  const result = document.getElementById('geo-result');
  if (!navigator.geolocation) {
    showToast('Геолокация не поддерживается браузером', 'error');
    return;
  }

  if (result) result.textContent = 'Определяем местоположение...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const dist = haversine(latitude, longitude, OLIMP.clubLat, OLIMP.clubLng);

      if (result) {
        result.innerHTML = `
          <p><strong>Ваши координаты:</strong> ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</p>
          <p><strong>Расстояние до «Олимп»:</strong> ${dist.toFixed(2)} км</p>
          <a href="https://yandex.ru/maps/?rtext=${latitude},${longitude}~${OLIMP.clubLat},${OLIMP.clubLng}&rtt=auto" target="_blank" class="btn btn-primary btn-sm" style="margin-top:12px">Построить маршрут</a>
        `;
      }

      showToast(`До клуба: ${dist.toFixed(1)} км`, 'info');
    },
    () => {
      if (result) result.textContent = 'Не удалось получить местоположение. Разрешите доступ в браузере.';
      showToast('Доступ к геолокации запрещён', 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
