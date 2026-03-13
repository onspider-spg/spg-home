/**
 * Version 2.4 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG App — Home Module Frontend
 * screens2.js — Screens S7–S12
 * ═══════════════════════════════════════════
 */

(() => {
const { $, esc, showFieldError, hideError, formatDate, formatShortDate } = Screens;

// ─── Shared Tier Helpers ───
const tierColor = (t) => { const l = parseInt((t||'T9').replace('T','')); return l<=2 ? 'var(--gold)' : l<=4 ? 'var(--blue)' : 'var(--tm)'; };
const tierBg = (t) => { const l = parseInt((t||'T9').replace('T','')); return l<=2 ? 'var(--gold-bg2)' : l<=4 ? 'var(--blue-bg)' : 'var(--s2)'; };

// ─── Stores/Depts Cache (2.1) ───
let _cachedStores = null;
let _cachedDepts = null;
async function getStoresCache() {
  if (!_cachedStores) _cachedStores = (await API.getStores()).stores || [];
  return _cachedStores;
}
async function getDeptsCache() {
  if (!_cachedDepts) _cachedDepts = (await API.getDepartments()).departments || [];
  return _cachedDepts;
}

// ════════════════════════════════
// S7: REGISTRATION (Public)
// ════════════════════════════════
function renderRegister() {
  return `
  <div class="screen screen-enter">
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('login')">←</button>
      <div class="header-title">Register</div>
    </div>
    <div class="screen-body">
      <form class="reg-form" onsubmit="Screens.doRegister(event)">
        <div class="input-group">
          <label>Email / Username *</label>
          <input type="email" class="input-field" id="inp-reg-email" placeholder="email@example.com หรือ username" required>
        </div>
        <div class="input-group">
          <label>Password (min 8 characters) *</label>
          <input type="password" class="input-field" id="inp-reg-pass" placeholder="••••••••" required>
        </div>
        <div style="display:flex;gap:10px">
          <div class="input-group" style="flex:1">
            <label>Full Name *</label>
            <input type="text" class="input-field" id="inp-reg-full" placeholder="First Last" required>
          </div>
          <div class="input-group" style="flex:1">
            <label>Display Name *</label>
            <input type="text" class="input-field" id="inp-reg-nick" placeholder="e.g. Mint" required>
          </div>
        </div>
        <div class="input-group">
          <label>Phone *</label>
          <input type="tel" class="input-field" id="inp-reg-phone" placeholder="0412345678" required>
        </div>
        <div style="display:flex;gap:10px">
          <div class="input-group" style="flex:1">
            <label>Store</label>
            <select class="input-field" id="inp-reg-store"><option value="">Loading...</option></select>
          </div>
          <div class="input-group" style="flex:1">
            <label>Department</label>
            <select class="input-field" id="inp-reg-dept"><option value="">Loading...</option></select>
          </div>
        </div>
        <div class="input-group">
          <label>Note (optional)</label>
          <textarea class="input-field" id="inp-reg-note" placeholder="e.g. Position applying for"></textarea>
        </div>
        <div class="error-msg" id="reg-error"></div>
        <button type="submit" class="btn btn-gold btn-full" id="btn-reg">Submit Registration</button>
      </form>
    </div>
  </div>`;
}

async function loadRegisterDropdowns() {
  try {
    const [stores, depts] = await Promise.all([getStoresCache(), getDeptsCache()]);
    const storeEl = $('inp-reg-store');
    const deptEl = $('inp-reg-dept');
    
    if (storeEl) {
      storeEl.innerHTML = '<option value="">-- Select Store --</option>' +
        stores.filter(s => s.store_id !== 'ALL').map(s => `<option value="${esc(s.store_id)}">${esc(s.store_name_th || s.store_name)}</option>`).join('');
    }
    if (deptEl) {
      deptEl.innerHTML = '<option value="">-- Select Department --</option>' +
        depts.map(d => `<option value="${esc(d.dept_id)}">${esc(d.dept_name_th || d.dept_name)}</option>`).join('');
    }
  } catch (err) {
    App.toast('Failed to load store/department data', 'error');
  }
}

async function doRegister(e) {
  e.preventDefault();
  const email = $('inp-reg-email').value.trim();
  const phone = $('inp-reg-phone').value.trim();
  const data = {
    username: email,
    password: $('inp-reg-pass').value,
    full_name: $('inp-reg-full').value.trim(),
    display_name: $('inp-reg-nick').value.trim(),
    email: email,
    phone: phone,
    requested_store_id: $('inp-reg-store').value,
    requested_dept_id: $('inp-reg-dept').value,
    note: $('inp-reg-note').value.trim()
  };

  if (!email || !data.password || !data.full_name || !data.display_name || !phone) {
    return showFieldError('reg-error', 'Please fill in all required fields');
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
      <div style="font-size:48px;margin-bottom:12px">⏳</div>
      <div class="pending-title">รอการอนุมัติ</div>
      <div class="pending-msg">
        การลงทะเบียนของคุณอยู่ระหว่างการตรวจสอบ<br>
        Admin จะอนุมัติภายใน 24 ชม.
      </div>
      ${rid ? `
      <div style="padding:12px;background:var(--s1);border-radius:var(--radius-sm);text-align:left;font-size:12px;margin:16px 0;width:100%;max-width:320px">
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--b1)">
          <span style="color:var(--td)">Reference</span>
          <span style="font-weight:600">${esc(rid)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0">
          <span style="color:var(--td)">Status</span>
          <span style="padding:2px 8px;border-radius:8px;background:var(--orange-bg);color:var(--orange);font-size:10px;font-weight:600">Pending</span>
        </div>
      </div>` : ''}
      <button class="btn btn-outline" style="margin-top:12px" onclick="App.go('login')">← กลับ Login</button>
    </div>
  </div>`;
}

// ════════════════════════════════
// S9: ADMIN PANEL
// ════════════════════════════════
let adminActiveTab = 'accounts';

function renderAdmin(p) {
  if (p && p.tab) adminActiveTab = p.tab;
  const s = API.getSession();
  if (!s) return Screens.renderLogin();

  return `
  <div class="screen screen-enter">
    ${Screens.renderTopbar('Siam Palette Group', 'Admin · ' + esc(s.display_name || ''))}
    <div class="admin-tabs">
      <div class="admin-tab ${adminActiveTab==='accounts'?'active':''}" onclick="Screens.adminTab('accounts')">Accounts</div>
      <div class="admin-tab ${adminActiveTab==='permissions'?'active':''}" onclick="Screens.adminTab('permissions')">Permissions</div>
      <div class="admin-tab ${adminActiveTab==='tieraccess'?'active':''}" onclick="Screens.adminTab('tieraccess')">Tier Access</div>
      <div class="admin-tab ${adminActiveTab==='registrations'?'active':''}" onclick="Screens.adminTab('registrations')">Requests</div>
      <div class="admin-tab ${adminActiveTab==='bridge'?'active':''}" onclick="Screens.adminTab('bridge')">Bridge</div>
      <div class="admin-tab ${adminActiveTab==='modules'?'active':''}" onclick="Screens.adminTab('modules')">Modules</div>
      <div class="admin-tab ${adminActiveTab==='user'?'active':''}" onclick="Screens.adminTab('user')">Users</div>
      <div class="admin-tab ${adminActiveTab==='store'?'active':''}" onclick="Screens.adminTab('store')">Stores</div>
      <div class="admin-tab ${adminActiveTab==='dept'?'active':''}" onclick="Screens.adminTab('dept')">Depts</div>
      <div class="admin-tab" style="color:var(--purple)" onclick="App.go('audit')">Audit</div>
    </div>
    <div class="screen-body" id="admin-content">
      <div style="text-align:center;padding:30px;color:var(--tm)">กำลังโหลด...</div>
    </div>
  </div>`;
}

function adminTab(tab) {
  adminActiveTab = tab;
  App.updateHash('admin', { tab });
  // Update tab buttons
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const tabs = document.querySelectorAll('.admin-tab');
  const idx = ['accounts','permissions','tieraccess','registrations','bridge','modules','user','store','dept'].indexOf(tab);
  if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');
  loadAdminContent();
}

async function loadAdminContent(p) {
  const content = $('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:30px;color:var(--tm)">กำลังโหลด...</div>';

  try {
    if (adminActiveTab === 'accounts') await loadAccounts(content);
    else if (adminActiveTab === 'permissions') await loadPermissions(content);
    else if (adminActiveTab === 'registrations') await loadRegistrations(content);
    else if (adminActiveTab === 'bridge') await loadBridge(content);
    else if (adminActiveTab === 'modules') await loadModulesAdmin(content);
    else if (adminActiveTab === 'user') await loadUsersAdmin(content);
    else if (adminActiveTab === 'store') await loadStoresAdmin(content);
    else if (adminActiveTab === 'dept') await loadDeptsAdmin(content);
    else if (adminActiveTab === 'tieraccess') await loadTierAccess(content);
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${esc(err.message)}</div></div>`;
  }
}

// ─── Accounts Tab ───
let _allAccounts = [];

async function loadAccounts(container) {
  const data = await API.adminGetAccounts({ page_size: 200 });
  _allAccounts = data.accounts || [];
  renderAccountList(container);
}

function renderAccountList(container) {
  const q = $('acc-search')?.value?.toLowerCase() || '';
  const sortBy = $('acc-sort')?.value || 'name';

  let filtered = _allAccounts.filter(acc => {
    if (!q) return true;
    return (acc.display_label || '').toLowerCase().includes(q)
      || (acc.username || '').toLowerCase().includes(q)
      || (acc.account_id || '').toLowerCase().includes(q)
      || (acc.tier_id || '').toLowerCase().includes(q);
  });

  filtered.sort((a, b) => {
    if (sortBy === 'name') return (a.display_label || '').localeCompare(b.display_label || '');
    if (sortBy === 'tier') return (a.tier_id || '').localeCompare(b.tier_id || '');
    if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
    if (sortBy === 'created') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return 0;
  });

  let html = `<div class="admin-toolbar">
    <input type="text" class="input-field input-sm" id="acc-search" placeholder="🔍 Search accounts..." value="${esc(q)}" oninput="Screens.filterAccounts()">
    <select class="input-field input-sm" id="acc-sort" onchange="Screens.filterAccounts()">
      <option value="name" ${sortBy==='name'?'selected':''}>Sort: Name</option>
      <option value="tier" ${sortBy==='tier'?'selected':''}>Sort: Tier</option>
      <option value="status" ${sortBy==='status'?'selected':''}>Sort: Status</option>
      <option value="created" ${sortBy==='created'?'selected':''}>Sort: Newest</option>
    </select>
    <button class="btn btn-gold btn-sm" onclick="Screens.showCreateAccount()">+ New</button>
  </div>
  <div style="font-size:11px;color:var(--tm);padding:0 16px 6px">${filtered.length} accounts</div>`;

  if (filtered.length === 0) {
    html += '<div class="empty-state"><div class="empty-text">No accounts match</div></div>';
  } else {
    html += `<div class="perm-table-wrap"><table class="perm-table" style="font-size:12px">
      <thead><tr><th style="text-align:left">Name</th><th style="text-align:left">Email</th><th>Tier</th><th>Store</th><th>Dept</th><th>Status</th><th></th></tr></thead><tbody>`;
    filtered.forEach(acc => {
      const badge = acc.status === 'approved' ? 'badge-approved' : acc.status === 'pending' ? 'badge-pending' : 'badge-suspended';
      const rowOpacity = acc.status === 'suspended' ? 'opacity:.5;' : '';
      html += `
      <tr style="cursor:pointer;${rowOpacity}" onclick="App.go('account-detail',{account_id:'${esc(acc.account_id)}'})">
        <td style="font-weight:600">${esc(acc.display_label || acc.username)}</td>
        <td style="font-size:10px;color:var(--td)">${esc(acc.username)}</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${tierBg(acc.tier_id)};color:${tierColor(acc.tier_id)};font-size:10px;font-weight:600">${esc(acc.tier_id)}</span></td>
        <td style="text-align:center">${esc(acc.store_id || '-')}</td>
        <td style="text-align:center">${esc(acc.dept_id || '-')}</td>
        <td style="text-align:center"><span class="item-badge ${badge}" style="margin:0">${esc(acc.status)}</span></td>
        <td style="color:var(--blue);font-size:10px;text-align:center">→</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }
  container.innerHTML = html;
}

function filterAccounts() {
  const container = $('admin-content');
  if (container) renderAccountList(container);
}

// ─── Create Account Modal ───
async function showCreateAccount() {
  let storeOptions = '<option value="">-- ไม่ระบุ --</option>';
  let deptOptions = '<option value="">-- ไม่ระบุ --</option>';
  try {
    const [stores, depts] = await Promise.all([getStoresCache(), getDeptsCache()]);
    stores.forEach(s => {
      storeOptions += `<option value="${esc(s.store_id)}">${esc(s.store_name)} (${esc(s.store_id)})</option>`;
    });
    depts.forEach(d => {
      deptOptions += `<option value="${esc(d.dept_id)}">${esc(d.dept_name)} (${esc(d.dept_id)})</option>`;
    });
  } catch (e) { console.warn('Failed to load stores/depts:', e); }

  const html = `
  <div class="modal-overlay" id="modal-create-acc" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Create Account</div>
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
        <div class="input-group"><label>Store</label><select class="input-field" id="inp-ca-store">${storeOptions}</select></div>
        <div class="input-group"><label>Department</label><select class="input-field" id="inp-ca-dept">${deptOptions}</select></div>
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
    App.toast('Account created', 'success');
    loadAdminContent();
  } catch (err) {
    showFieldError('ca-error', err.message);
  } finally {
    App.hideLoader();
  }
}

// ─── Permissions Tab ───
let _cachedPerms = null;

async function loadPermissions(container) {
  _cachedPerms = await API.adminGetPermissions();
  renderPermissions(container);
}

function renderPermissions(container) {
  const data = _cachedPerms;
  if (!data) return;
  const PERM_OPTIONS = ['no_access', 'view_only', 'edit', 'admin', 'super_admin'];
  
  let headerHtml = '<th style="text-align:left;position:sticky;left:0;background:var(--s1);z-index:2;min-width:100px">Module</th>';
  data.tiers.forEach(t => {
    const tColor = t.tier_level <= 2 ? 'var(--gold)' : t.tier_level <= 4 ? 'var(--blue)' : 'var(--tm)';
    headerHtml += `<th style="text-align:center"><span style="color:${tColor};font-weight:700">${esc(t.tier_id)}</span><br><span style="font-size:8px;font-weight:400;color:var(--tm)">${esc(t.tier_name)}</span></th>`;
  });

  let bodyHtml = '';
  data.modules.forEach(m => {
    bodyHtml += `<tr><td style="position:sticky;left:0;background:#fff;z-index:1;font-weight:600">${esc(m.module_name)}</td>`;
    data.tiers.forEach(t => {
      const level = m.permissions[t.tier_id] || 'no_access';
      const editable = t.tier_level > 1;
      if (editable) {
        let opts = PERM_OPTIONS.map(p => `<option value="${p}" ${p===level?'selected':''}>${p.replace('_',' ')}</option>`).join('');
        bodyHtml += `<td style="text-align:center"><select class="perm-select perm-${level}" onchange="Screens.setPerm('${esc(m.module_id)}','${esc(t.tier_id)}',this.value)">${opts}</select></td>`;
      } else {
        bodyHtml += `<td style="text-align:center"><span class="perm-cell perm-${level}">${level.replace('_', ' ')}</span></td>`;
      }
    });
    bodyHtml += '</tr>';
  });

  container.innerHTML = `
  <div style="padding:0 0 8px;font-size:11px;color:var(--blue);background:var(--blue-bg);border-radius:var(--radius-sm);padding:8px 12px;margin-bottom:10px">
    💡 เปลี่ยน dropdown แล้ว save ทันทีทีละ cell — T1 เท่านั้นที่แก้ได้
  </div>
  <div class="perm-table-wrap">
    <table class="perm-table">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </div>`;
}

async function setPerm(moduleId, tierId, newLevel) {
  try {
    await API.adminUpdatePermission(moduleId, tierId, newLevel);
    App.toast(`${tierId} → ${newLevel.replace('_',' ')}`, 'success');
    // Update cache + re-render (no re-fetch)
    if (_cachedPerms) {
      const mod = _cachedPerms.modules.find(m => m.module_id === moduleId);
      if (mod) mod.permissions[tierId] = newLevel;
      const container = $('admin-content');
      if (container) renderPermissions(container);
    }
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

// ─── Registrations Tab ───
let _allRegs = [];

async function loadRegistrations(container) {
  const data = await API.adminGetRegistrations({ page_size: 200 });
  _allRegs = data.requests || [];
  renderRegList(container);
}

function renderRegList(container) {
  const q = $('reg-search')?.value?.toLowerCase() || '';
  const statusFilter = $('reg-status')?.value || 'all';

  const pendingCount = _allRegs.filter(r => r.status === 'pending').length;
  const approvedCount = _allRegs.filter(r => r.status === 'approved').length;
  const rejectedCount = _allRegs.filter(r => r.status === 'rejected').length;

  let filtered = _allRegs.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!q) return true;
    return (r.display_name || '').toLowerCase().includes(q)
      || (r.username || '').toLowerCase().includes(q)
      || (r.requested_store_id || '').toLowerCase().includes(q);
  });

  const chipActive = (v) => statusFilter === v ? 'background:var(--gold-bg2);color:var(--gold);border-color:rgba(212,150,10,0.2);font-weight:600' : '';

  let html = `<div style="display:flex;gap:4px;padding:0 0 10px;flex-wrap:wrap">
    <span style="padding:4px 10px;border-radius:12px;border:1px solid var(--b1);font-size:11px;cursor:pointer;${chipActive('all')}" onclick="$('reg-status').value='all';Screens.filterRegs()">All</span>
    <span style="padding:4px 10px;border-radius:12px;border:1px solid var(--b1);font-size:11px;cursor:pointer;${chipActive('pending')}" onclick="$('reg-status').value='pending';Screens.filterRegs()">Pending (${pendingCount})</span>
    <span style="padding:4px 10px;border-radius:12px;border:1px solid var(--b1);font-size:11px;cursor:pointer;${chipActive('approved')}" onclick="$('reg-status').value='approved';Screens.filterRegs()">Approved</span>
    <span style="padding:4px 10px;border-radius:12px;border:1px solid var(--b1);font-size:11px;cursor:pointer;${chipActive('rejected')}" onclick="$('reg-status').value='rejected';Screens.filterRegs()">Rejected</span>
  </div>
  <select id="reg-status" style="display:none"><option value="${esc(statusFilter)}"></option></select>
  <input type="hidden" id="reg-search" value="${esc(q)}">`;

  if (filtered.length === 0) {
    html += '<div class="empty-state"><div class="empty-text">No requests match</div></div>';
  } else {
    filtered.forEach(r => {
      const borderColor = r.status === 'pending' ? 'var(--orange)' : r.status === 'approved' ? 'var(--green)' : 'var(--red)';
      const badge = r.status === 'pending' ? 'badge-pending' : r.status === 'approved' ? 'badge-approved' : 'badge-suspended';
      html += `
      <div style="padding:12px 14px;border:1px solid var(--b1);border-left:4px solid ${borderColor};border-radius:0 var(--radius-sm) var(--radius-sm) 0;margin-bottom:6px;cursor:pointer" onclick="App.go('reg-review',{request_id:'${esc(r.request_id)}'})">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:13px;font-weight:700">${esc(r.display_name)}</span>
          <span class="item-badge ${badge}" style="margin:0">${esc(r.status)}</span>
        </div>
        <div style="font-size:11px;color:var(--td)">${esc(r.username)} · ${esc(r.requested_store_id || '-')} · ${esc(r.requested_dept_id || '-')} · ${formatShortDate(r.submitted_at)}</div>
        ${r.note ? `<div style="font-size:10px;color:var(--tm);margin-top:3px">Note: ${esc(r.note)}</div>` : ''}
        ${r.status === 'pending' ? `<button class="btn btn-outline btn-sm" style="margin-top:6px;padding:3px 10px;font-size:10px" onclick="event.stopPropagation();App.go('reg-review',{request_id:'${esc(r.request_id)}'})">👁️ Review</button>` : ''}
      </div>`;
    });
  }
  container.innerHTML = html;
}

function filterRegs() {
  const container = $('admin-content');
  if (container) renderRegList(container);
}

// ─── Bridge Tab ───
let _cachedBridges = null;

async function loadBridge(container) {
  const data = await API.adminGetBridgeConfig();
  _cachedBridges = data.bridges || [];
  renderBridges(container);
}

function renderBridges(container) {
  if (!_cachedBridges || _cachedBridges.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-text">No Data Bridges configured</div></div>`;
    return;
  }

  let rows = '';
  _cachedBridges.forEach(b => {
    const isOn = b.is_enabled;
    rows += `
    <tr>
      <td style="font-weight:600">${esc(b.source_module)} → ${esc(b.target_module)}</td>
      <td style="font-size:11px;color:var(--td)">${esc(b.data_type)}</td>
      <td style="font-size:11px;color:var(--td)">${esc(b.description || '-')}</td>
      <td style="text-align:center"><span class="item-badge ${isOn ? 'badge-approved' : 'badge-suspended'}" style="margin:0">${isOn ? 'ON' : 'OFF'}</span></td>
      <td style="text-align:center"><button class="btn btn-sm ${isOn ? 'btn-danger' : 'btn-gold'}" style="padding:4px 10px;font-size:10px" onclick="Screens.toggleBridge('${esc(b.bridge_id)}',${!isOn})">${isOn ? 'ปิด' : 'เปิด'}</button></td>
    </tr>`;
  });

  container.innerHTML = `
  <div style="font-size:11px;color:var(--tm);margin-bottom:8px">Sale Daily ↔ Finance Bridge Config</div>
  <div class="perm-table-wrap">
    <table class="perm-table" style="font-size:12px">
      <thead><tr><th style="text-align:left">Bridge</th><th>Type</th><th>Description</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

async function toggleBridge(bridgeId, enable) {
  try {
    await API.adminUpdateBridge(bridgeId, enable);
    App.toast(enable ? 'Bridge enabled' : 'Bridge disabled', 'success');
    // Update cache + re-render (no re-fetch)
    if (_cachedBridges) {
      const b = _cachedBridges.find(x => x.bridge_id === bridgeId);
      if (b) b.is_enabled = enable;
      const container = $('admin-content');
      if (container) renderBridges(container);
    }
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
      <div style="flex:1">
        <div class="header-title">Account Detail</div>
        <div class="header-sub">← Accounts</div>
      </div>
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
    // 2.3 — Use cache first, fallback to API for deep links
    let acc = _allAccounts.length > 0 ? _allAccounts.find(a => a.account_id === accountId || a.username === accountId) : null;
    if (!acc) {
      const data = await API.adminGetAccounts({ search: accountId, page_size: 50 });
      acc = data.accounts?.find(a => a.account_id === accountId || a.username === accountId);
    }
    if (!acc) { content.innerHTML = '<div class="empty-state">Account not found</div>'; return; }
    _accountDetail = acc;

    content.innerHTML = `
    <div class="profile-avatar">
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--gold-bg2),#f9e8c0);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:var(--gold);margin:0 auto">${esc((acc.display_label || '?').charAt(0).toUpperCase())}</div>
      <div class="name">${esc(acc.display_label)}</div>
      <div class="sub">${esc(acc.username)} · ${esc(acc.account_id)}</div>
    </div>
    <div class="profile-section">
      <div class="profile-row"><span class="label">Type</span><span class="value">${esc(acc.account_type)}</span></div>
      <div class="profile-row"><span class="label">Tier</span><span class="value"><span style="padding:2px 8px;border-radius:8px;background:var(--gold-bg2);color:var(--gold);font-size:11px;font-weight:600">${esc(acc.tier_id)}</span></span></div>
      <div class="profile-row"><span class="label">Status</span><span class="value"><span class="item-badge ${acc.status === 'approved' ? 'badge-approved' : acc.status === 'suspended' ? 'badge-suspended' : 'badge-pending'}" style="margin:0">${esc(acc.status)}</span></span></div>
      <div class="profile-row"><span class="label">Store</span><span class="value">${esc(acc.store_id || '-')}</span></div>
      <div class="profile-row"><span class="label">Department</span><span class="value">${esc(acc.dept_id || '-')}</span></div>
      <div class="profile-row"><span class="label">Users</span><span class="value">${acc.user_count}</span></div>
      <div class="profile-row"><span class="label">Last Login</span><span class="value">${formatDate(acc.last_login)}</span></div>
      <div class="profile-row"><span class="label">Created</span><span class="value">${formatDate(acc.created_at)}</span></div>
    </div>
    <div class="profile-section" style="margin-top:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:600;font-size:14px">Users</div>
        ${acc.account_type === 'group' ? `<button class="btn btn-gold btn-sm" onclick="Screens.showAddUser('${esc(acc.account_id)}')">+ Add</button>` : ''}
      </div>
      <div id="acc-users-list"><div style="text-align:center;padding:10px;color:var(--tm);font-size:12px">Loading users...</div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;padding-top:8px">
      <button class="btn btn-outline btn-full" onclick="Screens.showEditAccount('${esc(acc.account_id)}')">✏️ Edit Account</button>
      <button class="btn btn-outline btn-full" style="color:var(--td)" onclick="App.toast('Reset password — coming soon','info')">🔑 Reset Password</button>
      ${acc.status === 'approved' ? `<button class="btn btn-danger btn-full" onclick="Screens.suspendAccount('${esc(acc.account_id)}')">🚫 Suspend Account</button>` : ''}
      ${acc.status === 'suspended' ? `<button class="btn btn-gold btn-full" onclick="Screens.reactivateAccount('${esc(acc.account_id)}')">✅ Reactivate Account</button>` : ''}
    </div>`;
    // Load users for this account
    try {
      const ud = await API.adminGetUsers(acc.account_id);
      const uList = $('acc-users-list');
      if (uList && ud.users) {
        if (ud.users.length === 0) {
          uList.innerHTML = '<div style="text-align:center;padding:10px;color:var(--tm);font-size:12px">No users</div>';
        } else {
          uList.innerHTML = ud.users.map(u => `
            <div class="list-item" style="padding:8px 0">
              <div class="item-avatar">${u.is_active ? '\u{1F7E2}' : '\u{1F534}'}</div>
              <div class="item-info" style="flex:1">
                <div class="item-name">${esc(u.display_name)}</div>
                <div class="item-meta">${esc(u.user_id)} \u00B7 ${esc(u.full_name || '')} \u00B7 ${esc(u.phone || '-')}</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick='Screens.showEditUser(${JSON.stringify({user_id:u.user_id,display_name:u.display_name||"",full_name:u.full_name||"",phone:u.phone||"",is_active:u.is_active}).replace(/\x27/g,"&#39;")})'>Edit</button>
            </div>`).join('');
        }
      }
    } catch(e) { console.warn('Load users failed', e); }

  } catch (err) {
    content.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
  }
}

async function showEditAccount(accountId) {
  const acc = _accountDetail;
  if (!acc) return;

  // Load stores & departments from cache
  let storeOpts = '<option value="">-- \u0e44\u0e21\u0e48\u0e23\u0e30\u0e1a\u0e38 --</option>';
  let deptOpts = '<option value="">-- \u0e44\u0e21\u0e48\u0e23\u0e30\u0e1a\u0e38 --</option>';
  try {
    const [stores, depts] = await Promise.all([getStoresCache(), getDeptsCache()]);
    stores.forEach(s => {
      storeOpts += `<option value="${esc(s.store_id)}" ${acc.store_id===s.store_id?'selected':''}>${esc(s.store_name)} (${esc(s.store_id)})</option>`;
    });
    depts.forEach(d => {
      deptOpts += `<option value="${esc(d.dept_id)}" ${acc.dept_id===d.dept_id?'selected':''}>${esc(d.dept_name)} (${esc(d.dept_id)})</option>`;
    });
  } catch(e) { console.warn('Failed to load stores/depts', e); }

  const html = `
  <div class="modal-overlay" id="modal-edit-acc" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-close" onclick="document.getElementById('modal-edit-acc').remove()">\u2715</div>
      <div class="modal-title">Edit Account</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="input-group"><label>Display Label</label><input class="input-field" id="inp-ea-label" value="${esc(acc.display_label || '')}"></div>
        <div class="input-group"><label>Tier</label>
          <select class="input-field" id="inp-ea-tier">
            ${['T1','T2','T3','T4','T5','T6','T7'].map(t => `<option value="${t}" ${acc.tier_id===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="input-group"><label>Store</label><select class="input-field" id="inp-ea-store">${storeOpts}</select></div>
        <div class="input-group"><label>Department</label><select class="input-field" id="inp-ea-dept">${deptOpts}</select></div>
        <div class="input-group"><label>Status</label>
          <select class="input-field" id="inp-ea-status">
            ${['approved','suspended','pending'].map(s => `<option value="${s}" ${acc.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="input-group"><label>New Password (leave blank to keep)</label><input type="password" class="input-field" id="inp-ea-pass" placeholder="New password"></div>
        <div class="error-msg" id="ea-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doEditAccount('${esc(accountId)}')">Save Changes</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}
async function doEditAccount(accountId) {
  const updates = {
    target_account_id: accountId,
    display_label: $('inp-ea-label').value.trim(),
    tier_id: $('inp-ea-tier').value,
    store_id: $('inp-ea-store').value.trim(),
    dept_id: $('inp-ea-dept').value.trim(),
    status: $('inp-ea-status').value
  };
  const newPass = $('inp-ea-pass').value;
  if (newPass) updates.password = newPass;

  App.showLoader();
  try {
    await API.adminUpdateAccount(updates);
    document.getElementById('modal-edit-acc')?.remove();
    App.toast('Account updated', 'success');
    _allAccounts = []; // clear cache — next list load will re-fetch
    loadAccountDetail(accountId);
  } catch (err) {
    showFieldError('ea-error', err.message);
  } finally {
    App.hideLoader();
  }
}

async function suspendAccount(accountId) {
  const ok = await App.showDialog({ title: 'Suspend Account', message: 'ยืนยันระงับบัญชีนี้?', confirmText: 'Suspend', danger: true });
  if (!ok) return;
  App.showLoader();
  try {
    await API.adminUpdateAccount({ target_account_id: accountId, status: 'suspended' });
    App.toast('Account suspended', 'success');
    _allAccounts = [];
    loadAccountDetail(accountId);
  } catch (err) { App.toast(err.message, 'error'); }
  finally { App.hideLoader(); }
}

async function reactivateAccount(accountId) {
  App.showLoader();
  try {
    await API.adminUpdateAccount({ target_account_id: accountId, status: 'approved' });
    App.toast('Account reactivated', 'success');
    _allAccounts = [];
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
      <button class="back-btn" onclick="App.go('admin',{tab:'registrations'})">←</button>
      <div style="flex:1">
        <div class="header-title">Registration Review</div>
        <div class="header-sub">← Requests</div>
      </div>
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
    // 2.4 — Use cache first, fallback to API for deep links
    let req = _allRegs.length > 0 ? _allRegs.find(r => r.request_id === requestId) : null;
    if (!req) {
      const data = await API.adminGetRegistrations({ page_size: 100 });
      req = data.requests?.find(r => r.request_id === requestId);
    }
    if (!req) { content.innerHTML = '<div class="empty-state">ไม่พบคำขอ</div>'; return; }
    _regDetail = req;

    content.innerHTML = `
    <div style="padding:14px;background:var(--orange-bg);border:1px solid rgba(217,119,6,0.15);border-radius:var(--radius);margin-bottom:12px">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px">${esc(req.display_name || req.full_name)}</div>
      <div style="font-size:12px;line-height:2;color:var(--t)">
        <div><span style="color:var(--td)">Email:</span> ${esc(req.username || req.email || '-')}</div>
        <div><span style="color:var(--td)">Phone:</span> ${esc(req.phone || '-')}</div>
        <div><span style="color:var(--td)">Store:</span> ${esc(req.requested_store_id || '-')}</div>
        <div><span style="color:var(--td)">Dept:</span> ${esc(req.requested_dept_id || '-')}</div>
        ${req.note ? `<div><span style="color:var(--td)">Note:</span> ${esc(req.note)}</div>` : ''}
        <div><span style="color:var(--td)">Submitted:</span> ${formatDate(req.submitted_at)}</div>
        <div><span style="color:var(--td)">Status:</span> <span class="item-badge ${req.status === 'pending' ? 'badge-pending' : req.status === 'approved' ? 'badge-approved' : 'badge-suspended'}" style="margin:0">${esc(req.status)}</span></div>
      </div>
      ${req.reviewed_by ? `<div style="font-size:11px;color:var(--td);margin-top:6px;border-top:1px solid rgba(217,119,6,0.15);padding-top:6px">พิจารณาโดย: ${esc(req.reviewed_by)} · ${formatDate(req.reviewed_at)}</div>` : ''}
    </div>
    ${req.status === 'pending' ? `
    <div style="font-size:11px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Assign (if approve)</div>
    <div class="input-group" style="margin-bottom:10px">
      <label>Tier *</label>
      <select class="input-field" id="inp-rev-tier">
        <option value="T5" selected>T5 — Staff</option>
        <option value="T6">T6 — Junior</option>
        <option value="T7">T7 — Viewer</option>
        <option value="T4">T4 — Senior</option>
        <option value="T3">T3 — Manager</option>
      </select>
    </div>
    <div class="input-group" style="margin-bottom:10px">
      <label>หมายเหตุ Admin</label>
      <textarea class="input-field" id="inp-rev-note" placeholder="ไม่บังคับ"></textarea>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-full" style="flex:1;background:var(--green);color:#fff" onclick="Screens.reviewReg('${esc(req.request_id)}','approve')">✅ Approve</button>
      <button class="btn btn-full" style="flex:1;background:var(--red);color:#fff" onclick="Screens.reviewReg('${esc(req.request_id)}','reject')">❌ Reject</button>
    </div>
    ` : ''}`;
  } catch (err) {
    content.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
  }
}

async function reviewReg(requestId, action) {
  const isApprove = action === 'approve';
  const ok = await App.showDialog({
    title: isApprove ? 'Approve' : 'Reject',
    message: isApprove ? 'ยืนยันอนุมัติคำขอนี้?' : 'ยืนยันปฏิเสธคำขอนี้?',
    confirmText: isApprove ? '✅ อนุมัติ' : '❌ ปฏิเสธ',
    danger: !isApprove
  });
  if (!ok) return;

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
    _allRegs = []; // clear cache — next list load will re-fetch
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
      <div style="flex:1">
        <div class="header-title">Audit Log</div>
        <div class="header-sub">← Admin</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;padding:10px 16px;align-items:center">
      <input type="text" class="input-field input-sm" id="audit-search" placeholder="🔍 Search..." style="flex:1" onkeyup="if(event.key==='Enter')Screens.loadAuditLog()">
      <select class="input-field input-sm" id="audit-type" onchange="Screens.loadAuditLog()" style="width:auto;min-width:100px">
        <option value="">All Actions</option>
        <option value="login">Login</option>
        <option value="logout">Logout</option>
        <option value="staff_select">Staff Select</option>
        <option value="account_change">Account</option>
        <option value="permission_change">Permission</option>
        <option value="registration">Registration</option>
        <option value="module_access">Module Access</option>
        <option value="config_change">Config</option>
        <option value="bridge_change">Bridge</option>
      </select>
      <button class="btn btn-outline btn-sm" onclick="Screens.exportAudit()">📥 Export</button>
    </div>
    <div class="screen-body" id="audit-content" style="padding-top:0">
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

// ─── Add User (group accounts) ───
function showAddUser(accountId) {
  const html = `
  <div class="modal-overlay" id="modal-add-user" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Add User</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="input-group"><label>Display Name</label><input class="input-field" id="inp-au-name" placeholder="\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e2a\u0e14\u0e07"></div>
        <div class="input-group"><label>Full Name</label><input class="input-field" id="inp-au-full" placeholder="\u0e0a\u0e37\u0e48\u0e2d-\u0e19\u0e32\u0e21\u0e2a\u0e01\u0e38\u0e25"></div>
        <div class="input-group"><label>Phone</label><input class="input-field" id="inp-au-phone" placeholder="0412345678"></div>
        <div class="error-msg" id="au-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doAddUser('${accountId}')">\u0e40\u0e1e\u0e34\u0e48\u0e21 User</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doAddUser(accountId) {
  const data = {
    account_id: accountId,
    display_name: $('inp-au-name')?.value?.trim(),
    full_name: $('inp-au-full')?.value?.trim(),
    phone: $('inp-au-phone')?.value?.trim(),
  };
  if (!data.display_name || !data.full_name) return showFieldError('au-error', 'Please fill display name and full name');

  App.showLoader();
  try {
    await API.createUser(data);
    document.getElementById('modal-add-user')?.remove();
    App.toast('User added', 'success');
    loadAccountDetail(accountId);
  } catch(e) {
    showFieldError('au-error', e.message);
  } finally { App.hideLoader(); }
}

// ─── Edit User ───
function showEditUser(u) {
  const html = `
  <div class="modal-overlay" id="modal-edit-user" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Edit User</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="input-group"><label>User ID</label><div class="input-field" style="background:var(--bg2);cursor:default">${esc(u.user_id)}</div></div>
        <div class="input-group"><label>Display Name</label><input class="input-field" id="inp-eu-name" value="${esc(u.display_name || '')}"></div>
        <div class="input-group"><label>Full Name</label><input class="input-field" id="inp-eu-full" value="${esc(u.full_name || '')}"></div>
        <div class="input-group"><label>Phone</label><input class="input-field" id="inp-eu-phone" value="${esc(u.phone || '')}"></div>
        <div class="input-group"><label>New PIN (leave blank to keep)</label><input class="input-field" id="inp-eu-pin" type="password" placeholder="New PIN (min 4 digits)" inputmode="numeric" maxlength="6"></div>
        <div class="input-group"><label>Status</label>
          <select class="input-field" id="inp-eu-active">
            <option value="true" ${u.is_active?'selected':''}>Active</option>
            <option value="false" ${!u.is_active?'selected':''}>Inactive</option>
          </select>
        </div>
        <div class="error-msg" id="eu-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doEditUser('${esc(u.user_id)}')">Save</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doEditUser(userId) {
  const pinVal = ($('inp-eu-pin')?.value || '').trim();
  const data = {
    user_id: userId,
    display_name: $('inp-eu-name')?.value?.trim(),
    full_name: $('inp-eu-full')?.value?.trim(),
    phone: $('inp-eu-phone')?.value?.trim(),
    is_active: $('inp-eu-active')?.value === 'true',
  };
  if (pinVal) data.new_pin = pinVal;
  App.showLoader();
  try {
    await API.adminUpdateUser(data);
    document.getElementById('modal-edit-user')?.remove();
    App.toast('User updated', 'success');
    if (_accountDetail) loadAccountDetail(_accountDetail.account_id);
  } catch(e) {
    showFieldError('eu-error', e.message);
  } finally { App.hideLoader(); }
}


// ─── Modules Admin Tab ───
async function loadModulesAdmin(container) {
  try {
    const data = await API.adminGetAllModules();
    if (!data.modules || data.modules.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-text">No modules</div></div>';
      return;
    }
    let rows = '';
    data.modules.forEach(m => {
      const statusBadge = m.status === 'active' ? 'badge-approved' : m.status === 'coming_soon' ? 'badge-pending' : 'badge-suspended';
      const urlShort = (m.app_url || '—').length > 35 ? (m.app_url || '').substring(0, 35) + '…' : (m.app_url || '—');
      rows += `
      <tr>
        <td style="text-align:center;font-size:18px">${esc(m.icon || '📦')}</td>
        <td style="font-weight:600">${esc(m.module_name)}</td>
        <td style="font-size:11px;color:var(--td)">${esc(m.module_name_en || '-')}</td>
        <td style="font-size:9px;color:var(--tm);word-break:break-all">${esc(urlShort)}</td>
        <td style="text-align:center"><span class="item-badge ${statusBadge}" style="margin:0">${esc(m.status)}</span></td>
        <td style="text-align:center"><button class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:9px" onclick='Screens.showEditModule(${JSON.stringify({module_id:m.module_id,module_name:m.module_name||"",module_name_en:m.module_name_en||"",icon:m.icon||"",app_url:m.app_url||"",status:m.status||"inactive",sort_order:m.sort_order||0}).replace(/\x27/g,"&#39;")})'>✏️</button></td>
      </tr>`;
    });
    container.innerHTML = `
    <div class="perm-table-wrap">
      <table class="perm-table" style="font-size:12px">
        <thead><tr><th>Icon</th><th style="text-align:left">Module</th><th style="text-align:left">Name (EN)</th><th style="text-align:left">URL</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  } catch(e) {
    container.innerHTML = '<div class="empty-state">' + esc(e.message) + '</div>';
  }
}

function showEditModule(mod) {
  const html = `
  <div class="modal-overlay" id="modal-edit-mod" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-close" onclick="document.getElementById('modal-edit-mod').remove()">\u2715</div>
      <div class="modal-title">Edit Module</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="input-group"><label>Module ID</label><div class="input-field" style="background:var(--bg2);cursor:default">${esc(mod.module_id)}</div></div>
        <div class="input-group"><label>\u0e0a\u0e37\u0e48\u0e2d (TH)</label><input class="input-field" id="inp-em-name" value="${esc(mod.module_name)}"></div>
        <div class="input-group"><label>Name (EN)</label><input class="input-field" id="inp-em-name-en" value="${esc(mod.module_name_en)}"></div>
        <div class="input-group"><label>Icon (emoji)</label><input class="input-field" id="inp-em-icon" value="${esc(mod.icon)}"></div>
        <div class="input-group"><label>App URL</label><input class="input-field" id="inp-em-url" value="${esc(mod.app_url)}" placeholder="https://..."></div>
        <div class="input-group"><label>Status</label>
          <select class="input-field" id="inp-em-status">
            <option value="active" ${mod.status==='active'?'selected':''}>Active</option>
            <option value="inactive" ${mod.status==='inactive'?'selected':''}>Inactive</option>
            <option value="coming_soon" ${mod.status==='coming_soon'?'selected':''}>Coming Soon</option>
          </select>
        </div>
        <div class="input-group"><label>Sort Order</label><input class="input-field" type="number" id="inp-em-sort" value="${mod.sort_order}"></div>
        <div class="error-msg" id="em-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doEditModule('${esc(mod.module_id)}')">Save</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doEditModule(moduleId) {
  const data = {
    module_id: moduleId,
    module_name: $('inp-em-name')?.value?.trim(),
    module_name_en: $('inp-em-name-en')?.value?.trim(),
    icon: $('inp-em-icon')?.value?.trim(),
    app_url: $('inp-em-url')?.value?.trim(),
    status: $('inp-em-status')?.value,
    sort_order: parseInt($('inp-em-sort')?.value) || 0
  };
  App.showLoader();
  try {
    await API.adminUpdateModule(data);
    document.getElementById('modal-edit-mod')?.remove();
    App.toast('Module updated', 'success');
    loadAdminContent();
  } catch(e) {
    showFieldError('em-error', e.message);
  } finally { App.hideLoader(); }
}


// ─── Users Admin Tab ───
async function loadUsersAdmin(container) {
  try {
    const q = $('user-admin-search')?.value || '';
    const data = await API.adminListAllUsers(q);
    let searchBar = `<div class="admin-toolbar"><input type="text" class="input-field input-sm" id="user-admin-search" placeholder="🔍 Search users..." value="${esc(q)}" onkeyup="if(event.key==='Enter')Screens.loadUsersAdmin($('admin-content'))"></div>`;
    if (!data.users || data.users.length === 0) {
      container.innerHTML = searchBar + '<div class="empty-state"><div class="empty-text">No users found</div></div>';
      return;
    }
    let rows = '';
    data.users.forEach(u => {
      rows += `
      <tr style="cursor:pointer" onclick="App.go('account-detail',{account_id:'${esc(u.account_id)}'})">
        <td style="text-align:center">${u.is_active ? '🟢' : '🔴'}</td>
        <td style="font-weight:600">${esc(u.display_name)}</td>
        <td style="font-size:11px;color:var(--td)">${esc(u.account_label)}</td>
        <td style="text-align:center">${esc(u.store_id || '-')}</td>
        <td style="text-align:center">${esc(u.dept_id || '-')}</td>
        <td style="text-align:center;font-size:11px;color:var(--tm)">${esc(u.account_type)}</td>
        <td style="color:var(--blue);font-size:10px;text-align:center">→</td>
      </tr>`;
    });
    container.innerHTML = searchBar + `
    <div style="font-size:11px;color:var(--tm);padding:0 16px 6px">${data.total} users</div>
    <div class="perm-table-wrap">
      <table class="perm-table" style="font-size:12px">
        <thead><tr><th></th><th style="text-align:left">Name</th><th style="text-align:left">Account</th><th>Store</th><th>Dept</th><th>Type</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  } catch(e) { container.innerHTML = '<div class="empty-state">' + esc(e.message) + '</div>'; }
}

// ─── Stores Admin Tab ───
let _cachedStoresAdmin = null;

async function loadStoresAdmin(container) {
  try {
    const data = await API.adminGetAllStores();
    _cachedStoresAdmin = data.stores || [];
    renderStoresAdmin(container);
  } catch(e) { container.innerHTML = '<div class="empty-state">' + esc(e.message) + '</div>'; }
}

function renderStoresAdmin(container) {
  if (!_cachedStoresAdmin || _cachedStoresAdmin.length === 0) {
    container.innerHTML = `<div class="admin-toolbar"><button class="btn btn-gold btn-sm" onclick="Screens.showCreateStore()">+ เพิ่มร้าน</button></div><div class="empty-state"><div class="empty-text">No stores</div></div>`;
    return;
  }
  let rows = '';
  _cachedStoresAdmin.forEach(s => {
    rows += `
    <tr>
      <td style="font-weight:700">${esc(s.store_id)}</td>
      <td>${esc(s.store_name_th || '-')}</td>
      <td>${esc(s.store_name)}</td>
      <td style="font-size:11px;color:var(--td)">${esc(s.brand || '-')}</td>
      <td style="text-align:center"><span class="item-badge ${s.is_active ? 'badge-approved' : 'badge-suspended'}" style="margin:0">${s.is_active ? 'Active' : 'Inactive'}</span></td>
      <td style="text-align:center"><button class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:9px" onclick='Screens.showEditStore(${JSON.stringify({store_id:s.store_id,store_name:s.store_name||"",store_name_th:s.store_name_th||"",brand:s.brand||"",location:s.location||"",is_active:s.is_active}).replace(/\x27/g,"&#39;")})'>✏️</button></td>
    </tr>`;
  });
  container.innerHTML = `
  <div class="admin-toolbar"><button class="btn btn-gold btn-sm" onclick="Screens.showCreateStore()">+ เพิ่มร้าน</button></div>
  <div class="perm-table-wrap">
    <table class="perm-table" style="font-size:12px">
      <thead><tr><th style="text-align:left">Store ID</th><th style="text-align:left">Name (TH)</th><th style="text-align:left">Name (EN)</th><th style="text-align:left">Brand</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function showCreateStore() {
  const html = `
  <div class="modal-overlay" id="modal-create-store" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Create Store</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="input-group"><label>Store ID (e.g. MNG)</label><input class="input-field" id="inp-cs-id" placeholder="ABC" style="text-transform:uppercase"></div>
        <div class="input-group"><label>Store Name (EN)</label><input class="input-field" id="inp-cs-name" placeholder="Store Name"></div>
        <div class="input-group"><label>Store Name (TH)</label><input class="input-field" id="inp-cs-name-th" placeholder="\u0e0a\u0e37\u0e48\u0e2d\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22"></div>
        <div class="input-group"><label>Brand</label><input class="input-field" id="inp-cs-brand" placeholder="Brand name"></div>
        <div class="input-group"><label>Location</label><input class="input-field" id="inp-cs-location" placeholder="Location"></div>
        <div class="error-msg" id="cs-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doCreateStore()">\u0e2a\u0e23\u0e49\u0e32\u0e07 Store</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doCreateStore() {
  const data = { store_id: ($('inp-cs-id')?.value||'').trim().toUpperCase(), store_name: ($('inp-cs-name')?.value||'').trim(), store_name_th: ($('inp-cs-name-th')?.value||'').trim(), brand: ($('inp-cs-brand')?.value||'').trim(), location: ($('inp-cs-location')?.value||'').trim() };
  if (!data.store_id || !data.store_name) return showFieldError('cs-error', 'Store ID and Name required');
  App.showLoader();
  try {
    await API.adminCreateStore(data);
    document.getElementById('modal-create-store')?.remove();
    App.toast('Store created', 'success');
    _cachedStores = null;
    // Push to admin cache + re-render (no re-fetch)
    if (_cachedStoresAdmin) {
      _cachedStoresAdmin.push({ ...data, is_active: true });
      const container = $('admin-content');
      if (container) renderStoresAdmin(container);
    } else { loadAdminContent(); }
  } catch(e) { showFieldError('cs-error', e.message); }
  finally { App.hideLoader(); }
}

function showEditStore(s) {
  const html = `
  <div class="modal-overlay" id="modal-edit-store" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Edit Store</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="input-group"><label>Store ID</label><div class="input-field" style="background:var(--bg2);cursor:default">${esc(s.store_id)}</div></div>
        <div class="input-group"><label>Store Name (EN)</label><input class="input-field" id="inp-es-name" value="${esc(s.store_name)}"></div>
        <div class="input-group"><label>Store Name (TH)</label><input class="input-field" id="inp-es-name-th" value="${esc(s.store_name_th)}"></div>
        <div class="input-group"><label>Brand</label><input class="input-field" id="inp-es-brand" value="${esc(s.brand)}"></div>
        <div class="input-group"><label>Location</label><input class="input-field" id="inp-es-location" value="${esc(s.location)}"></div>
        <div class="input-group"><label>Status</label>
          <select class="input-field" id="inp-es-active">
            <option value="true" ${s.is_active?'selected':''}>Active</option>
            <option value="false" ${!s.is_active?'selected':''}>Inactive</option>
          </select>
        </div>
        <div class="error-msg" id="es-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doEditStore('${esc(s.store_id)}')">Save</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doEditStore(storeId) {
  const data = { store_id: storeId, store_name: ($('inp-es-name')?.value||'').trim(), store_name_th: ($('inp-es-name-th')?.value||'').trim(), brand: ($('inp-es-brand')?.value||'').trim(), location: ($('inp-es-location')?.value||'').trim(), is_active: $('inp-es-active')?.value === 'true' };
  App.showLoader();
  try {
    await API.adminUpdateStore(data);
    document.getElementById('modal-edit-store')?.remove();
    App.toast('Store updated', 'success');
    _cachedStores = null;
    // Update admin cache + re-render (no re-fetch)
    if (_cachedStoresAdmin) {
      const idx = _cachedStoresAdmin.findIndex(s => s.store_id === storeId);
      if (idx >= 0) Object.assign(_cachedStoresAdmin[idx], data);
      const container = $('admin-content');
      if (container) renderStoresAdmin(container);
    } else { loadAdminContent(); }
  } catch(e) { showFieldError('es-error', e.message); }
  finally { App.hideLoader(); }
}

// ─── Departments Admin Tab ───
let _cachedDeptsAdmin = null;

async function loadDeptsAdmin(container) {
  try {
    const data = await API.adminGetAllDepts();
    _cachedDeptsAdmin = data.departments || [];
    renderDeptsAdmin(container);
  } catch(e) { container.innerHTML = '<div class="empty-state">' + esc(e.message) + '</div>'; }
}

function renderDeptsAdmin(container) {
  if (!_cachedDeptsAdmin || _cachedDeptsAdmin.length === 0) {
    container.innerHTML = `<div class="admin-toolbar"><button class="btn btn-gold btn-sm" onclick="Screens.showCreateDept()">+ เพิ่มแผนก</button></div><div class="empty-state"><div class="empty-text">No departments</div></div>`;
    return;
  }
  let rows = '';
  _cachedDeptsAdmin.forEach(d => {
    rows += `
    <tr>
      <td style="font-weight:700">${esc(d.dept_id)}</td>
      <td>${esc(d.dept_name_th || '-')}</td>
      <td>${esc(d.dept_name)}</td>
      <td style="text-align:center"><span class="item-badge ${d.is_active ? 'badge-approved' : 'badge-suspended'}" style="margin:0">${d.is_active ? 'Active' : 'Inactive'}</span></td>
      <td style="text-align:center"><button class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:9px" onclick='Screens.showEditDept(${JSON.stringify({dept_id:d.dept_id,dept_name:d.dept_name||"",dept_name_th:d.dept_name_th||"",is_active:d.is_active}).replace(/\x27/g,"&#39;")})'>✏️</button></td>
    </tr>`;
  });
  container.innerHTML = `
  <div class="admin-toolbar"><button class="btn btn-gold btn-sm" onclick="Screens.showCreateDept()">+ เพิ่มแผนก</button></div>
  <div class="perm-table-wrap">
    <table class="perm-table" style="font-size:12px">
      <thead><tr><th style="text-align:left">Dept ID</th><th style="text-align:left">Name (TH)</th><th style="text-align:left">Name (EN)</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function showCreateDept() {
  const html = `
  <div class="modal-overlay" id="modal-create-dept" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Create Department</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="input-group"><label>Dept ID (e.g. bakery)</label><input class="input-field" id="inp-cd-id" placeholder="dept_id" style="text-transform:lowercase"></div>
        <div class="input-group"><label>Dept Name (EN)</label><input class="input-field" id="inp-cd-name" placeholder="Department Name"></div>
        <div class="input-group"><label>Dept Name (TH)</label><input class="input-field" id="inp-cd-name-th" placeholder="\u0e0a\u0e37\u0e48\u0e2d\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22"></div>
        <div class="error-msg" id="cd-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doCreateDept()">\u0e2a\u0e23\u0e49\u0e32\u0e07 Department</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doCreateDept() {
  const data = { dept_id: ($('inp-cd-id')?.value||'').trim().toLowerCase(), dept_name: ($('inp-cd-name')?.value||'').trim(), dept_name_th: ($('inp-cd-name-th')?.value||'').trim() };
  if (!data.dept_id || !data.dept_name) return showFieldError('cd-error', 'Dept ID and Name required');
  App.showLoader();
  try {
    await API.adminCreateDept(data);
    document.getElementById('modal-create-dept')?.remove();
    App.toast('Department created', 'success');
    _cachedDepts = null;
    if (_cachedDeptsAdmin) {
      _cachedDeptsAdmin.push({ ...data, is_active: true });
      const container = $('admin-content');
      if (container) renderDeptsAdmin(container);
    } else { loadAdminContent(); }
  } catch(e) { showFieldError('cd-error', e.message); }
  finally { App.hideLoader(); }
}

function showEditDept(d) {
  const html = `
  <div class="modal-overlay" id="modal-edit-dept" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Edit Department</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="input-group"><label>Dept ID</label><div class="input-field" style="background:var(--bg2);cursor:default">${esc(d.dept_id)}</div></div>
        <div class="input-group"><label>Dept Name (EN)</label><input class="input-field" id="inp-ed-name" value="${esc(d.dept_name)}"></div>
        <div class="input-group"><label>Dept Name (TH)</label><input class="input-field" id="inp-ed-name-th" value="${esc(d.dept_name_th)}"></div>
        <div class="input-group"><label>Status</label>
          <select class="input-field" id="inp-ed-active">
            <option value="true" ${d.is_active?'selected':''}>Active</option>
            <option value="false" ${!d.is_active?'selected':''}>Inactive</option>
          </select>
        </div>
        <div class="error-msg" id="ed-error"></div>
        <button class="btn btn-gold btn-full" onclick="Screens.doEditDept('${esc(d.dept_id)}')">Save</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doEditDept(deptId) {
  const data = { dept_id: deptId, dept_name: ($('inp-ed-name')?.value||'').trim(), dept_name_th: ($('inp-ed-name-th')?.value||'').trim(), is_active: $('inp-ed-active')?.value === 'true' };
  App.showLoader();
  try {
    await API.adminUpdateDept(data);
    document.getElementById('modal-edit-dept')?.remove();
    App.toast('Department updated', 'success');
    _cachedDepts = null;
    if (_cachedDeptsAdmin) {
      const idx = _cachedDeptsAdmin.findIndex(d => d.dept_id === deptId);
      if (idx >= 0) Object.assign(_cachedDeptsAdmin[idx], data);
      const container = $('admin-content');
      if (container) renderDeptsAdmin(container);
    } else { loadAdminContent(); }
  } catch(e) { showFieldError('ed-error', e.message); }
  finally { App.hideLoader(); }
}

// EXTEND Screens OBJECT (Part 2)
// ════════════════════════════════
// ─── Tier Access Tab ───
let _tierData = null;

async function loadTierAccess(container) {
  const data = await API.adminGetModuleAccess();
  _tierData = data;
  renderTierGrid(container);
}

function renderTierGrid(container) {
  const d = _tierData;
  if (!d) return;

  const mods = d.modules || [];
  const accs = d.accounts || [];
  const overrides = d.overrides || [];
  const tiers = d.tiers || [];

  const oMap = {};
  overrides.forEach(o => { oMap[`${o.account_id}|${o.module_id}`] = o; });

  let hdr = `<th style="position:sticky;left:0;background:var(--s1);z-index:2;min-width:130px;text-align:left">Account</th><th style="text-align:center;min-width:60px">Global</th>`;
  mods.forEach(m => { hdr += `<th style="min-width:90px;text-align:center">${esc(m.module_name_en || m.module_id)}</th>`; });

  let rows = '';
  accs.forEach(acc => {
    let cells = `<td style="position:sticky;left:0;background:#fff;z-index:1;white-space:nowrap"><span style="font-weight:600">${esc(acc.display_label)}</span><br><span style="font-size:10px;color:var(--tm)">${esc(acc.store_id || '')}</span></td>`;
    cells += `<td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${tierBg(acc.tier_id)};color:${tierColor(acc.tier_id)};font-size:11px;font-weight:600">${esc(acc.tier_id)}</span></td>`;

    mods.forEach(m => {
      const key = `${acc.account_id}|${m.module_id}`;
      const ov = oMap[key];
      if (ov && ov.is_active) {
        const dir = parseInt((ov.module_tier||'T9').replace('T','')) < parseInt((acc.tier_id||'T9').replace('T','')) ? '⬆' : '⬇';
        cells += `<td style="text-align:center;cursor:pointer" onclick="Screens.showTierOverride('${esc(acc.account_id)}','${esc(m.module_id)}','${esc(ov.module_tier)}','${esc(acc.display_label)}','${esc(m.module_name_en || m.module_id)}')">
          <span style="background:var(--orange-bg);color:var(--orange);padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">${esc(ov.module_tier)} ${dir}</span>
          <div style="font-size:9px;color:var(--orange)">override</div></td>`;
      } else {
        cells += `<td style="text-align:center;cursor:pointer" onclick="Screens.showTierOverride('${esc(acc.account_id)}','${esc(m.module_id)}','','${esc(acc.display_label)}','${esc(m.module_name_en || m.module_id)}')">
          <span style="font-size:11px;color:var(--tm)">— (${esc(acc.tier_id)})</span>
          <div style="font-size:9px;color:var(--tm)">= global</div></td>`;
      }
    });
    rows += `<tr>${cells}</tr>`;
  });

  container.innerHTML = `
    <div style="font-size:11px;color:var(--tm);margin-bottom:8px">
      กำหนด Tier ของแต่ละ account ต่อ module — override global tier ได้
    </div>
    <div style="display:flex;gap:6px;margin-bottom:10px;font-size:11px">
      <span style="padding:3px 10px;border-radius:8px;background:var(--orange-bg);color:var(--orange);font-weight:600">T3 ⬆</span> = override
      <span style="color:var(--tm)">— (T3) = global</span>
    </div>
    <div class="perm-table-wrap">
      <table class="perm-table" style="font-size:12px">
        <thead><tr>${hdr}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function showTierOverride(accountId, moduleId, currentTier, accLabel, modLabel) {
  const tiers = (_tierData?.tiers || []);
  const options = tiers.map(t =>
    `<option value="${esc(t.tier_id)}" ${t.tier_id === currentTier ? 'selected' : ''}>${esc(t.tier_id)} — ${esc(t.tier_name)}</option>`
  ).join('');

  const html = `
  <div class="modal-overlay" id="modal-tier" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-close" onclick="document.getElementById('modal-tier').remove()">✕</div>
      <div class="modal-title">Module Tier Override</div>
      <div style="font-size:13px;color:var(--tm);margin-bottom:12px">
        <strong>${esc(accLabel)}</strong> → <strong>${esc(modLabel)}</strong>
      </div>
      <div class="input-group">
        <label>Override Tier</label>
        <select class="input-field" id="inp-tier-override">${options}</select>
      </div>
      <div class="error-msg" id="tier-error"></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-gold btn-full" onclick="Screens.doSetTierOverride('${esc(accountId)}','${esc(moduleId)}')">Set Override</button>
        ${currentTier ? `<button class="btn btn-danger btn-full" onclick="Screens.doRemoveTierOverride('${esc(accountId)}','${esc(moduleId)}')">Remove</button>` : ''}
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function doSetTierOverride(accountId, moduleId) {
  const tier = $('inp-tier-override')?.value;
  if (!tier) return;
  App.showLoader();
  try {
    await API.adminSetModuleAccess(accountId, moduleId, tier);
    document.getElementById('modal-tier')?.remove();
    App.toast('Override saved', 'success');
    // Update cache + re-render (no re-fetch)
    if (_tierData) {
      const key = `${accountId}|${moduleId}`;
      const existing = _tierData.overrides.findIndex(o => `${o.account_id}|${o.module_id}` === key);
      if (existing >= 0) {
        _tierData.overrides[existing].module_tier = tier;
        _tierData.overrides[existing].is_active = true;
      } else {
        _tierData.overrides.push({ account_id: accountId, module_id: moduleId, module_tier: tier, is_active: true });
      }
      const container = $('admin-content');
      if (container) renderTierGrid(container);
    }
    App.hideLoader();
  } catch (e) {
    App.hideLoader();
    showFieldError('tier-error', e.message);
  }
}

async function doRemoveTierOverride(accountId, moduleId) {
  App.showLoader();
  try {
    await API.adminRemoveModuleAccess(accountId, moduleId);
    document.getElementById('modal-tier')?.remove();
    App.toast('Override removed — fallback global', 'success');
    // Remove from cache + re-render (no re-fetch)
    if (_tierData) {
      _tierData.overrides = _tierData.overrides.filter(o => !(o.account_id === accountId && o.module_id === moduleId));
      const container = $('admin-content');
      if (container) renderTierGrid(container);
    }
    App.hideLoader();
  } catch (e) {
    App.hideLoader();
    showFieldError('tier-error', e.message);
  }
}


Object.assign(Screens, {
  renderRegister, loadRegisterDropdowns, doRegister,
  renderPending,
  renderAdmin, adminTab, loadAdminContent,
  showCreateAccount, doCreateAccount,
  setPerm,
  toggleBridge,
  filterAccounts,
  renderAccountDetail, loadAccountDetail, suspendAccount, reactivateAccount,
  showEditAccount, doEditAccount,
  showAddUser, doAddUser, showEditUser, doEditUser,
  loadModulesAdmin, showEditModule, doEditModule,
  loadUsersAdmin,
  loadStoresAdmin, showCreateStore, doCreateStore, showEditStore, doEditStore,
  loadDeptsAdmin, showCreateDept, doCreateDept, showEditDept, doEditDept,
  loadTierAccess, showTierOverride, doSetTierOverride, doRemoveTierOverride,
  filterRegs,
  renderRegReview, loadRegReview, reviewReg,
  renderAudit, loadAuditLog, exportAudit
});

})();
