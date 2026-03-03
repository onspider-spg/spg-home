/**
 * ═══════════════════════════════════════════
 * SPG App — Home Module Frontend
 * app.js — Router + Screen Manager + Utilities
 * v3.2 — Hash Routing with Sub-routes
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

    // Scroll to top
    window.scrollTo(0, 0);

    // Update URL hash
    const hash = buildHash(route, params);
    history.replaceState({ route, params }, '', hash);
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

  // ─── INIT ───
  function init() {
    const session = API.getSession();

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
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { go, updateHash, toast, showLoader, hideLoader };
})();
