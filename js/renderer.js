/**
 * renderer.js
 * Reads DASHBOARD_CONFIG (data/services.js) and builds
 * the full page DOM — hero, cards, quicklinks (footer lives in index.html).
 */

/* ── Status label map (UI language: English) ── */
const STATUS_LABEL = {
  online:  'Online',
  idle:    'Idle',
  offline: 'Offline',
};

/* ── Build hero section ── */
function renderHero(hero) {
  return `
    <section class="hero">
      <div class="hero-badge">
        <i data-lucide="server"></i>
        ${escHtml(hero.badge)}
      </div>
      <h1>${escHtml(hero.title)}<br /><span>${escHtml(hero.subtitle)}</span></h1>
      <p class="hero-description">${escHtml(hero.description)}</p>

      <div class="stat-group">
        <div class="stat-pill">
          <span class="stat-dot dot-green"></span>
          Services
          <span class="stat-val" id="stat-online-count">— loading…</span>
        </div>
        <div class="stat-pill">
          <span class="stat-dot dot-blue"></span>
          Docker
          <span class="stat-val" id="stat-docker-count">— loading…</span>
        </div>
        <div class="stat-pill">
          <span class="stat-dot dot-yellow"></span>
          Local network
          <span class="stat-val">${escHtml(hero.network)}</span>
        </div>
      </div>
    </section>`;
}

/* ── Build one service card ── */
function renderCard(item) {
  const statusClass = `status-${item.status}`;
  const statusLabel = STATUS_LABEL[item.status] ?? item.status;
  const isOffline   = item.status === 'offline';

  return `
    <a href="${escAttr(item.url)}"
       class="service-card${isOffline ? ' card--offline' : ''}"
       data-container="${escAttr(item.container ?? '')}"
       ${isOffline ? 'tabindex="-1" aria-disabled="true"' : 'target="_blank" rel="noopener"'}>
      <div class="card-header-row">
        <div class="card-icon">${item.logoUrl
          ? `<img src="${escAttr(item.logoUrl)}" alt="${escAttr(item.name)} logo" class="card-logo-img" />`
          : `<i data-lucide="${escAttr(item.icon)}"></i>`
        }</div>
        <span class="card-status ${statusClass}">
          <span class="dot"></span><span class="status-label">${statusLabel}</span>
        </span>
      </div>
      <div class="card-title">${escHtml(item.name)}</div>
      <div class="card-desc">${escHtml(item.desc)}</div>
      <div class="card-meta">
        <span class="card-tag">${escHtml(item.tag)}</span>
        <span class="card-arrow"><i data-lucide="arrow-right"></i></span>
      </div>
    </a>`;
}

/* ── Build cards section ── */
function renderCardsSection(section, isFirst) {
  const separator = isFirst
    ? `<p class="section-label">${escHtml(section.title)}</p>`
    : `<div class="category-sep"><span>${escHtml(section.title)}</span></div>`;

  const cards = section.items.map(renderCard).join('');
  return `${separator}<div class="cards-grid">${cards}</div>`;
}

/* ── Build one quick-link item ── */
function renderQuickItem(item) {
  return `
    <a href="${escAttr(item.url)}"
       class="quick-item"
       data-container="${escAttr(item.container ?? '')}"
       target="_blank" rel="noopener">
      <div class="quick-icon"><i data-lucide="${escAttr(item.icon)}"></i></div>
      <span class="quick-name">${escHtml(item.name)}</span>
      <span class="quick-url">${escHtml(item.label)}</span>
      <span class="quick-status-dot" title="Offline"></span>
    </a>`;
}

/* ── Build quicklinks section ── */
function renderQuickSection(section) {
  const cols = section.columns
    .map(col => `
      <div class="col-lg-6">
        <div class="quick-list">
          ${col.map(renderQuickItem).join('')}
        </div>
      </div>`)
    .join('');

  return `
    <div class="category-sep"><span>${escHtml(section.title)}</span></div>
    <div class="row g-3">${cols}</div>`;
}

/* ── Main render entry point ── */
function renderDashboard(config) {
  const main = document.getElementById('main-content');
  let html = renderHero(config.hero);

  config.sections.forEach((section, idx) => {
    if (section.type === 'cards') {
      html += renderCardsSection(section, idx === 0);
    } else if (section.type === 'quicklinks') {
      html += renderQuickSection(section);
    }
  });

  main.innerHTML = html;

  /* Re-init Lucide after DOM injection */
  lucide.createIcons();
}

/* ── Helpers ── */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}
