/**
 * ═══════════════════════════════════════════
 * SPG App — Home Module Frontend
 * app.js — Router + Screen Manager + Utilities
 * ═══════════════════════════════════════════
 * 
 * Route Map:
 *   login          → S1 Login
 *   staff-select   → S3 Staff Selection
 *   new-staff      → S4 New Staff Registration
 *   dashboard      → S5 Home Dashboard
 *   profile        → S6 User Profile
 *   register       → S7 Public Registration
 *   pending        → S8 Pending Approval
 *   admin          → S9 Admin Panel
 *   account-detail → S10 Account Detail
 *   reg-review     → S11 Registration Review
 *   audit          → S12 Audit Log
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
    'admin':           { render: () => Screens.renderAdmin(),                     onLoad: () => Screens.loadAdminContent() },
    'account-detail':  { render: (p) => Screens.renderAccountDetail(p),           onLoad: (p) => Screens.loadAccountDetail(p.account_id) },
    'reg-review':      { render: (p) => Screens.renderRegReview(p),               onLoad: (p) => Screens.loadRegReview(p.request_id) },
    'audit':           { render: () => Screens.renderAudit(),                     onLoad: () => Screens.loadAuditLog() }
  };

  // ─── NAVIGATE ───
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
      // staff-select and new-staff need account temp only
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

    // Update hash for back button
    history.replaceState({ route, params }, '', `#${route}`);
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
    // Check for existing session
    const session = API.getSession();
    
    if (session) {
      go('dashboard');
    } else {
      go('login');
    }

    // Handle browser back button
    window.addEventListener('popstate', (e) => {
      if (e.state?.route) {
        go(e.state.route, e.state.params || {});
      }
    });
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { go, toast, showLoader, hideLoader };
})();
