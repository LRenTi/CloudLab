/**
 * main.js
 * App bootstrap: theme, clock, Docker-Status-Polling, card spotlight.
 * Runs after renderer.js has injected the DOM.
 */

/* ── Theme ─────────────────────────────────────── */
const root     = document.documentElement;
const iconSun  = document.getElementById('iconSun');
const iconMoon = document.getElementById('iconMoon');

function applyTheme(dark) {
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  if (iconSun)  iconSun.style.display  = dark ? 'none' : '';
  if (iconMoon) iconMoon.style.display = dark ? '' : 'none';
}

function toggleTheme() {
  const isDark = root.getAttribute('data-theme') !== 'dark';
  applyTheme(isDark);
  localStorage.setItem('cl-theme', isDark ? 'dark' : 'light');
}

(function initTheme() {
  const saved       = localStorage.getItem('cl-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved ? saved === 'dark' : prefersDark);
})();

/* ── Live clock ─────────────────────────────────── */
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
updateClock();
setInterval(updateClock, 1000);

/* ── Authelia: login status + sign in from dashboard ─ */
const AUTH_PREFIX = '/auth';
const AUTH_POLL_MS = 45_000;

function authReturnUrl() {
  return encodeURIComponent(`${window.location.origin}/`);
}

function authLoginHref() {
  return `${AUTH_PREFIX}/?rd=${authReturnUrl()}&rm=GET`;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function refreshLucideIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

document.addEventListener('click', async (e) => {
  const link = e.target.closest('a.auth-logout-btn');
  if (!link) return;
  e.preventDefault();
  try {
    await fetch(`${AUTH_PREFIX}/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch (_) { /* ignore */ }
  window.location.reload();
});

async function refreshAuthStatus() {
  const el = document.getElementById('authStatus');
  if (!el) return;

  try {
    const res = await fetch(`${AUTH_PREFIX}/api/state`, {
      credentials: 'include',
      signal: AbortSignal.timeout(10000),
    });

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error('not-json');
    }

    const json = await res.json();
    const data = json?.data ?? {};
    const user = typeof data.username === 'string' ? data.username.trim() : '';
    const level = Number(data.authentication_level ?? 0);

    // two_factor policy: level 2 = fully signed in (incl. TOTP)
    if (user && level >= 2) {
      el.innerHTML = `
        <span class="auth-user" title="Signed in with Authelia (2FA)">
          <i data-lucide="shield-check"></i>
          <span class="auth-user-name">${escapeHtml(user)}</span>
        </span>
        <a class="btn-auth-link auth-logout-btn" href="#" title="Sign out">Sign out</a>
      `;
    } else if (user && level === 1) {
      el.innerHTML = `
        <a class="btn-auth-warn" href="${authLoginHref()}" title="Complete second factor (TOTP)">
          <i data-lucide="shield-alert"></i>
          Finish 2FA
        </a>
      `;
    } else {
      el.innerHTML = `
        <a class="btn-auth-login" href="${authLoginHref()}" title="Sign in — then service links work without asking again">
          <i data-lucide="log-in"></i>
          Sign in
        </a>
      `;
    }
    refreshLucideIcons();
  } catch {
    el.innerHTML = `
      <a class="btn-auth-login" href="${authLoginHref()}" title="Sign in">
        <i data-lucide="log-in"></i>
        Sign in
      </a>
    `;
    refreshLucideIcons();
  }
}

/* ── Docker Status Polling ──────────────────────── */

const DOCKER_POLL_INTERVAL = 30_000; // 30 seconds

// API URL: relative path → no mixed content / port issues
function getDockerApiUrl() {
  if (DASHBOARD_CONFIG.api?.dockerUrl) return DASHBOARD_CONFIG.api.dockerUrl;
  return '/api/containers';
}

const STATUS_LABEL_MAP = { online: 'Online', idle: 'Idle', offline: 'Offline' };

function updateCardStatus(card, status) {
  const badge = card.querySelector('.card-status');
  if (!badge) return;

  badge.classList.remove('status-online', 'status-offline', 'status-idle');
  badge.classList.add(`status-${status}`);

  const label = badge.querySelector('.status-label');
  if (label) label.textContent = STATUS_LABEL_MAP[status] ?? status;

  card.classList.toggle('card--offline', status === 'offline');

  // Offline cards not clickable; re-enable when online
  if (status === 'offline') {
    card.setAttribute('tabindex', '-1');
    card.setAttribute('aria-disabled', 'true');
  } else {
    card.removeAttribute('tabindex');
    card.removeAttribute('aria-disabled');
  }
}

async function fetchDockerStatus() {
  const apiUrl = getDockerApiUrl();

  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { containers } = await res.json();

    const runningNames = containers.map(c => c.name.toLowerCase());

    // Whether configured container name is running (exact or prefix)
    function isRunning(configuredName) {
      const n = configuredName.toLowerCase();
      return runningNames.some(r => r === n || r.startsWith(n + '-') || r.startsWith(n + '_'));
    }

    // Update service cards
    let onlineCount = 0;
    const cards = document.querySelectorAll('.service-card[data-container]');

    cards.forEach(card => {
      const name = card.dataset.container;
      if (!name) return;
      const running = isRunning(name);
      if (running) onlineCount++;
      updateCardStatus(card, running ? 'online' : 'offline');
    });

    // Update quick links
    document.querySelectorAll('.quick-item[data-container]').forEach(item => {
      const name = item.dataset.container;
      if (!name) return;
      const running = isRunning(name);
      item.classList.toggle('qs-online',  running);
      item.classList.toggle('qs-offline', !running);
      const dot = item.querySelector('.quick-status-dot');
      if (dot) dot.title = running ? 'Online' : 'Offline';
    });

    // Sort cards in every grid (Infrastructure, Services, …) by status, then name
    sortCardsByStatus();

    // Spotlight listeners for cards
    initSpotlight();

    const statOnline = document.getElementById('stat-online-count');
    if (statOnline) statOnline.textContent = `— ${onlineCount} / ${cards.length} up`;

    const statDocker = document.getElementById('stat-docker-count');
    if (statDocker) statDocker.textContent = `— ${containers.length} running`;

  } catch (err) {
    console.warn('[Docker API] Unreachable:', err.message);

    const statOnline = document.getElementById('stat-online-count');
    if (statOnline) statOnline.textContent = '— API offline';

    const statDocker = document.getElementById('stat-docker-count');
    if (statDocker) statDocker.textContent = '— not connected';
  }
}

/* ── Sort cards by status within each grid ──────── */
const STATUS_ORDER = { online: 0, idle: 1, offline: 2 };

function cardStatusSortKey(card) {
  const cls = Array.from(card.querySelector('.card-status')?.classList ?? [])
    .find(c => c.startsWith('status-') && c !== 'status-label');
  const status = cls?.replace('status-', '') ?? 'offline';
  return STATUS_ORDER[status] ?? 2;
}

function sortCardsByStatus() {
  document.querySelectorAll('.cards-grid').forEach(grid => {
    const cards = Array.from(grid.querySelectorAll(':scope > .service-card'));
    cards.sort((a, b) => {
      const da = cardStatusSortKey(a);
      const db = cardStatusSortKey(b);
      if (da !== db) return da - db;
      const na = a.querySelector('.card-title')?.textContent?.trim() ?? '';
      const nb = b.querySelector('.card-title')?.textContent?.trim() ?? '';
      return na.localeCompare(nb, undefined, { sensitivity: 'base' });
    });
    cards.forEach(card => grid.appendChild(card));
  });
}

/* ── Card spotlight (mouse-follow radial glow) ───── */
function onCardMouseMove(e) {
  const card = e.currentTarget;
  if (card.classList.contains('card--offline')) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width  * 100) + '%');
  card.style.setProperty('--my', ((e.clientY - rect.top)  / rect.height * 100) + '%');
}

function initSpotlight() {
  document.querySelectorAll('.service-card').forEach(card => {
    // Avoid duplicate listeners on refresh
    if (card._spotlightBound) return;
    card._spotlightBound = true;
    card.addEventListener('mousemove', onCardMouseMove);
  });
}

/* ── Bootstrap ──────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard(DASHBOARD_CONFIG);

  initSpotlight();

  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', toggleTheme);

  refreshAuthStatus();
  setInterval(refreshAuthStatus, AUTH_POLL_MS);

  // Docker status: now, then every 30s
  fetchDockerStatus();
  setInterval(fetchDockerStatus, DOCKER_POLL_INTERVAL);
});
