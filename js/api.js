/**
 * ═══════════════════════════════════════════
 * SPG App — Home Module Frontend
 * api.js — API Client + Session Manager
 * ═══════════════════════════════════════════
 */

const API = (() => {
  // ⚠️ CHANGE THIS after deploying Apps Script as Web App
  let BASE_URL = localStorage.getItem('spg_api_url') || '';

  // Session storage
  const SESSION_KEY = 'spg_session';
  const ACCOUNT_KEY = 'spg_account';

  function setBaseUrl(url) {
    BASE_URL = url.replace(/\/$/, '');
    localStorage.setItem('spg_api_url', BASE_URL);
  }

  function getBaseUrl() { return BASE_URL; }

  // ─── HTTP ───
  async function post(action, data = {}) {
    if (!BASE_URL) throw new Error('API URL not configured');
    
    const url = `${BASE_URL}?action=${action}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script CORS
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    // Google Apps Script redirects — fetch follows automatically
    const json = await resp.json();
    
    if (!json.success) {
      const err = new Error(json.error?.message || 'Unknown error');
      err.code = json.error?.code;
      err.key = json.error?.key;
      throw err;
    }

    return json.data;
  }

  // ─── SESSION ───
  function saveSession(data) {
    const sessionData = {
      token: data.session_id,
      account_id: data.account_id,
      account_type: data.account_type,
      display_label: data.display_label,
      tier_id: data.tier_id,
      tier_name: data.tier_name,
      store_id: data.store_id,
      dept_id: data.dept_id,
      user_id: data.user_id || '',
      display_name: data.display_name || '',
      full_name: data.full_name || '',
      expires_at: data.expires_at
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    return sessionData;
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        clearSession();
        return null;
      }
      return data;
    } catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
  }

  // Temp store account info during group login flow
  function saveAccountTemp(data) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(data));
  }
  function getAccountTemp() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY)); } catch { return null; }
  }

  // ─── TOKEN HELPER ───
  function tokenBody(extra = {}) {
    const s = getSession();
    return { token: s?.token, ...extra };
  }

  // ─── PUBLIC API METHODS ───
  return {
    setBaseUrl, getBaseUrl,
    saveSession, getSession, clearSession,
    saveAccountTemp, getAccountTemp,

    // EP-01: Login
    login: (username, password) => post('login', { username, password }),

    // EP-02: Register
    register: (data) => post('register', data),

    // EP-03: Validate Session
    validateSession: (module_id) => post('validate_session', tokenBody({ module_id })),

    // EP-04: Get Users (group)
    getUsers: (account_id) => post('get_users', { ...tokenBody(), account_id }),

    // EP-05: Create User
    createUser: (data) => post('create_user', { ...tokenBody(), ...data }),

    // EP-06: Switch User
    switchUser: (account_id, user_id) => post('switch_user', { account_id, user_id }),

    // EP-07: Logout
    logout: () => post('logout', tokenBody()),

    // EP-08: Get Modules
    getModules: () => post('get_modules', tokenBody()),

    // EP-09: Get Profile
    getProfile: () => post('get_profile', tokenBody()),

    // EP-10: Admin Get Accounts
    adminGetAccounts: (filters = {}) => post('admin_get_accounts', tokenBody(filters)),

    // EP-11: Admin Create Account
    adminCreateAccount: (data) => post('admin_create_account', tokenBody(data)),

    // EP-12: Admin Update Account
    adminUpdateAccount: (data) => post('admin_update_account', tokenBody(data)),

    // EP-13: Admin Get Permissions
    adminGetPermissions: (module_id) => post('admin_get_permissions', tokenBody({ module_id })),

    // EP-14: Admin Update Permission
    adminUpdatePermission: (module_id, tier_id, access_level) =>
      post('admin_update_permission', tokenBody({ module_id, tier_id, access_level })),

    // EP-15: Admin Get Registrations
    adminGetRegistrations: (filters = {}) => post('admin_get_registrations', tokenBody(filters)),

    // EP-16: Admin Review Registration
    adminReviewRegistration: (data) => post('admin_review_registration', tokenBody(data)),

    // EP-17: Admin Get Audit Log
    adminGetAuditLog: (filters = {}) => post('admin_get_audit_log', tokenBody(filters)),

    // EP-18: Admin Export Audit Log
    adminExportAuditLog: (filters = {}) => post('admin_export_audit_log', tokenBody(filters)),

    // EP-19: Admin Get Bridge Config
    adminGetBridgeConfig: () => post('admin_get_bridge_config', tokenBody()),

    // EP-20: Admin Update Bridge
    adminUpdateBridge: (bridge_id, is_enabled) =>
      post('admin_update_bridge', tokenBody({ bridge_id, is_enabled })),

    // EP-21: Get User Metadata
    getUserMetadata: (user_id) => post('get_user_metadata', tokenBody({ user_id })),

    // EP-22: Set User Metadata
    setUserMetadata: (data) => post('set_user_metadata', tokenBody(data)),

    // EP-23: Get Stores
    getStores: () => post('get_stores', {}),

    // EP-24: Get Departments
    getDepartments: () => post('get_departments', {})
  };
})();
