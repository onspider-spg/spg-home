/**
 * ═══════════════════════════════════════════
 * SPG App — Home Module Frontend
 * screens.js — All 12 Screen Renderers
 * ═══════════════════════════════════════════
 * 
 * S1  Login
 * S2  Login Error
 * S3  Staff Selection (Group)
 * S4  New Staff Registration
 * S5  Home Dashboard
 * S6  User Profile
 * S7  Registration (Public)
 * S8  Pending Approval
 * S9  Admin Panel (Accounts, Permissions, Registrations, Bridge)
 * S10 Account Detail / Edit
 * S11 Registration Review
 * S12 Audit Log
 */

const Screens = (() => {

// ════════════════════════════════
// S1: LOGIN
// ════════════════════════════════
function renderLogin() {
  return `
  <div class="screen screen-enter">
    <div class="login-screen">
    <div class="login-logo-text">🎨</div>
      <div class="login-logo-text">SPG</div>
      <div class="login-brand">SIAM PALETTE GROUP</div>
      <div class="login-sub">Management System</div>

      <form class="login-form" id="login-form" onsubmit="Screens.doLogin(event)">
        <div class="input-group">
          <label>Email</label>
          <input type="text" class="input-field" id="inp-user" placeholder="email@example.com" autocomplete="username" autofocus>
        </div>
        <div class="input-group">
          <label>Password</label>
          <input type="password" class="input-field" id="inp-pass" placeholder="••••••••" autocomplete="current-password">
        </div>
        <div class="error-msg" id="login-error"></div>
        <button type="submit" class="btn btn-gold btn-full" id="btn-login">Sign In</button>
        <div class="link-text" onclick="App.go('register')">Register</div>
      </form>
    </div>
  </div>`;
}

async function doLogin(e) {
  e.preventDefault();
  const user = $('inp-user').value.trim();
  const pass = $('inp-pass').value;
  
  if (!user || !pass) {
    showFieldError('login-error', 'Please enter email and password');
    return;
  }

  const btn = $('btn-login');
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  hideError('login-error');
  App.showLoader();

  try {
    const data = await API.login(user, pass);

    if (data.account_type === 'individual') {
      // Direct to dashboard
      API.saveSession(data);
      App.go('dashboard');
    } else {
      // Group account → staff selection
      API.saveAccountTemp(data);
      App.go('staff-select');
    }
  } catch (err) {
    showFieldError('login-error', err.message || 'Sign in failed');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  } finally {
    App.hideLoader();
  }
}

function saveApiUrl() {
  const url = $('inp-api-url').value.trim();
  if (!url) return;
  API.setBaseUrl(url);
  App.go('login');
  App.toast('API URL saved', 'success');
}

function showApiConfig() {
  const current = API.getBaseUrl();
  const html = `
  <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">API Settings</div>
      <div class="input-group">
        <label>Apps Script Web App URL</label>
        <input type="url" class="input-field" id="inp-api-url-edit" value="${current}" placeholder="https://script.google.com/macros/s/…/exec">
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-gold btn-full" onclick="API.setBaseUrl($('inp-api-url-edit').value);document.querySelector('.modal-overlay').remove();App.toast('URL updated','success')">บันทึก</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ════════════════════════════════
// S3: STAFF SELECTION (Group)
// ════════════════════════════════
function renderStaffSelect() {
  const acc = API.getAccountTemp();
  if (!acc) return renderLogin();

  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="API.clearSession();App.go('login')">←</button>
      <div>
        <div class="header-title">${esc(acc.display_label)}</div>
        <div class="header-sub">Select your name</div>
      </div>
    </div>
    <div class="screen-body">
      <div class="staff-grid" id="staff-grid">
        <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--tm)">กำลังโหลด...</div>
      </div>
    </div>
  </div>`;
}

async function loadStaffList() {
  const acc = API.getAccountTemp();
  if (!acc) return;
  
  try {
    const data = await API.getUsers(acc.account_id);
    const grid = $('staff-grid');
    if (!grid) return;

    let html = '';
    data.users.forEach(u => {
      html += `
      <div class="staff-card" onclick="Screens.selectStaff('${esc(u.user_id)}')">
        <div class="avatar">${esc(u.avatar_emoji || '👤')}</div>
        <div class="name">${esc(u.display_name)}</div>
      </div>`;
    });

    // Add new staff card
    html += `
    <div class="staff-card add-new" onclick="App.go('new-staff')">
      <div class="avatar">➕</div>
      <div class="name" style="color:var(--tm)">Add Staff</div>
    </div>`;

    grid.innerHTML = html;
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

async function selectStaff(userId) {
  const acc = API.getAccountTemp();
  if (!acc) return;

  // Try without PIN first — if PIN_REQUIRED, show popup
  App.showLoader();
  try {

    const data = await API.switchUser(acc.account_id, userId);
    API.saveSession(data);
    App.hideLoader();
    App.go('dashboard');

  } catch (err) {
    App.hideLoader();
    if (err.key === 'SET_PIN_REQUIRED') {
      showSetPinPopup(userId);
    } else if (err.message && (err.message.includes('PIN') || err.message.includes('pin'))) {
      showPinPopup(userId);
    } else {
      App.toast(err.message, 'error');
    }
  }
}

function showPinPopup(userId) {
  const html = `
  <div class="modal-overlay" id="pin-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Enter PIN</div>
      <div class="input-group">
        <label>6-digit PIN</label>
        <input type="password" class="input-field" id="inp-pin" 
               maxlength="6" inputmode="numeric" pattern="[0-9]{6}" 
               placeholder="••••••" autofocus>
      </div>
      <div class="error-msg" id="pin-error"></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-gold btn-full" onclick="Screens.submitPin('${userId}')">ยืนยัน</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(() => document.getElementById('inp-pin')?.focus(), 100);
}

async function submitPin(userId) {
  const pin = document.getElementById('inp-pin').value.trim();
  if (!pin || pin.length !== 6) {
    showFieldError('pin-error', 'Please enter 6-digit PIN');
    return;
  }
  
  const acc = API.getAccountTemp();
  if (!acc) return;
  
  App.showLoader();
  try {

    const data = await API.switchUser(acc.account_id, userId, pin);
    document.getElementById('pin-modal')?.remove();
    API.saveSession(data);
    App.hideLoader();
    App.go('dashboard');
  } catch (err) {
    App.hideLoader();
    showFieldError('pin-error', err.message || 'Incorrect PIN');

  }
}

function showSetPinPopup(userId) {
  const html = `
  <div class="modal-overlay" id="setpin-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">ตั้ง PIN ใหม่</div>
      <div style="font-size:13px;color:var(--tm);margin-bottom:12px">คุณยังไม่มี PIN กรุณาตั้ง PIN ก่อนเข้าใช้งาน</div>
      <div class="input-group">
        <label>PIN (6 หลัก)</label>
        <input type="password" class="input-field" id="inp-set-pin"
               maxlength="6" inputmode="numeric" pattern="[0-9]{6}"
               placeholder="••••••" autofocus>
      </div>
      <div class="input-group">
        <label>ยืนยัน PIN</label>
        <input type="password" class="input-field" id="inp-set-pin2"
               maxlength="6" inputmode="numeric" pattern="[0-9]{6}"
               placeholder="••••••">
      </div>
      <div class="error-msg" id="setpin-error"></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-gold btn-full" onclick="Screens.submitSetPin('${userId}')">ตั้ง PIN</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(() => document.getElementById('inp-set-pin')?.focus(), 100);
}

async function submitSetPin(userId) {
  const pin1 = ($('inp-set-pin')?.value || '').trim();
  const pin2 = ($('inp-set-pin2')?.value || '').trim();
  if (!pin1 || pin1.length !== 6 || !/^\d{6}$/.test(pin1)) {
    showFieldError('setpin-error', 'PIN ต้องเป็นตัวเลข 6 หลัก');
    return;
  }
  if (pin1 !== pin2) {
    showFieldError('setpin-error', 'PIN ไม่ตรงกัน');
    return;
  }
  const acc = API.getAccountTemp();
  if (!acc) return;
  App.showLoader();
  try {
    await API.setUserPin(acc.account_id, userId, pin1);
    document.getElementById('setpin-modal')?.remove();
    App.toast('ตั้ง PIN สำเร็จ', 'success');
    // Now login with the new PIN
    const data = await API.switchUser(acc.account_id, userId, pin1);
    API.saveSession(data);
    App.hideLoader();
    App.go('dashboard');
  } catch (err) {
    App.hideLoader();
    showFieldError('setpin-error', err.message || 'ตั้ง PIN ไม่สำเร็จ');
  }
}

// ════════════════════════════════
// S4: NEW STAFF REGISTRATION
// ════════════════════════════════
function renderNewStaff() {
  const acc = API.getAccountTemp();
  if (!acc) return renderLogin();

  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('staff-select')">←</button>
      <div class="header-title">Add Staff</div>
    </div>
    <div class="screen-body">
      <form class="reg-form" onsubmit="Screens.doCreateStaff(event)">
        <div class="input-group">
          <label>Display Name</label>
          <input type="text" class="input-field" id="inp-staff-nick" placeholder="e.g. Mint" required>
        </div>
        <div class="input-group">
          <label>Full Name</label>
          <input type="text" class="input-field" id="inp-staff-full" placeholder="First Last" required>
        </div>
          <div class="input-group">
          <label>Phone</label>
          <input type="tel" class="input-field" id="inp-staff-phone" placeholder="0812345678" inputmode="tel">
        </div>
        <div class="input-group">
          <label>PIN (6 digits)</label>
          <input type="password" class="input-field" id="inp-staff-pin" 
                 placeholder="เช่น 123456" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" required>
        </div>
        <div class="error-msg" id="staff-error"></div>
        <button type="submit" class="btn btn-gold btn-full">เพิ่มชื่อ</button>
      </form>
    </div>
  </div>`;
}

async function doCreateStaff(e) {
  e.preventDefault();
  const acc = API.getAccountTemp();
  if (!acc) return;

const display_name = $('inp-staff-nick').value.trim();
  const full_name = $('inp-staff-full').value.trim();
  const pin = $('inp-staff-pin').value.trim();
  const phone = $('inp-staff-phone') ? $('inp-staff-phone').value.trim() : '';

  if (!display_name || !full_name) return showFieldError('staff-error', 'Please fill in all fields');
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) return showFieldError('staff-error', 'PIN must be 6 digits');

  App.showLoader();
  try {
   const data = await API.createUser({ account_id: acc.account_id, display_name, full_name, pin, phone });
    App.toast(`เพิ่ม "${display_name}" สำเร็จ`, 'success');
    // Auto-select the new user
    await selectStaff(data.user_id);
  } catch (err) {
    showFieldError('staff-error', err.message);
    App.hideLoader();
  }
}

// ════════════════════════════════
// S5: HOME DASHBOARD
// ════════════════════════════════
function renderDashboard() {
  const s = API.getSession();
  if (!s) return renderLogin();

  return `
  <div class="screen screen-enter">
    <div class="dashboard-header">
      <div class="dash-greeting">สวัสดี</div>
      <div class="dash-name">${esc(s.display_name || s.display_label)}</div>
      <div class="dash-info">
        <span class="dash-badge badge-tier">${esc(s.tier_id)} — ${esc(s.tier_name)}</span>
        ${s.store_id ? `<span class="dash-badge badge-store">${esc(s.store_id)}</span>` : ''}
        ${s.dept_id ? `<span class="dash-badge badge-dept">${esc(s.dept_id)}</span>` : ''}
      </div>
    </div>

    <div class="screen-body">
      <div class="module-section-title">Modules</div>
      <div class="module-grid" id="module-grid">
        <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--tm)">กำลังโหลด...</div>
      </div>
      <div id="admin-zone"></div>
    </div>

    <div class="bottom-bar">
      <button class="nav-item active" onclick="App.go('dashboard')">
        <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>Home
      </button>
      <button class="nav-item" onclick="App.go('profile')">
        <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>Profile
      </button>
    </div>
  </div>`;
}

async function loadModules() {
  try {
    const data = await API.getModules();
    const grid = $('module-grid');
    const adminZone = $('admin-zone');
    if (!grid) return;

    if (!data.modules || data.modules.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-text">No modules available</div></div>`;
      return;
    }

    let html = '';
    data.modules.forEach(m => {
      // D2: Hide modules with no_access permission
      if (!m.is_accessible && m.access_level === 'no_access') return;

      const statusClass = m.status === 'active' ? 'status-active' : m.status === 'coming_soon' ? 'status-coming' : 'status-disabled';
      const statusLabel = m.status === 'active' ? 'Active' : m.status === 'coming_soon' ? 'Coming Soon' : 'Disabled';
      const disabled = !m.is_accessible ? 'disabled' : '';

      html += `
      <div class="module-card ${disabled}" ${m.is_accessible && m.app_url ? `onclick="Screens.launchModule('${esc(m.app_url)}')"` : ''}>
        <span class="mod-status ${statusClass}">${statusLabel}</span>
        <div class="mod-icon">${esc(m.icon)}</div>
        <div class="mod-name">${esc(m.module_name)}</div>
        <div class="mod-name-en">${esc(m.module_name_en)}</div>
      </div>`;
    });
    grid.innerHTML = html || '<div class="empty-state" style="grid-column:1/-1"><div class="empty-text">No modules available</div></div>';

    // Show admin card for T1/T2
    if (adminZone && data.tier_level <= 2) {
      adminZone.innerHTML = `
      <div style="padding:0 0 8px"><div class="module-section-title">Administration</div></div>
      <div class="admin-card" onclick="App.go('admin')">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="admin-icon" style="font-size:20px;color:var(--gold)">⚙</span>
          <div>
            <div class="admin-label">Admin Panel</div>
            <div class="admin-sub">Accounts, Permissions, Registrations</div>
          </div>
        </div>
      </div>`;
    }
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

function launchModule(url) {
  const s = API.getSession();
  if (!s) return;
  const sep = url.includes('?') ? '&' : '?';
  window.open(`${url}${sep}token=${s.token}`, '_blank');
}

// ════════════════════════════════
// S6: USER PROFILE
// ════════════════════════════════
function renderProfile() {
  const s = API.getSession();
  if (!s) return renderLogin();

  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('dashboard')">←</button>
      <div class="header-title">Profile</div>
    </div>
    <div class="screen-body">
      <div id="profile-content">
        <div style="text-align:center;padding:40px;color:var(--tm)">Loading...</div>
      </div>
      <div id="profile-actions" style="padding:16px;display:flex;flex-direction:column;gap:8px">
        ${s.account_type === 'group'
          ? `<button class="btn btn-outline btn-full" onclick="Screens.showChangePin()">Change PIN</button>
             <button class="btn btn-outline btn-full" onclick="Screens.switchUserFlow()">Switch User</button>`
          : `<button class="btn btn-outline btn-full" onclick="Screens.showChangePassword()">Change Password</button>`
        }
        <button class="btn btn-danger btn-full" onclick="Screens.doLogout()">Logout</button>
      </div>
    </div>
    <div class="bottom-bar">
      <button class="nav-item" onclick="App.go('dashboard')">
        <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>Home
      </button>
      <button class="nav-item active" onclick="App.go('profile')">
        <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>Profile
      </button>
    </div>
  </div>`;
}

let _profileData = null;
let _profileEditing = false;

async function loadProfile() {
  try {
    const data = await API.getProfile();
    _profileData = data;
    _profileEditing = false;
    renderProfileContent(data);
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

function renderProfileContent(data) {
  const el = $('profile-content');
  if (!el) return;

  el.innerHTML = `
  <div class="profile-avatar">
    <div class="emoji">${esc(data.avatar_emoji || '👤')}</div>
    <div class="name">${esc(data.display_name || data.full_name)}</div>
    <div class="sub">${esc(data.username)}</div>
  </div>
  <div class="profile-section">
    <div class="profile-row"><span class="label">Full Name</span><span class="value">${esc(data.full_name)}</span></div>
    <div class="profile-row">
      <span class="label">Display Name</span>
      <span class="value" id="pf-nick-view">${esc(data.display_name)}</span>
    </div>
    <div class="profile-row"><span class="label">Account</span><span class="value">${esc(data.account_id)} (${esc(data.account_type)})</span></div>
    <div class="profile-row"><span class="label">Tier</span><span class="value">${esc(data.tier_id)} — ${esc(data.tier_name)}</span></div>
    <div class="profile-row"><span class="label">Store</span><span class="value">${esc(data.store_name_th || data.store_id || '-')}</span></div>
    <div class="profile-row"><span class="label">Department</span><span class="value">${esc(data.dept_name_th || data.dept_id || '-')}</span></div>
    ${data.email ? `<div class="profile-row"><span class="label">Email</span><span class="value">${esc(data.email)}</span></div>` : ''}
    <div class="profile-row">
      <span class="label">Phone</span>
      <span class="value" id="pf-phone-view">${esc(data.phone || '-')}</span>
    </div>
  </div>
  <div style="padding:8px 16px">
    <button class="btn btn-outline btn-full" onclick="Screens.toggleProfileEdit()">Edit Profile</button>
  </div>
  <div class="profile-section" style="margin-top:4px">
    <div class="profile-row"><span class="label">Session Expires</span><span class="value">${formatDate(data.session_expires_at)}</span></div>
    <div class="profile-row"><span class="label">User ID</span><span class="value" style="font-size:11px">${esc(data.user_id)}</span></div>
  </div>`;
}

function toggleProfileEdit() {
  if (!_profileData) return;
  const el = $('profile-content');
  if (!el) return;

  el.innerHTML = `
  <div class="profile-avatar">
    <div class="emoji">${esc(_profileData.avatar_emoji || '👤')}</div>
    <div class="name">${esc(_profileData.display_name || _profileData.full_name)}</div>
    <div class="sub">${esc(_profileData.username)}</div>
  </div>
  <div class="profile-section">
    <div class="profile-row"><span class="label">Full Name</span><span class="value">${esc(_profileData.full_name)}</span></div>
    <div class="profile-row" style="flex-direction:column;align-items:stretch">
      <span class="label">Display Name</span>
      <input type="text" class="input-field input-sm" id="pf-edit-nick" value="${esc(_profileData.display_name || '')}">
    </div>
    <div class="profile-row"><span class="label">Account</span><span class="value">${esc(_profileData.account_id)} (${esc(_profileData.account_type)})</span></div>
    <div class="profile-row"><span class="label">Tier</span><span class="value">${esc(_profileData.tier_id)} — ${esc(_profileData.tier_name)}</span></div>
    <div class="profile-row"><span class="label">Store</span><span class="value">${esc(_profileData.store_name_th || _profileData.store_id || '-')}</span></div>
    <div class="profile-row"><span class="label">Department</span><span class="value">${esc(_profileData.dept_name_th || _profileData.dept_id || '-')}</span></div>
    ${_profileData.email ? `<div class="profile-row"><span class="label">Email</span><span class="value">${esc(_profileData.email)}</span></div>` : ''}
    <div class="profile-row" style="flex-direction:column;align-items:stretch">
      <span class="label">Phone</span>
      <input type="tel" class="input-field input-sm" id="pf-edit-phone" value="${esc(_profileData.phone || '')}" inputmode="tel">
    </div>
  </div>
  <div class="error-msg" id="pf-edit-error"></div>
  <div style="padding:8px 16px;display:flex;gap:8px">
    <button class="btn btn-gold" style="flex:1" onclick="Screens.saveProfileEdit()">Save</button>
    <button class="btn btn-outline" style="flex:1" onclick="Screens.cancelProfileEdit()">Cancel</button>
  </div>`;
}

function cancelProfileEdit() {
  if (_profileData) renderProfileContent(_profileData);
}

async function saveProfileEdit() {
  const display_name = document.getElementById('pf-edit-nick')?.value.trim();
  const phone = document.getElementById('pf-edit-phone')?.value.trim();

  if (!display_name) {
    showFieldError('pf-edit-error', 'Display name is required');
    return;
  }

  App.showLoader();
  try {
    await API.updateProfile({ display_name, phone });
    App.hideLoader();
    App.toast('Profile updated', 'success');
    // Reload fresh data
    await loadProfile();
  } catch (err) {
    App.hideLoader();
    showFieldError('pf-edit-error', err.message || 'Update failed');
  }
}

async function doLogout() {
  App.showLoader();
  try {
    await API.logout();
  } catch { /* ignore */ }
  API.clearSession();
  App.hideLoader();
  App.go('login');
  App.toast('Signed out', 'info');
}

function switchUserFlow() {
  const s = API.getSession();
  if (!s) return;
  // Re-use account info for staff selection
  API.saveAccountTemp({
    account_id: s.account_id,
    display_label: s.display_label,
    tier_id: s.tier_id,
    store_id: s.store_id
  });
  App.go('staff-select');
}

// ════════════════════════════════
// F1: CHANGE PASSWORD (Individual)
// ════════════════════════════════
function showChangePassword() {
  const html = `
  <div class="modal-overlay" id="pass-change-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-close" onclick="document.getElementById('pass-change-modal').remove()">✕</div>
      <div class="modal-title">Change Password</div>
      <div class="input-group">
        <label>Current Password</label>
        <input type="password" class="input-field" id="inp-old-pass" placeholder="Current password" autocomplete="current-password">
      </div>
      <div class="input-group">
        <label>New Password (min 8 characters)</label>
        <input type="password" class="input-field" id="inp-new-pass" placeholder="New password" autocomplete="new-password">
      </div>
      <div class="input-group">
        <label>Confirm New Password</label>
        <input type="password" class="input-field" id="inp-confirm-pass" placeholder="Re-enter new password" autocomplete="new-password">
      </div>
      <div class="error-msg" id="pass-change-error"></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-gold btn-full" onclick="Screens.doChangePassword()">Change Password</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doChangePassword() {
  const current_password = document.getElementById('inp-old-pass').value;
  const new_password = document.getElementById('inp-new-pass').value;
  const confirm_password = document.getElementById('inp-confirm-pass').value;

  if (!new_password || new_password.length < 8) {
    showFieldError('pass-change-error', 'New password must be at least 8 characters');
    return;
  }
  if (new_password !== confirm_password) {
    showFieldError('pass-change-error', 'Passwords do not match');
    return;
  }

  App.showLoader();
  try {
    await API.changePassword({ current_password, new_password });
    document.getElementById('pass-change-modal')?.remove();
    App.hideLoader();
    App.toast('Password changed', 'success');
  } catch (err) {
    App.hideLoader();
    showFieldError('pass-change-error', err.message || 'Failed to change password');
  }
}

// ════════════════════════════════

// CHANGE PIN POPUP

// ════════════════════════════════

function showChangePin() {
  const html = `
  <div class="modal-overlay" id="pin-change-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-close" onclick="document.getElementById('pin-change-modal').remove()">✕</div>
      <div class="modal-title">Change PIN</div>
      <div class="input-group">
        <label>New PIN</label>
        <input type="password" class="input-field" id="inp-new-pin" maxlength="6" inputmode="numeric" placeholder="New 6-digit PIN" autofocus>
      </div>
      <div class="input-group">
        <label>Confirm New PIN</label>
        <input type="password" class="input-field" id="inp-confirm-pin" maxlength="6" inputmode="numeric" placeholder="Re-enter new PIN">
      </div>
      <div class="error-msg" id="pin-change-error"></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-gold btn-full" onclick="Screens.doChangePin()">Change PIN</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doChangePin() {
  const new_pin = document.getElementById('inp-new-pin').value.trim();
  const confirm_pin = document.getElementById('inp-confirm-pin').value.trim();

  if (!new_pin || new_pin.length !== 6 || !/^\d{6}$/.test(new_pin)) {
    showFieldError('pin-change-error', 'New PIN must be 6 digits');
    return;
  }
  if (new_pin !== confirm_pin) {
    showFieldError('pin-change-error', 'PINs do not match');
    return;
  }

  App.showLoader();
  try {
    await API.changePin({ new_pin });

    document.getElementById('pin-change-modal')?.remove();

    App.hideLoader();

    App.toast('PIN changed', 'success');

  } catch (err) {

    App.hideLoader();

    showFieldError('pin-change-error', err.message || 'Failed to change PIN');

  }

}

// ════════════════════════════════
// HELPERS (used by all screens)
// ════════════════════════════════
function $(id) { return document.getElementById(id); }

function esc(str) {
  if (str === null || str === undefined) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function showFieldError(id, msg) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function hideError(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('show');
}

function formatDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function formatShortDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

// ════════════════════════════════
// PUBLIC EXPORTS (Part 1)
// ════════════════════════════════
return {
  $, esc, showFieldError, hideError, formatDate, formatShortDate,
  renderLogin, doLogin, saveApiUrl, showApiConfig,
  renderStaffSelect, loadStaffList, selectStaff, showPinPopup, submitPin, showSetPinPopup, submitSetPin,
  renderNewStaff, doCreateStaff,
  renderDashboard, loadModules, launchModule,
  renderProfile, loadProfile, doLogout, switchUserFlow,
  toggleProfileEdit, cancelProfileEdit, saveProfileEdit,
  showChangePassword, doChangePassword,
  showChangePin, doChangePin

};

})();
