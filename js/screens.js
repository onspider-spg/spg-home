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
  const needsConfig = !API.getBaseUrl();
  
  return `
  <div class="screen screen-enter">
    <div class="login-screen">
      <div class="login-logo">🏛️</div>
      <div class="login-brand">SIAM PALETTE GROUP</div>
      <div class="login-sub">SPG App Home</div>

      ${needsConfig ? `
      <div class="login-form" id="config-form">
        <div class="input-group">
          <label>API URL (Apps Script Web App)</label>
          <input type="url" class="input-field" id="inp-api-url" 
                 placeholder="https://script.google.com/macros/s/…/exec">
        </div>
        <button class="btn btn-outline btn-full" onclick="Screens.saveApiUrl()">บันทึก URL</button>
      </div>
      ` : ''}

      <form class="login-form" id="login-form" onsubmit="Screens.doLogin(event)" ${needsConfig ? 'style="display:none"' : ''}>
        <div class="input-group">
          <label>ชื่อผู้ใช้</label>
          <input type="text" class="input-field" id="inp-user" placeholder="username" autocomplete="username" autofocus>
        </div>
        <div class="input-group">
          <label>รหัสผ่าน</label>
          <input type="password" class="input-field" id="inp-pass" placeholder="••••••••" autocomplete="current-password">
        </div>
        <div class="error-msg" id="login-error"></div>
        <button type="submit" class="btn btn-gold btn-full" id="btn-login">เข้าสู่ระบบ</button>
        <div class="link-text" onclick="App.go('register')">สมัครสมาชิกใหม่</div>
      </form>

      ${needsConfig ? '' : `
      <div style="margin-top:16px">
        <div class="link-text" onclick="Screens.showApiConfig()" style="font-size:11px;color:var(--tm)">⚙️ ตั้งค่า API URL</div>
      </div>`}
    </div>
  </div>`;
}

async function doLogin(e) {
  e.preventDefault();
  const user = $('inp-user').value.trim();
  const pass = $('inp-pass').value;
  
  if (!user || !pass) {
    showFieldError('login-error', 'กรุณากรอก username และ password');
    return;
  }

  const btn = $('btn-login');
  btn.disabled = true;
  btn.textContent = 'กำลังเข้าสู่ระบบ...';
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
    showFieldError('login-error', err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    btn.disabled = false;
    btn.textContent = 'เข้าสู่ระบบ';
  } finally {
    App.hideLoader();
  }
}

function saveApiUrl() {
  const url = $('inp-api-url').value.trim();
  if (!url) return;
  API.setBaseUrl(url);
  App.go('login');
  App.toast('บันทึก API URL แล้ว', 'success');
}

function showApiConfig() {
  const current = API.getBaseUrl();
  const html = `
  <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">⚙️ ตั้งค่า API URL</div>
      <div class="input-group">
        <label>Apps Script Web App URL</label>
        <input type="url" class="input-field" id="inp-api-url-edit" value="${current}" placeholder="https://script.google.com/macros/s/…/exec">
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-gold btn-full" onclick="API.setBaseUrl($('inp-api-url-edit').value);document.querySelector('.modal-overlay').remove();App.toast('อัปเดต URL แล้ว','success')">บันทึก</button>
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
        <div class="header-sub">เลือกชื่อของคุณ</div>
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
      <div class="name" style="color:var(--tm)">เพิ่มชื่อ</div>
    </div>`;

    grid.innerHTML = html;
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

async function selectStaff(userId) {
  const acc = API.getAccountTemp();
  if (!acc) return;

  App.showLoader();
  try {
    const data = await API.switchUser(acc.account_id, userId);
    API.saveSession(data);
    App.go('dashboard');
  } catch (err) {
    App.toast(err.message, 'error');
  } finally {
    App.hideLoader();
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
      <div class="header-title">เพิ่มชื่อพนักงาน</div>
    </div>
    <div class="screen-body">
      <form class="reg-form" onsubmit="Screens.doCreateStaff(event)">
        <div class="input-group">
          <label>ชื่อเล่น (แสดงในระบบ)</label>
          <input type="text" class="input-field" id="inp-staff-nick" placeholder="เช่น น้องมิ้น" required>
        </div>
        <div class="input-group">
          <label>ชื่อ-นามสกุล</label>
          <input type="text" class="input-field" id="inp-staff-full" placeholder="ชื่อจริง นามสกุล" required>
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
  if (!display_name || !full_name) return showFieldError('staff-error', 'กรุณากรอกข้อมูลให้ครบ');

  App.showLoader();
  try {
    const data = await API.createUser({ account_id: acc.account_id, display_name, full_name });
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
      <div class="module-section-title">โมดูล</div>
      <div class="module-grid" id="module-grid">
        <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--tm)">กำลังโหลด...</div>
      </div>
      <div id="admin-zone"></div>
    </div>

    <div class="bottom-bar">
      <button class="nav-item active" onclick="App.go('dashboard')">
        <span class="nav-icon">🏠</span>หน้าหลัก
      </button>
      <button class="nav-item" onclick="App.go('profile')">
        <span class="nav-icon">👤</span>โปรไฟล์
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
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📦</div><div class="empty-text">ยังไม่มีโมดูล</div></div>`;
      return;
    }

    let html = '';
    data.modules.forEach(m => {
      const statusClass = m.status === 'active' ? 'status-active' : m.status === 'coming_soon' ? 'status-coming' : 'status-disabled';
      const statusLabel = m.status === 'active' ? 'Active' : m.status === 'coming_soon' ? 'เร็วๆ นี้' : 'ปิดใช้งาน';
      const disabled = !m.is_accessible ? 'disabled' : '';

      html += `
      <div class="module-card ${disabled}" ${m.is_accessible && m.app_url ? `onclick="Screens.launchModule('${esc(m.app_url)}')"` : ''}>
        <span class="mod-status ${statusClass}">${statusLabel}</span>
        <div class="mod-icon">${esc(m.icon)}</div>
        <div class="mod-name">${esc(m.module_name)}</div>
        <div class="mod-name-en">${esc(m.module_name_en)}</div>
      </div>`;
    });
    grid.innerHTML = html;

    // Show admin card for T1/T2
    if (adminZone && data.tier_level <= 2) {
      adminZone.innerHTML = `
      <div style="padding:0 0 8px"><div class="module-section-title">ผู้ดูแลระบบ</div></div>
      <div class="admin-card" onclick="App.go('admin')">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="admin-icon">⚙️</span>
          <div>
            <div class="admin-label">Admin Panel</div>
            <div class="admin-sub">จัดการบัญชี สิทธิ์ คำขอลงทะเบียน</div>
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
      <div class="header-title">โปรไฟล์</div>
    </div>
    <div class="screen-body">
      <div id="profile-content">
        <div style="text-align:center;padding:40px;color:var(--tm)">กำลังโหลด...</div>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
        ${s.account_type === 'group' ? `<button class="btn btn-outline btn-full" onclick="Screens.switchUserFlow()">🔄 เปลี่ยนชื่อผู้ใช้</button>` : ''}
        <button class="btn btn-danger btn-full" onclick="Screens.doLogout()">ออกจากระบบ</button>
      </div>
    </div>
    <div class="bottom-bar">
      <button class="nav-item" onclick="App.go('dashboard')">
        <span class="nav-icon">🏠</span>หน้าหลัก
      </button>
      <button class="nav-item active" onclick="App.go('profile')">
        <span class="nav-icon">👤</span>โปรไฟล์
      </button>
    </div>
  </div>`;
}

async function loadProfile() {
  try {
    const data = await API.getProfile();
    const el = $('profile-content');
    if (!el) return;

    el.innerHTML = `
    <div class="profile-avatar">
      <div class="emoji">${esc(data.avatar_emoji || '👤')}</div>
      <div class="name">${esc(data.display_name || data.full_name)}</div>
      <div class="sub">${esc(data.username)}</div>
    </div>
    <div class="profile-section">
      <div class="profile-row"><span class="label">ชื่อ-นามสกุล</span><span class="value">${esc(data.full_name)}</span></div>
      <div class="profile-row"><span class="label">ชื่อแสดง</span><span class="value">${esc(data.display_name)}</span></div>
      <div class="profile-row"><span class="label">บัญชี</span><span class="value">${esc(data.account_id)} (${esc(data.account_type)})</span></div>
      <div class="profile-row"><span class="label">ระดับสิทธิ์</span><span class="value">${esc(data.tier_id)} — ${esc(data.tier_name)}</span></div>
      <div class="profile-row"><span class="label">ร้าน</span><span class="value">${esc(data.store_name_th || data.store_id || '-')}</span></div>
      <div class="profile-row"><span class="label">แผนก</span><span class="value">${esc(data.dept_name_th || data.dept_id || '-')}</span></div>
      ${data.email ? `<div class="profile-row"><span class="label">อีเมล</span><span class="value">${esc(data.email)}</span></div>` : ''}
    </div>
    <div class="profile-section">
      <div class="profile-row"><span class="label">Session หมดอายุ</span><span class="value">${formatDate(data.session_expires_at)}</span></div>
      <div class="profile-row"><span class="label">User ID</span><span class="value" style="font-size:11px">${esc(data.user_id)}</span></div>
    </div>`;
  } catch (err) {
    App.toast(err.message, 'error');
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
  App.toast('ออกจากระบบแล้ว', 'info');
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
  renderStaffSelect, loadStaffList, selectStaff,
  renderNewStaff, doCreateStaff,
  renderDashboard, loadModules, launchModule,
  renderProfile, loadProfile, doLogout, switchUserFlow
};

})();
