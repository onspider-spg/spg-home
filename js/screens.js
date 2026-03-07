/**
 * Version 2.3.1 | 7 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG App — Home Module Frontend
 * screens.js — Screen Renderers S1–S6
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
      <div style="font-size:48px;margin-bottom:6px">🎨</div>
      <div class="login-logo-text">SPG</div>
      <div class="login-brand">SIAM PALETTE GROUP</div>
      <div class="login-sub">Management System</div>

      <form class="login-form" id="login-form" onsubmit="Screens.doLogin(event)">
        <div class="input-group">
          <label>Email / Username</label>
          <input type="text" class="input-field" id="inp-user" placeholder="email@example.com หรือ username" autocomplete="username" autofocus>
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
      <div style="flex:1">
        <div class="header-title">เลือกบัญชี</div>
        <div class="header-sub">${esc(acc.display_label)} · Select your name</div>
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
      const initial = (u.display_name || '?').charAt(0).toUpperCase();
      const emoji = u.avatar_emoji && u.avatar_emoji !== '👤' ? u.avatar_emoji : '';
      html += `
      <div class="staff-card" onclick="Screens.selectStaff('${esc(u.user_id)}')">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--gold-bg2),#f9e8c0);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:${emoji ? '24px' : '18px'};font-weight:700;color:var(--gold);margin:0 auto 8px">${emoji || esc(initial)}</div>
        <div class="name">${esc(u.display_name)}</div>
        ${acc.store_id ? `<div style="font-size:9px;color:var(--gold);font-weight:600;margin-top:2px">${esc(acc.store_id)}</div>` : ''}
        ${acc.tier_id ? `<div style="font-size:8px;color:var(--tm);margin-top:2px">${esc(acc.tier_id)}</div>` : ''}
      </div>`;
    });

    // Add new staff card
    html += `
    <div class="staff-card add-new" onclick="App.go('new-staff')">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--s2);border:2px dashed var(--b2);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--tm);margin:0 auto 8px">➕</div>
      <div class="name" style="color:var(--tm)">เพิ่มบัญชี</div>
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
      <div class="header-title">เพิ่มบัญชีใหม่</div>
    </div>
    <div class="screen-body">
      <div style="padding:10px 14px;background:var(--blue-bg);border-radius:var(--radius-sm);font-size:12px;color:var(--blue);margin-bottom:14px">
        สร้าง account ใหม่ภายใต้: <strong>${esc(acc.display_label)}</strong>
      </div>
      <form class="reg-form" style="padding:0" onsubmit="Screens.doCreateStaff(event)">
        <div class="input-group">
          <label>Display Name *</label>
          <input type="text" class="input-field" id="inp-staff-nick" placeholder="e.g. Junnie-GB" required>
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
        <button type="submit" class="btn btn-gold btn-full">สร้างบัญชี</button>
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

  const tierLevel = parseInt((s.tier_id || 'T9').replace('T', ''));

  // KPI section by tier
  let kpiHtml = '';
  if (tierLevel <= 2) {
    // T1-T2: Owner — Total Sales, Labour%, Pending
    kpiHtml = `
      <div style="display:grid;grid-template-columns:3fr 1.5fr 1.5fr;gap:10px;margin-bottom:12px">
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-left:4px solid var(--gold);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">● Total Sales Today</div>
          <div style="font-size:28px;font-weight:800;color:var(--green);margin:4px 0" id="kpi-sales">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-sales-sub">Loading...</div>
        </div>
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">Labour</div>
          <div style="font-size:22px;font-weight:800;color:var(--green);margin:4px 0" id="kpi-labour">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-labour-sub"></div>
        </div>
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">Pending</div>
          <div style="font-size:22px;font-weight:800;color:var(--orange);margin:4px 0" id="kpi-pending">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-pending-sub"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="padding:14px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div class="module-section-title" style="padding:0 0 8px;margin:0">Needs Attention</div>
          <div id="dash-attention" style="font-size:12px;color:var(--tm)">Loading...</div>
        </div>
        <div style="padding:14px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div class="module-section-title" style="padding:0 0 8px;margin:0">Store Health</div>
          <div id="dash-health" style="font-size:12px;color:var(--tm)">Loading...</div>
        </div>
      </div>`;
  } else if (tierLevel <= 4) {
    // T3-T4: Manager — My Store Sales, Staff on Shift, Daily Report
    kpiHtml = `
      <div style="display:grid;grid-template-columns:3fr 1.5fr 1.5fr;gap:10px;margin-bottom:12px">
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-left:4px solid var(--gold);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">● My Store Sales</div>
          <div style="font-size:28px;font-weight:800;color:var(--green);margin:4px 0" id="kpi-sales">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-sales-sub">${esc(s.store_id || '')}</div>
        </div>
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">Staff on Shift</div>
          <div style="font-size:22px;font-weight:800;color:var(--t);margin:4px 0" id="kpi-staff">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-staff-sub"></div>
        </div>
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">Daily Report</div>
          <div style="font-size:14px;font-weight:700;color:var(--red);margin:4px 0" id="kpi-report">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-report-sub"></div>
        </div>
      </div>
      <div style="padding:14px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:12px">
        <div class="module-section-title" style="padding:0 0 8px;margin:0">Needs Attention</div>
        <div id="dash-attention" style="font-size:12px;color:var(--tm)">No issues</div>
      </div>`;
  } else {
    // T5-T7: Staff — Shift, Tasks, BC Order
    kpiHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-left:4px solid var(--blue);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">Shift Today</div>
          <div style="font-size:18px;font-weight:800;color:var(--t);margin:4px 0" id="kpi-shift">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-shift-sub">${esc(s.store_id || '')} · ${esc(s.dept_id || '')}</div>
        </div>
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">Tasks Today</div>
          <div style="font-size:22px;font-weight:800;color:var(--purple);margin:4px 0" id="kpi-tasks">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-tasks-sub"></div>
        </div>
        <div style="padding:16px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--td)">BC Order Prep</div>
          <div style="font-size:22px;font-weight:800;color:var(--orange);margin:4px 0" id="kpi-bc">—</div>
          <div style="font-size:10px;color:var(--tm)" id="kpi-bc-sub"></div>
        </div>
      </div>
      <div style="padding:14px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:12px">
        <div class="module-section-title" style="padding:0 0 8px;margin:0">To Do</div>
        <div id="dash-todo" style="font-size:12px;color:var(--tm)">No tasks</div>
      </div>`;
  }

  // Quick Actions by tier
  let quickHtml = '';
  if (tierLevel <= 2) {
    quickHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">Daily Report</div>
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">Add Expense</div>
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">Review Payroll</div>
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">View P&L</div>
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">Supplier Invoice</div>
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">Report Issue</div>
      </div>`;
  } else if (tierLevel <= 4) {
    quickHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">Submit Daily Report</div>
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">BC Order</div>
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">Report Issue</div>
        <div style="padding:8px;background:var(--s1);border-radius:6px;font-size:10px;text-align:center;color:var(--td);cursor:pointer" onclick="App.toast('Coming soon','info')">Upload Receipt</div>
      </div>`;
  } else {
    quickHtml = '';
  }

  return `
  <div class="screen screen-enter">
    ${renderTopbar('Siam Palette Group', 'Home')}

    <div class="screen-body">
      <div class="dashboard-header">
        <div class="dash-greeting">สวัสดี</div>
        <div class="dash-name">${esc(s.display_name || s.display_label)}</div>
        <div class="dash-info">
          <span class="dash-badge badge-tier">${esc(s.tier_id)}${s.tier_name ? ' — ' + esc(s.tier_name) : ''}</span>
          ${s.store_id ? `<span class="dash-badge badge-store">${esc(s.store_id)}</span>` : ''}
          ${s.dept_id ? `<span class="dash-badge badge-dept">${esc(s.dept_id)}</span>` : ''}
        </div>
      </div>

      ${kpiHtml}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="padding:14px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div class="module-section-title" style="padding:0 0 8px;margin:0">Modules</div>
          <div id="module-grid">
            <div style="text-align:center;padding:12px;color:var(--tm);font-size:12px">Loading...</div>
          </div>
        </div>
        ${quickHtml ? `
        <div style="padding:14px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div class="module-section-title" style="padding:0 0 8px;margin:0">Quick Actions</div>
          ${quickHtml}
        </div>` : `
        <div style="padding:14px;background:var(--bg);border:1.5px solid var(--b1);border-radius:var(--radius);box-shadow:var(--shadow)">
          <div class="module-section-title" style="padding:0 0 8px;margin:0">Quick Actions</div>
          <div style="font-size:11px;color:var(--tm);text-align:center;padding:12px">—</div>
        </div>`}
      </div>

      <div id="admin-zone"></div>
    </div>

    <div class="bottom-bar">
      <button class="nav-item active" onclick="App.go('dashboard')">Home</button>
      <button class="nav-item" onclick="App.go('profile')">Profile</button>
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
      grid.innerHTML = `<div style="text-align:center;padding:16px;color:var(--tm);font-size:12px">No modules available</div>`;
      return;
    }

    // Render modules as list (wireframe style)
    let html = '';
    data.modules.forEach(m => {
      if (!m.is_accessible && m.access_level === 'no_access') return;

      const disabled = !m.is_accessible;
      const statusDot = m.status === 'active' ? 'var(--green)' : 'var(--orange)';

      if (disabled) {
        html += `
        <div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;opacity:.4">
          <span style="width:6px;height:6px;border-radius:50%;background:${statusDot};flex-shrink:0"></span>
          <span style="font-size:12px;font-weight:500;flex:1;color:var(--tm)">${esc(m.module_name_en || m.module_name)} <span style="font-size:10px;color:var(--tm)">— coming soon</span></span>
        </div>`;
      } else {
        html += `
        <div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;cursor:pointer;transition:background .15s" onclick="Screens.launchModule('${esc(m.app_url)}')" onmouseover="this.style.background='var(--gold-bg)'" onmouseout="this.style.background='transparent'">
          <span style="width:6px;height:6px;border-radius:50%;background:${statusDot};flex-shrink:0"></span>
          <span style="font-size:12px;font-weight:600;flex:1">${esc(m.module_name_en || m.module_name)}${m.module_name ? ` <span style="font-size:10px;font-weight:400;color:var(--td)">· ${esc(m.module_name)}</span>` : ''}</span>
        </div>`;
      }
    });
    grid.innerHTML = html || '<div style="text-align:center;padding:16px;color:var(--tm);font-size:12px">No modules available</div>';

    // Feed sidebar modules
    App.updateSidebarModules(data.modules);

    // Show admin card for T1/T2
    if (adminZone && data.tier_level <= 2) {
      adminZone.innerHTML = `
      <div class="module-section-title">Administration</div>
      <div class="admin-card" onclick="App.go('admin')">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:20px;color:var(--gold)">⚙️</span>
          <div>
            <div class="admin-label">Admin Panel</div>
            <div class="admin-sub">Accounts, Permissions, Registrations</div>
          </div>
          <span style="margin-left:auto;color:var(--b3)">→</span>
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
  window.open(`${url}${sep}token=${s.token}`, '_self');
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
      <div id="profile-actions" style="display:flex;flex-direction:column;gap:6px;padding-top:8px">
        <button class="btn btn-outline btn-full" onclick="Screens.toggleProfileEdit()">✏️ Edit Profile</button>
        ${s.account_type === 'group'
          ? `<button class="btn btn-outline btn-full" onclick="Screens.showChangePin()">🔢 Change PIN</button>
             <button class="btn btn-outline btn-full" onclick="Screens.switchUserFlow()">👥 Switch User</button>`
          : `<button class="btn btn-outline btn-full" onclick="Screens.showChangePassword()">🔑 Change Password</button>`
        }
        <button class="btn btn-danger btn-full" onclick="Screens.doLogout()">Log out</button>
      </div>
    </div>
    <div class="bottom-bar">
      <button class="nav-item" onclick="App.go('dashboard')">Home</button>
      <button class="nav-item active" onclick="App.go('profile')">Profile</button>
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

  const initial = (data.display_name || data.full_name || '?').charAt(0).toUpperCase();

  el.innerHTML = `
  <div class="profile-avatar">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--gold-bg2),#f9e8c0);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:var(--gold);margin:0 auto">${esc(initial)}</div>
    <div class="name">${esc(data.display_name || data.full_name)}</div>
    <div class="sub">${esc(data.username)}</div>
  </div>
  <div class="profile-section">
    <div class="profile-row"><span class="label">Full Name</span><span class="value">${esc(data.full_name)}</span></div>
    <div class="profile-row">
      <span class="label">Display Name</span>
      <span class="value" id="pf-nick-view">${esc(data.display_name)}</span>
    </div>
    <div class="profile-row"><span class="label">Tier</span><span class="value"><span style="padding:2px 8px;border-radius:8px;background:var(--gold-bg2);color:var(--gold);font-size:11px;font-weight:600">${esc(data.tier_id)} — ${esc(data.tier_name)}</span></span></div>
    <div class="profile-row"><span class="label">Store</span><span class="value">${esc(data.store_name_th || data.store_id || '-')}</span></div>
    <div class="profile-row"><span class="label">Department</span><span class="value">${esc(data.dept_name_th || data.dept_id || '-')}</span></div>
    ${data.email ? `<div class="profile-row"><span class="label">Email</span><span class="value">${esc(data.email)}</span></div>` : ''}
    <div class="profile-row">
      <span class="label">Phone</span>
      <span class="value" id="pf-phone-view">${esc(data.phone || '-')}</span>
    </div>
  </div>
  <div class="profile-section" style="margin-top:4px">
    <div class="profile-row"><span class="label">Session Expires</span><span class="value">${formatDate(data.session_expires_at)}</span></div>
    <div class="profile-row"><span class="label">User ID</span><span class="value" style="font-size:11px">${esc(data.user_id)}</span></div>
  </div>`;
}

function toggleProfileEdit() {
  if (!_profileData) return;
  const initial = (_profileData.display_name || _profileData.full_name || '?').charAt(0).toUpperCase();
  const html = `
  <div class="modal-overlay" id="edit-profile-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-close" onclick="document.getElementById('edit-profile-modal').remove()">✕</div>
      <div class="modal-title">✏️ Edit Profile</div>
      <div style="text-align:center;margin-bottom:12px">
        <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--gold-bg2),#f9e8c0);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--gold);margin:0 auto">${esc(initial)}</div>
      </div>
      <div class="input-group" style="margin-bottom:10px">
        <label>Display Name *</label>
        <input type="text" class="input-field" id="pf-edit-nick" value="${esc(_profileData.display_name || '')}">
      </div>
      <div class="input-group" style="margin-bottom:10px">
        <label>Full Name</label>
        <input type="text" class="input-field" id="pf-edit-full" value="${esc(_profileData.full_name || '')}" readonly style="opacity:.6">
      </div>
      <div class="input-group" style="margin-bottom:10px">
        <label>Phone</label>
        <input type="tel" class="input-field" id="pf-edit-phone" value="${esc(_profileData.phone || '')}" inputmode="tel">
      </div>
      ${_profileData.email ? `<div class="input-group" style="margin-bottom:10px">
        <label>Email <span style="color:var(--tm)">(read-only)</span></label>
        <input type="text" class="input-field" value="${esc(_profileData.email)}" readonly style="opacity:.6">
      </div>` : ''}
      <div class="error-msg" id="pf-edit-error"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-outline" style="flex:1" onclick="document.getElementById('edit-profile-modal').remove()">ยกเลิก</button>
        <button class="btn btn-gold" style="flex:1" onclick="Screens.saveProfileEdit()">💾 บันทึก</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function cancelProfileEdit() {
  document.getElementById('edit-profile-modal')?.remove();
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
    document.getElementById('edit-profile-modal')?.remove();
    App.hideLoader();
    App.toast('Profile updated', 'success');
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
  localStorage.removeItem('spg_token');
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
// TOPBAR — ☰ + SPG Logo + Title + 🔔 + Avatar
// (Used by S5, S6, S9, S10, S11, S12 — Phase 3+)
// ════════════════════════════════
function renderTopbar(title, subtitle) {
  const s = API.getSession();
  const initial = s ? (s.display_name || s.display_label || '?').charAt(0).toUpperCase() : '?';
  return `
    <div class="header-bar">
      <button class="back-btn" onclick="App.openSidebar()" style="border:1px solid var(--b1)">
        <div style="display:flex;flex-direction:column;gap:3px;width:14px">
          <span style="display:block;height:1.5px;border-radius:1px;background:var(--t)"></span>
          <span style="display:block;height:1.5px;border-radius:1px;background:var(--t)"></span>
          <span style="display:block;height:1.5px;border-radius:1px;background:var(--t)"></span>
        </div>
      </button>
      <div style="width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#d4990f,#a67208);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9px;color:#fff;flex-shrink:0">SPG</div>
      <div style="flex:1;min-width:0">
        <div class="header-title">${esc(title || 'Siam Palette Group')}</div>
        ${subtitle ? '<div class="header-sub">' + esc(subtitle) + '</div>' : ''}
      </div>
      <button class="back-btn" style="border:1px solid var(--b1);position:relative;font-size:14px;color:var(--tm)">🔔<span id="notiBadge" style="position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:var(--red);border:1.5px solid #fff;display:none"></span></button>
      <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--gold-bg2),#f9e8c0);border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--gold);cursor:pointer;flex-shrink:0" onclick="App.go('profile')">${esc(initial)}</div>
    </div>`;
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
  renderTopbar,
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
