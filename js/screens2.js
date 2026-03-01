/**
 * ═══════════════════════════════════════════
 * SPG App — Home Module Frontend
 * screens2.js — Screens S7–S12
 * ═══════════════════════════════════════════
 */

(() => {
const { $, esc, showFieldError, hideError, formatDate, formatShortDate } = Screens;

// ════════════════════════════════
// S7: REGISTRATION (Public)
// ════════════════════════════════
function renderRegister() {
  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('login')">←</button>
      <div class="header-title">สมัครสมาชิก</div>
    </div>
    <div class="screen-body">
      <form class="reg-form" onsubmit="Screens.doRegister(event)">
        <div class="input-group">
          <label>ชื่อผู้ใช้ (Username)</label>
          <input type="text" class="input-field" id="inp-reg-user" placeholder="ตัวอักษร ตัวเลข จุด _ เท่านั้น" required>
        </div>
        <div class="input-group">
          <label>รหัสผ่าน (8 ตัวขึ้นไป)</label>
          <input type="password" class="input-field" id="inp-reg-pass" placeholder="••••••••" required>
        </div>
        <div class="input-group">
          <label>ชื่อ-นามสกุล</label>
          <input type="text" class="input-field" id="inp-reg-full" placeholder="ชื่อจริง นามสกุล" required>
        </div>
        <div class="input-group">
          <label>ชื่อเล่น (แสดงในระบบ)</label>
          <input type="text" class="input-field" id="inp-reg-nick" placeholder="เช่น น้องมิ้น" required>
        </div>
        <div class="input-group">
          <label>อีเมล (ไม่บังคับ)</label>
          <input type="email" class="input-field" id="inp-reg-email" placeholder="email@example.com">
        </div>
        <div class="input-group">
          <label>เบอร์โทร (ไม่บังคับ)</label>
          <input type="tel" class="input-field" id="inp-reg-phone" placeholder="0812345678">
        </div>
        <div class="input-group">
          <label>ร้านที่ต้องการสมัคร</label>
          <select class="input-field" id="inp-reg-store"><option value="">กำลังโหลด...</option></select>
        </div>
        <div class="input-group">
          <label>แผนก</label>
          <select class="input-field" id="inp-reg-dept"><option value="">กำลังโหลด...</option></select>
        </div>
        <div class="input-group">
          <label>หมายเหตุ (ไม่บังคับ)</label>
          <textarea class="input-field" id="inp-reg-note" placeholder="เช่น ตำแหน่งที่สมัคร"></textarea>
        </div>
        <div class="error-msg" id="reg-error"></div>
        <button type="submit" class="btn btn-gold btn-full" id="btn-reg">ส่งคำขอสมัคร</button>
      </form>
    </div>
  </div>`;
}

async function loadRegisterDropdowns() {
  try {
    const [stores, depts] = await Promise.all([API.getStores(), API.getDepartments()]);
    const storeEl = $('inp-reg-store');
    const deptEl = $('inp-reg-dept');
    
    if (storeEl) {
      storeEl.innerHTML = '<option value="">-- เลือกร้าน --</option>' +
        stores.stores.map(s => `<option value="${esc(s.store_id)}">${esc(s.store_name_th || s.store_name)}</option>`).join('');
    }
    if (deptEl) {
      deptEl.innerHTML = '<option value="">-- เลือกแผนก --</option>' +
        depts.departments.map(d => `<option value="${esc(d.dept_id)}">${esc(d.dept_name_th || d.dept_name)}</option>`).join('');
    }
  } catch (err) {
    App.toast('โหลดข้อมูลร้าน/แผนกไม่สำเร็จ', 'error');
  }
}

async function doRegister(e) {
  e.preventDefault();
  const data = {
    username: $('inp-reg-user').value.trim(),
    password: $('inp-reg-pass').value,
    full_name: $('inp-reg-full').value.trim(),
    display_name: $('inp-reg-nick').value.trim(),
    email: $('inp-reg-email').value.trim(),
    phone: $('inp-reg-phone').value.trim(),
    requested_store_id: $('inp-reg-store').value,
    requested_dept_id: $('inp-reg-dept').value,
    note: $('inp-reg-note').value.trim()
  };

  if (!data.username || !data.password || !data.full_name || !data.display_name) {
    return showFieldError('reg-error', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
  }

  App.showLoader();
  try {
    const result = await API.register(data);
    App.go('pending', { request_id: result.request_id });
  } catch (err) {
    showFieldError('reg-error', err.message);
  } finally {
    App.hideLoader();
  }
}

// ════════════════════════════════
// S8: PENDING APPROVAL
// ════════════════════════════════
function renderPending(params = {}) {
  const rid = params.request_id || '';
  return `
  <div class="screen screen-enter">
    <div class="pending-screen">
      <div class="pending-icon">⏳</div>
      <div class="pending-title">รออนุมัติ</div>
      <div class="pending-msg">
        คำขอสมัครของคุณถูกส่งแล้ว<br>
        ${rid ? `หมายเลข: <strong>${esc(rid)}</strong><br>` : ''}
        กรุณารอ Admin อนุมัติ<br>
        จะสามารถเข้าใช้งานได้หลังจากอนุมัติแล้ว
      </div>
      <button class="btn btn-outline" style="margin-top:24px" onclick="App.go('login')">กลับหน้า Login</button>
    </div>
  </div>`;
}

// ════════════════════════════════
// S9: ADMIN PANEL
// ════════════════════════════════
let adminActiveTab = 'accounts';

function renderAdmin() {
  const s = API.getSession();
  if (!s) return Screens.renderLogin();

  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('dashboard')">←</button>
      <div class="header-title">Admin Panel</div>
    </div>
    <div class="admin-tabs">
      <div class="admin-tab ${adminActiveTab==='accounts'?'active':''}" onclick="Screens.adminTab('accounts')">👥 บัญชี</div>
      <div class="admin-tab ${adminActiveTab==='permissions'?'active':''}" onclick="Screens.adminTab('permissions')">🔐 สิทธิ์</div>
      <div class="admin-tab ${adminActiveTab==='registrations'?'active':''}" onclick="Screens.adminTab('registrations')">📝 คำขอ</div>
      <div class="admin-tab ${adminActiveTab==='bridge'?'active':''}" onclick="Screens.adminTab('bridge')">🔗 Bridge</div>
      <div class="admin-tab" onclick="App.go('audit')">📋 Audit</div>
    </div>
    <div class="screen-body" id="admin-content">
      <div style="text-align:center;padding:30px;color:var(--tm)">กำลังโหลด...</div>
    </div>
  </div>`;
}

function adminTab(tab) {
  adminActiveTab = tab;
  // Update tab buttons
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const tabs = document.querySelectorAll('.admin-tab');
  const idx = ['accounts','permissions','registrations','bridge'].indexOf(tab);
  if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');
  loadAdminContent();
}

async function loadAdminContent() {
  const content = $('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:30px;color:var(--tm)">กำลังโหลด...</div>';

  try {
    if (adminActiveTab === 'accounts') await loadAccounts(content);
    else if (adminActiveTab === 'permissions') await loadPermissions(content);
    else if (adminActiveTab === 'registrations') await loadRegistrations(content);
    else if (adminActiveTab === 'bridge') await loadBridge(content);
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${esc(err.message)}</div></div>`;
  }
}

// ─── Accounts Tab ───
async function loadAccounts(container) {
  const data = await API.adminGetAccounts({ page_size: 50 });
  
  if (!data.accounts || data.accounts.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">ไม่พบบัญชี</div></div>`;
    return;
  }

  let html = `<div style="padding:8px 16px;text-align:right">
    <button class="btn btn-gold btn-sm" onclick="Screens.showCreateAccount()">+ สร้างบัญชีใหม่</button>
  </div>`;

  data.accounts.forEach(acc => {
    const badge = acc.status === 'approved' ? 'badge-approved' : acc.status === 'pending' ? 'badge-pending' : 'badge-suspended';
    html += `
    <div class="list-item" onclick="App.go('account-detail',{account_id:'${esc(acc.account_id)}'})">
      <div class="item-avatar">${acc.account_type === 'group' ? '👥' : '👤'}</div>
      <div class="item-info">
        <div class="item-name">${esc(acc.display_label || acc.username)}</div>
        <div class="item-meta">${esc(acc.account_id)} · ${esc(acc.tier_id)} · ${esc(acc.account_type)} · ${acc.user_count} users</div>
      </div>
      <span class="item-badge ${badge}">${esc(acc.status)}</span>
    </div>`;
  });

  html += `<div style="text-align:center;padding:12px;font-size:11px;color:var(--tm)">ทั้งหมด ${data.total} บัญชี</div>`;
  container.innerHTML = html;
}

// ─── Create Account Modal ───
function showCreateAccount() {
  const html = `
  <div class="modal-overlay" id="modal-create-acc" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">สร้างบัญชีใหม่</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="input-group"><label>Username</label><input class="input-field" id="inp-ca-user" placeholder="username"></div>
        <div class="input-group"><label>Password</label><input class="input-field" type="password" id="inp-ca-pass" placeholder="8 ตัวขึ้นไป"></div>
        <div class="input-group"><label>ชื่อแสดง</label><input class="input-field" id="inp-ca-label" placeholder="Display Label"></div>
        <div class="input-group"><label>ประเภท</label>
          <select class="input-field" id="inp-ca-type"><option value="individual">Individual</option><option value="group">Group</option></select>
        </div>
        <div class="input-group"><label>Tier</label>
          <select class="input-field" id="inp-ca-tier">
            <option value="T1">T1 — Owner/CEO</option>
            <option value="T2">T2 — Executive</option>
            <option value="T3">T3 — Store Manager</option>
            <option value="T4">T4 — Senior Staff</option>
            <option value="T5" selected>T5 — Staff</option>
            <option value="T6">T6 — Junior</option>
            <option value="T7">T7 — Viewer</option>
          </select>
        </div>
        <div class="input-group"><label>Store ID</label><input class="input-field" id="inp-ca-store" placeholder="เช่น MNG, BC"></div>
        <div class="input-group"><label>Department</label><input class="input-field" id="inp-ca-dept" placeholder="เช่น dessert, bakery"></div>
        <div class="error-msg" id="ca-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doCreateAccount()">สร้างบัญชี</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doCreateAccount() {
  const data = {
    username: $('inp-ca-user').value.trim(),
    password: $('inp-ca-pass').value,
    display_label: $('inp-ca-label').value.trim(),
    account_type: $('inp-ca-type').value,
    tier_id: $('inp-ca-tier').value,
    store_id: $('inp-ca-store').value.trim(),
    dept_id: $('inp-ca-dept').value.trim()
  };

  if (!data.username || !data.password) return showFieldError('ca-error', 'กรุณากรอก username และ password');

  App.showLoader();
  try {
    await API.adminCreateAccount(data);
    document.getElementById('modal-create-acc')?.remove();
    App.toast('สร้างบัญชีสำเร็จ', 'success');
    loadAdminContent();
  } catch (err) {
    showFieldError('ca-error', err.message);
  } finally {
    App.hideLoader();
  }
}

// ─── Permissions Tab ───
async function loadPermissions(container) {
  const data = await API.adminGetPermissions();
  
  let headerHtml = '<th>Module</th>';
  data.tiers.forEach(t => {
    headerHtml += `<th>${esc(t.tier_id)}<br><span style="font-size:9px;font-weight:400">${esc(t.tier_name)}</span></th>`;
  });

  let bodyHtml = '';
  data.modules.forEach(m => {
    bodyHtml += `<tr><td>${esc(m.module_name)}</td>`;
    data.tiers.forEach(t => {
      const level = m.permissions[t.tier_id] || 'no_access';
      const editable = t.tier_level > 1;
      bodyHtml += `<td><span class="perm-cell perm-${level}" ${editable ? `onclick="Screens.cyclePerm('${esc(m.module_id)}','${esc(t.tier_id)}','${level}')"` : ''}>${level.replace('_', ' ')}</span></td>`;
    });
    bodyHtml += '</tr>';
  });

  container.innerHTML = `
  <div class="perm-table-wrap">
    <table class="perm-table">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </div>
  <div style="padding:12px 16px;font-size:11px;color:var(--tm)">คลิกที่ช่อง (ยกเว้น T1) เพื่อเปลี่ยนสิทธิ์</div>`;
}

const PERM_CYCLE = ['no_access', 'view_only', 'edit', 'admin', 'super_admin'];

async function cyclePerm(moduleId, tierId, current) {
  const idx = PERM_CYCLE.indexOf(current);
  const next = PERM_CYCLE[(idx + 1) % PERM_CYCLE.length];

  try {
    await API.adminUpdatePermission(moduleId, tierId, next);
    App.toast(`${tierId} → ${next}`, 'success');
    loadAdminContent();
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

// ─── Registrations Tab ───
async function loadRegistrations(container) {
  const data = await API.adminGetRegistrations({ page_size: 50 });

  if (!data.requests || data.requests.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">ไม่มีคำขอลงทะเบียน</div></div>`;
    return;
  }

  let html = '';
  data.requests.forEach(r => {
    const badge = r.status === 'pending' ? 'badge-pending' : r.status === 'approved' ? 'badge-approved' : 'badge-rejected';
    html += `
    <div class="list-item" onclick="App.go('reg-review',{request_id:'${esc(r.request_id)}'})">
      <div class="item-avatar">📝</div>
      <div class="item-info">
        <div class="item-name">${esc(r.display_name)} (${esc(r.username)})</div>
        <div class="item-meta">${esc(r.requested_store_id || '-')} · ${esc(r.requested_dept_id || '-')} · ${formatShortDate(r.submitted_at)}</div>
      </div>
      <span class="item-badge ${badge}">${esc(r.status)}</span>
    </div>`;
  });

  container.innerHTML = html;
}

// ─── Bridge Tab ───
async function loadBridge(container) {
  const data = await API.adminGetBridgeConfig();

  if (!data.bridges || data.bridges.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔗</div><div class="empty-text">ยังไม่มี Data Bridge</div></div>`;
    return;
  }

  let html = '';
  data.bridges.forEach(b => {
    const isOn = b.is_enabled;
    html += `
    <div class="list-item" style="cursor:default">
      <div class="item-avatar">${isOn ? '🟢' : '🔴'}</div>
      <div class="item-info">
        <div class="item-name">${esc(b.source_module)} → ${esc(b.target_module)}</div>
        <div class="item-meta">${esc(b.data_type)} · ${esc(b.description)}</div>
      </div>
      <button class="btn btn-sm ${isOn ? 'btn-danger' : 'btn-gold'}" onclick="Screens.toggleBridge('${esc(b.bridge_id)}',${!isOn})">${isOn ? 'ปิด' : 'เปิด'}</button>
    </div>`;
  });

  container.innerHTML = html;
}

async function toggleBridge(bridgeId, enable) {
  try {
    await API.adminUpdateBridge(bridgeId, enable);
    App.toast(enable ? 'เปิด Bridge แล้ว' : 'ปิด Bridge แล้ว', 'success');
    loadAdminContent();
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

// ════════════════════════════════
// S10: ACCOUNT DETAIL / EDIT
// ════════════════════════════════
let _accountDetail = null;

function renderAccountDetail(params = {}) {
  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('admin')">←</button>
      <div class="header-title">รายละเอียดบัญชี</div>
    </div>
    <div class="screen-body" id="acc-detail-content">
      <div style="text-align:center;padding:30px;color:var(--tm)">กำลังโหลด...</div>
    </div>
  </div>`;
}

async function loadAccountDetail(accountId) {
  const content = $('acc-detail-content');
  if (!content) return;

  try {
    const data = await API.adminGetAccounts({ search: accountId, page_size: 1 });
    const acc = data.accounts?.find(a => a.account_id === accountId);
    if (!acc) { content.innerHTML = '<div class="empty-state">ไม่พบบัญชี</div>'; return; }
    _accountDetail = acc;

    content.innerHTML = `
    <div class="profile-avatar">
      <div class="emoji">${acc.account_type === 'group' ? '👥' : '👤'}</div>
      <div class="name">${esc(acc.display_label)}</div>
      <div class="sub">${esc(acc.username)} · ${esc(acc.account_id)}</div>
    </div>
    <div class="profile-section">
      <div class="profile-row"><span class="label">ประเภท</span><span class="value">${esc(acc.account_type)}</span></div>
      <div class="profile-row"><span class="label">Tier</span><span class="value">${esc(acc.tier_id)}</span></div>
      <div class="profile-row"><span class="label">สถานะ</span><span class="value">${esc(acc.status)}</span></div>
      <div class="profile-row"><span class="label">ร้าน</span><span class="value">${esc(acc.store_id || '-')}</span></div>
      <div class="profile-row"><span class="label">แผนก</span><span class="value">${esc(acc.dept_id || '-')}</span></div>
      <div class="profile-row"><span class="label">จำนวน Users</span><span class="value">${acc.user_count}</span></div>
      <div class="profile-row"><span class="label">เข้าใช้ล่าสุด</span><span class="value">${formatDate(acc.last_login)}</span></div>
      <div class="profile-row"><span class="label">สร้างเมื่อ</span><span class="value">${formatDate(acc.created_at)}</span></div>
    </div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
      ${acc.status === 'approved' ? `<button class="btn btn-danger btn-full" onclick="Screens.suspendAccount('${esc(acc.account_id)}')">ระงับบัญชี</button>` : ''}
      ${acc.status === 'suspended' ? `<button class="btn btn-gold btn-full" onclick="Screens.reactivateAccount('${esc(acc.account_id)}')">เปิดใช้งานอีกครั้ง</button>` : ''}
    </div>`;
  } catch (err) {
    content.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
  }
}

async function suspendAccount(accountId) {
  if (!confirm('ยืนยันระงับบัญชีนี้?')) return;
  App.showLoader();
  try {
    await API.adminUpdateAccount({ target_account_id: accountId, status: 'suspended' });
    App.toast('ระงับบัญชีแล้ว', 'success');
    loadAccountDetail(accountId);
  } catch (err) { App.toast(err.message, 'error'); }
  finally { App.hideLoader(); }
}

async function reactivateAccount(accountId) {
  App.showLoader();
  try {
    await API.adminUpdateAccount({ target_account_id: accountId, status: 'approved' });
    App.toast('เปิดใช้งานอีกครั้งแล้ว', 'success');
    loadAccountDetail(accountId);
  } catch (err) { App.toast(err.message, 'error'); }
  finally { App.hideLoader(); }
}

// ════════════════════════════════
// S11: REGISTRATION REVIEW
// ════════════════════════════════
let _regDetail = null;

function renderRegReview(params = {}) {
  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('admin')">←</button>
      <div class="header-title">พิจารณาคำขอ</div>
    </div>
    <div class="screen-body" id="reg-review-content">
      <div style="text-align:center;padding:30px;color:var(--tm)">กำลังโหลด...</div>
    </div>
  </div>`;
}

async function loadRegReview(requestId) {
  const content = $('reg-review-content');
  if (!content) return;

  try {
    const data = await API.adminGetRegistrations({ page_size: 100 });
    const req = data.requests?.find(r => r.request_id === requestId);
    if (!req) { content.innerHTML = '<div class="empty-state">ไม่พบคำขอ</div>'; return; }
    _regDetail = req;

    content.innerHTML = `
    <div class="profile-section" style="margin:16px">
      <div class="profile-row"><span class="label">หมายเลข</span><span class="value">${esc(req.request_id)}</span></div>
      <div class="profile-row"><span class="label">Username</span><span class="value">${esc(req.username)}</span></div>
      <div class="profile-row"><span class="label">ชื่อ-นามสกุล</span><span class="value">${esc(req.full_name)}</span></div>
      <div class="profile-row"><span class="label">ชื่อแสดง</span><span class="value">${esc(req.display_name)}</span></div>
      <div class="profile-row"><span class="label">อีเมล</span><span class="value">${esc(req.email || '-')}</span></div>
      <div class="profile-row"><span class="label">เบอร์โทร</span><span class="value">${esc(req.phone || '-')}</span></div>
      <div class="profile-row"><span class="label">ร้าน</span><span class="value">${esc(req.requested_store_id || '-')}</span></div>
      <div class="profile-row"><span class="label">แผนก</span><span class="value">${esc(req.requested_dept_id || '-')}</span></div>
      <div class="profile-row"><span class="label">หมายเหตุ</span><span class="value">${esc(req.note || '-')}</span></div>
      <div class="profile-row"><span class="label">ส่งเมื่อ</span><span class="value">${formatDate(req.submitted_at)}</span></div>
      <div class="profile-row"><span class="label">สถานะ</span><span class="value">${esc(req.status)}</span></div>
      ${req.reviewed_by ? `<div class="profile-row"><span class="label">พิจารณาโดย</span><span class="value">${esc(req.reviewed_by)}</span></div>` : ''}
      ${req.reviewed_at ? `<div class="profile-row"><span class="label">พิจารณาเมื่อ</span><span class="value">${formatDate(req.reviewed_at)}</span></div>` : ''}
    </div>
    ${req.status === 'pending' ? `
    <div style="padding:0 16px 8px">
      <div class="input-group">
        <label>Tier ที่จะกำหนด</label>
        <select class="input-field" id="inp-rev-tier">
          <option value="T5" selected>T5 — Staff</option>
          <option value="T6">T6 — Junior</option>
          <option value="T7">T7 — Viewer</option>
          <option value="T4">T4 — Senior</option>
          <option value="T3">T3 — Manager</option>
        </select>
      </div>
      <div class="input-group" style="margin-top:8px">
        <label>หมายเหตุ Admin</label>
        <textarea class="input-field" id="inp-rev-note" placeholder="ไม่บังคับ"></textarea>
      </div>
    </div>
    <div class="review-actions">
      <button class="btn btn-approve" onclick="Screens.reviewReg('${esc(req.request_id)}','approve')">✓ อนุมัติ</button>
      <button class="btn btn-reject" onclick="Screens.reviewReg('${esc(req.request_id)}','reject')">✕ ปฏิเสธ</button>
    </div>
    ` : ''}`;
  } catch (err) {
    content.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
  }
}

async function reviewReg(requestId, action) {
  const confirmMsg = action === 'approve' ? 'ยืนยันอนุมัติคำขอนี้?' : 'ยืนยันปฏิเสธคำขอนี้?';
  if (!confirm(confirmMsg)) return;

  const tier_id = $('inp-rev-tier')?.value || 'T5';
  const review_note = $('inp-rev-note')?.value || '';

  App.showLoader();
  try {
    await API.adminReviewRegistration({
      request_id: requestId,
      action: action,
      tier_id: tier_id,
      review_note: review_note
    });
    App.toast(action === 'approve' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว', 'success');
    App.go('admin');
  } catch (err) {
    App.toast(err.message, 'error');
  } finally {
    App.hideLoader();
  }
}

// ════════════════════════════════
// S12: AUDIT LOG
// ════════════════════════════════
function renderAudit() {
  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('admin')">←</button>
      <div class="header-title">Audit Log</div>
      <button class="btn btn-ghost btn-sm" onclick="Screens.exportAudit()">📤 Export</button>
    </div>
    <div class="filter-bar">
      <select class="input-field" id="audit-type" onchange="Screens.loadAuditLog()">
        <option value="">ทุกประเภท</option>
        <option value="login">Login</option>
        <option value="logout">Logout</option>
        <option value="staff_select">Staff Select</option>
        <option value="account_change">Account</option>
        <option value="permission_change">Permission</option>
        <option value="registration">Registration</option>
        <option value="module_access">Module Access</option>
        <option value="config_change">Config</option>
        <option value="bridge_change">Bridge</option>
        <option value="metadata_change">Metadata</option>
      </select>
      <input type="text" class="input-field" id="audit-search" placeholder="ค้นหา..." onkeyup="if(event.key==='Enter')Screens.loadAuditLog()">
    </div>
    <div class="screen-body" id="audit-content">
      <div style="text-align:center;padding:30px;color:var(--tm)">กำลังโหลด...</div>
    </div>
  </div>`;
}

async function loadAuditLog() {
  const content = $('audit-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:30px;color:var(--tm)">กำลังโหลด...</div>';

  try {
    const filters = {
      event_type: $('audit-type')?.value || '',
      search: $('audit-search')?.value || '',
      page_size: 50
    };

    const data = await API.adminGetAuditLog(filters);

    if (!data.entries || data.entries.length === 0) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">ไม่พบ log</div></div>`;
      return;
    }

    let html = '';
    const sensitiveActions = ['failed', 'suspend', 'reject'];

    data.entries.forEach(e => {
      const sensitive = sensitiveActions.some(a => e.event_action?.includes(a));
      html += `
      <div class="audit-item ${sensitive ? 'sensitive' : ''}">
        <div class="audit-head">
          <span class="audit-type">${esc(e.event_type)} · ${esc(e.event_action)}</span>
          <span class="audit-time">${formatShortDate(e.created_at)}</span>
        </div>
        ${e.detail ? `<div class="audit-detail">${esc(e.detail)}</div>` : ''}
        <div class="audit-tags">
          ${e.account_id ? `<span class="audit-tag">${esc(e.account_id)}</span>` : ''}
          ${e.user_id ? `<span class="audit-tag">${esc(e.user_id)}</span>` : ''}
          ${e.tier_id ? `<span class="audit-tag">${esc(e.tier_id)}</span>` : ''}
          ${e.target_id ? `<span class="audit-tag">→ ${esc(e.target_id)}</span>` : ''}
        </div>
      </div>`;
    });

    html += `<div style="text-align:center;padding:12px;font-size:11px;color:var(--tm)">แสดง ${data.entries.length} จาก ${data.total} รายการ</div>`;
    content.innerHTML = html;
  } catch (err) {
    content.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
  }
}

async function exportAudit() {
  App.showLoader();
  try {
    const data = await API.adminExportAuditLog({});
    if (data.download_url) {
      window.open(data.download_url, '_blank');
      App.toast(`Export สำเร็จ: ${data.row_count} แถว`, 'success');
    }
  } catch (err) {
    App.toast(err.message, 'error');
  } finally {
    App.hideLoader();
  }
}

// ════════════════════════════════
// EXTEND Screens OBJECT (Part 2)
// ════════════════════════════════
Object.assign(Screens, {
  renderRegister, loadRegisterDropdowns, doRegister,
  renderPending,
  renderAdmin, adminTab, loadAdminContent,
  showCreateAccount, doCreateAccount,
  cyclePerm,
  toggleBridge,
  renderAccountDetail, loadAccountDetail, suspendAccount, reactivateAccount,
  renderRegReview, loadRegReview, reviewReg,
  renderAudit, loadAuditLog, exportAudit
});

})();
