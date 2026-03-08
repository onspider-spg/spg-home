/**
 * ═══════════════════════════════════════════
 * SPG App — Home Module Frontend
 * app.js — Router + Screen Manager + Sidebar + Utilities
 * Version 3.4.2 | 8 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * 
 * Route Map:
 *   #login              → S1 Login
 *   #staff-select       → S3 Staff Selection
 *   #new-staff          → S4 New Staff Registration
 *   #dashboard          → S5 Home Dashboard
 *   #profile            → S6 User Profile
 *   #register           → S7 Public Registration
 *   #pending            → S8 Pending Approval
 *   #admin/accounts     → S9 Admin Panel (Accounts tab)
 *   #admin/permissions  → S9 Admin Panel (Permissions tab)
 *   #admin/registrations→ S9 Admin Panel (Requests tab)
 *   #admin/bridge       → S9 Admin Panel (Bridge tab)
 *   #account-detail/ID  → S10 Account Detail
 *   #reg-review/ID      → S11 Registration Review
 *   #audit              → S12 Audit Log
 */

const App = (() => {
  const appEl = () => document.getElementById('app');
  let currentRoute = '';
  let currentParams = {};

  // ─── ROUTES ───
  const ROUTES = {
    'login':           { render: () => Screens.renderLogin(),                     onLoad: null },
    'staff-select':    { render: () => Screens.renderStaffSelect(),               onLoad: () => Screens.loadStaffList() },
    'new-staff':       { render: () => Screens.renderNewStaff(),                  onLoad: null },
    'dashboard':       { render: () => Screens.renderDashboard(),                 onLoad: () => Screens.loadModules() },
    'profile':         { render: () => Screens.renderProfile(),                   onLoad: () => Screens.loadProfile() },
    'register':        { render: () => Screens.renderRegister(),                  onLoad: () => Screens.loadRegisterDropdowns() },
    'pending':         { render: (p) => Screens.renderPending(p),                 onLoad: null },
    'admin':           { render: (p) => Screens.renderAdmin(p),                   onLoad: (p) => Screens.loadAdminContent(p) },
    'account-detail':  { render: (p) => Screens.renderAccountDetail(p),           onLoad: (p) => Screens.loadAccountDetail(p.account_id) },
    'reg-review':      { render: (p) => Screens.renderRegReview(p),               onLoad: (p) => Screens.loadRegReview(p.request_id) },
    'audit':           { render: () => Screens.renderAudit(),                     onLoad: () => Screens.loadAuditLog() }
  };

  // ─── PARSE HASH → { route, params } ───
  function parseHash(hash) {
    const clean = (hash || '').replace(/^#/, '');
    if (!clean) return { route: '', params: {} };

    const parts = clean.split('/');
    const route = parts[0];
    const sub = parts.slice(1).join('/');
    const params = {};

    if (route === 'admin' && sub) {
      params.tab = sub;
    } else if (route === 'account-detail' && sub) {
      params.account_id = sub;
    } else if (route === 'reg-review' && sub) {
      params.request_id = sub;
    }

    return { route, params };
  }

  // ─── BUILD HASH from route + params ───
  function buildHash(route, params = {}) {
    if (route === 'admin') return `#admin/${params.tab || 'accounts'}`;
    if (route === 'account-detail' && params.account_id) return `#account-detail/${params.account_id}`;
    if (route === 'reg-review' && params.request_id) return `#reg-review/${params.request_id}`;
    return `#${route}`;
  }

  // ─── NAVIGATE (full screen change) ───
  function go(route, params = {}) {
    const def = ROUTES[route];
    if (!def) {
      console.warn('Unknown route:', route);
      return go('login');
    }

    // Auth guard
    const publicRoutes = ['login', 'register', 'pending'];
    if (!publicRoutes.includes(route)) {
      const session = API.getSession();
      if (route === 'staff-select' || route === 'new-staff') {
        if (!API.getAccountTemp()) return go('login');
      } else if (!session) {
        return go('login');
      }
    }

    currentRoute = route;
    currentParams = params;

    // Render
    const container = appEl();
    container.innerHTML = def.render(params);

    // Post-render data loading
    if (def.onLoad) {
      setTimeout(() => def.onLoad(params), 50);
    }

    // Scroll to top — reset all scroll containers (fixes iOS PWA viewport stuck)
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    const sb = container.querySelector('.screen-body');
    if (sb) sb.scrollTop = 0;

    // Update URL hash
    const hash = buildHash(route, params);
    history.replaceState({ route, params }, '', hash);

    // Update sidebar active state
    updateSidebarActive(route, params);
  }

  // ─── UPDATE HASH ONLY (no re-render, for tab switches) ───
  function updateHash(route, params = {}) {
    currentParams = { ...currentParams, ...params };
    const hash = buildHash(route || currentRoute, currentParams);
    history.replaceState({ route: route || currentRoute, params: currentParams }, '', hash);
  }

  // ─── TOAST ───
  let toastTimer = null;
  function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    if (!el) return;
    
    clearTimeout(toastTimer);
    el.textContent = msg;
    el.className = `toast ${type}`;
    
    requestAnimationFrame(() => {
      el.classList.add('show');
    });

    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
  }

  // ─── LOADER ───
  function showLoader() {
    const el = document.getElementById('loader');
    if (el) el.classList.remove('hidden');
  }
  function hideLoader() {
    const el = document.getElementById('loader');
    if (el) el.classList.add('hidden');
  }

  // ═══════════════════════════════════════════
  // SIDEBAR — Slide-out left panel
  // ═══════════════════════════════════════════

  function esc(str) {
    if (str === null || str === undefined) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function initSidebar() {
    const s = API.getSession();
    if (!s) {
      // Guest mode — empty sidebar
      document.getElementById('sidebarHeader').innerHTML = '';
      document.getElementById('sidebarBody').innerHTML = '';
      document.getElementById('sidebarFooter').innerHTML = '';
      return;
    }

    const initial = (s.display_name || s.display_label || '?').charAt(0).toUpperCase();
    const tierLevel = parseInt((s.tier_id || 'T9').replace('T', ''));
    const isAdmin = tierLevel <= 2;
    const isManager = tierLevel <= 4;

    // Header: profile info
    document.getElementById('sidebarHeader').innerHTML = `
      <div class="sidebar-profile">
        <div class="sidebar-avatar">${esc(initial)}</div>
        <div>
          <div class="sidebar-name">${esc(s.display_name || s.display_label)}</div>
          <div class="sidebar-meta">${esc(s.tier_id)} · ${esc(s.store_id || 'HQ')}</div>
        </div>
      </div>`;

    // Body: navigation sections
    let body = '';

    // Modules section
    body += `
      <details class="sidebar-section" open>
        <summary>Modules</summary>
        <div id="sidebarModules">
          <div class="sidebar-item" style="color:var(--tm);font-size:11px">กำลังโหลด...</div>
        </div>
      </details>
      <div class="sidebar-divider"></div>`;

    // Management section (T1-T4)
    if (isManager) {
      body += `
        <details class="sidebar-section"${isAdmin ? ' open' : ''}>
          <summary>Management</summary>
          <div>
            ${isAdmin ? '<div class="sidebar-item" onclick="App.goSidebar(\'admin\')">Admin Panel</div>' : ''}
          </div>
        </details>
        <div class="sidebar-divider"></div>`;
    }

    // Admin sections (T1-T2 only)
    if (isAdmin) {
      body += `
        <details class="sidebar-section">
          <summary>Admin</summary>
          <div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'accounts'})">Accounts</div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'permissions'})">Permissions</div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'tieraccess'})">Tier Access</div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'registrations'})">Requests</div>
          </div>
        </details>
        <div class="sidebar-divider"></div>
        <details class="sidebar-section">
          <summary>Master Data</summary>
          <div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'bridge'})">Bridge Config</div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'modules'})">Modules</div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'user'})">Users</div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'store'})">Stores</div>
            <div class="sidebar-item" onclick="App.goSidebar('admin',{tab:'dept'})">Departments</div>
          </div>
        </details>
        <div class="sidebar-divider"></div>
        <details class="sidebar-section">
          <summary>Reports</summary>
          <div>
            <div class="sidebar-item" onclick="App.goSidebar('audit')">Audit Trail</div>
          </div>
        </details>`;
    }

    document.getElementById('sidebarBody').innerHTML = body;

    // Populate modules from cache (if loadModules already ran before sidebar opened)
    if (_cachedModules) {
      const modEl = document.getElementById('sidebarModules');
      if (modEl) _renderSidebarModuleList(modEl, _cachedModules);
    }

    // Footer: Home + Logout
    document.getElementById('sidebarFooter').innerHTML = `
      <div class="sidebar-footer-item" onclick="App.goSidebar('dashboard')">Home</div>
      <div class="sidebar-footer-item danger" onclick="Screens.doLogout()">Log out</div>`;
  }

  // Populate module list in sidebar (called after loadModules)
  let _cachedModules = null;
  function updateSidebarModules(modules) {
    _cachedModules = modules;
    // If sidebar already built, update now; otherwise will populate on open
    const el = document.getElementById('sidebarModules');
    if (!el || !modules) return;
    _renderSidebarModuleList(el, modules);
  }

  function _renderSidebarModuleList(el, modules) {
    el.innerHTML = modules
      .filter(m => m.is_accessible || m.status === 'coming_soon')
      .map(m => {
        const disabled = !m.is_accessible;
        const badge = m.badge_count ? `<span class="sidebar-badge">${m.badge_count}</span>` : '';
        const label = m.module_name_en || m.module_name || m.module_id;
        const sub = m.module_name && m.module_name_en ? ` <span style="font-size:9px;color:var(--tm)">· ${esc(m.module_name)}</span>` : '';
        if (disabled) {
          return `<div class="sidebar-item" style="opacity:.4;cursor:default">${esc(label)}${sub} <span style="font-size:8px;padding:1px 5px;border-radius:4px;background:var(--orange-bg);color:var(--orange);margin-left:auto">Soon</span></div>`;
        }
        return `<div class="sidebar-item" onclick="Screens.launchModule('${esc(m.app_url)}')">${esc(label)}${sub} ${badge}</div>`;
      }).join('');
  }

  let _sidebarBuilt = false;

  function openSidebar() {
    if (!_sidebarBuilt) { initSidebar(); _sidebarBuilt = true; }
    document.getElementById('sidebarOverlay')?.classList.add('open');
    document.getElementById('sidebarPanel')?.classList.add('open');
  }

  function closeSidebar() {
    document.getElementById('sidebarOverlay')?.classList.remove('open');
    document.getElementById('sidebarPanel')?.classList.remove('open');
  }

  function goSidebar(route, params) {
    closeSidebar();
    go(route, params || {});
  }

  function updateSidebarActive(route, params) {
    // Mark active sidebar item based on current route
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    // Simple matching — will enhance in Phase 2-4
  }

  // ─── INIT ───
  function init() {
    const session = API.getSession();

    // Force viewport reset (iOS PWA: returning from other module can shift viewport)
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // #logout — cross-module logout link
    // Usage: location.href = 'https://onspider-spg.github.io/spg-home/#logout'
    if (location.hash === '#logout') {
      API.clearSession();
      localStorage.removeItem('spg_token');
      _sidebarBuilt = false;
      history.replaceState(null, '', '#login');
      go('login');
      return;
    }

    // Sidebar is lazy — built on first openSidebar() call, not here

    // Try to restore route from current hash
    const { route, params } = parseHash(location.hash);

    if (route && ROUTES[route]) {
      const publicRoutes = ['login', 'register', 'pending'];
      if (publicRoutes.includes(route) || session) {
        go(route, params);
      } else {
        go('login');
      }
    } else {
      go(session ? 'dashboard' : 'login');
    }

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state?.route) {
        go(e.state.route, e.state.params || {});
      } else {
        const { route: r, params: p } = parseHash(location.hash);
        if (r && ROUTES[r]) go(r, p);
      }
    });

    // iOS PWA: reset viewport when returning from other module (BFCache / tab switch)
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
      }
    });
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    go, updateHash, toast, showLoader, hideLoader,
    // Sidebar
    openSidebar, closeSidebar, goSidebar,
    initSidebar, updateSidebarModules,
  };
})();
