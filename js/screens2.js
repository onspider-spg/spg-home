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
      <div class="header-title">Register</div>
    </div>
    <div class="screen-body">
      <form class="reg-form" onsubmit="Screens.doRegister(event)">
        <div class="input-group">
          <label>Email *</label>
          <input type="email" class="input-field" id="inp-reg-email" placeholder="email@example.com" required>
        </div>
        <div class="input-group">
          <label>Password (min 8 characters) *</label>
          <input type="password" class="input-field" id="inp-reg-pass" placeholder="••••••••" required>
        </div>
        <div class="input-group">
          <label>Full Name *</label>
          <input type="text" class="input-field" id="inp-reg-full" placeholder="First Last" required>
        </div>
        <div class="input-group">
          <label>Display Name *</label>
          <input type="text" class="input-field" id="inp-reg-nick" placeholder="e.g. Mint" required>
        </div>
        <div class="input-group">
          <label>Phone *</label>
          <input type="tel" class="input-field" id="inp-reg-phone" placeholder="0412345678" required>
        </div>
        <div class="input-group">
          <label>Store</label>
          <select class="input-field" id="inp-reg-store"><option value="">Loading...</option></select>
        </div>
        <div class="input-group">
          <label>Department</label>
          <select class="input-field" id="inp-reg-dept"><option value="">Loading...</option></select>
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
    const [stores, depts] = await Promise.all([API.getStores(), API.getDepartments()]);
    const storeEl = $('inp-reg-store');
    const deptEl = $('inp-reg-dept');
    
    if (storeEl) {
      storeEl.innerHTML = '<option value="">-- Select Store --</option>' +
        stores.stores.map(s => `<option value="${esc(s.store_id)}">${esc(s.store_name_th || s.store_name)}</option>`).join('');
    }
    if (deptEl) {
      deptEl.innerHTML = '<option value="">-- Select Department --</option>' +
        depts.departments.map(d => `<option value="${esc(d.dept_id)}">${esc(d.dept_name_th || d.dept_name)}</option>`).join('');
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
      <div class="pending-icon" style="font-size:40px;color:var(--gold)">◷</div>
      <div class="pending-title">Pending Approval</div>
      <div class="pending-msg">
        Your registration has been submitted.<br>
        ${rid ? `Reference: <strong>${esc(rid)}</strong><br>` : ''}
        Please wait for admin approval.<br>
        You can sign in once approved.
      </div>
      <button class="btn btn-outline" style="margin-top:24px" onclick="App.go('login')">Back to Sign In</button>
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
    <div class="header-bar">
      <button class="back-btn" onclick="App.go('dashboard')">←</button>
      <div class="header-title">Admin Panel</div>
    </div>
    <div class="admin-tabs">
      <div class="admin-tab ${adminActiveTab==='accounts'?'active':''}" onclick="Screens.adminTab('accounts')">Accounts</div>
      <div class="admin-tab ${adminActiveTab==='permissions'?'active':''}" onclick="Screens.adminTab('permissions')">Permissions</div>
      <div class="admin-tab ${adminActiveTab==='registrations'?'active':''}" onclick="Screens.adminTab('registrations')">Requests</div>
      <div class="admin-tab ${adminActiveTab==='bridge'?'active':''}" onclick="Screens.adminTab('bridge')">Bridge</div>
      <div class="admin-tab" onclick="App.go('audit')">Audit</div>
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
  const idx = ['accounts','permissions','registrations','bridge'].indexOf(tab);
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
    <input type="text" class="input-field input-sm" id="acc-search" placeholder="Search..." value="${esc(q)}" oninput="Screens.filterAccounts()">
    <select class="input-field input-sm" id="acc-sort" onchange="Screens.filterAccounts()">
      <option value="name" ${sortBy==='name'?'selected':''}>Name</option>
      <option value="tier" ${sortBy==='tier'?'selected':''}>Tier</option>
      <option value="status" ${sortBy==='status'?'selected':''}>Status</option>
      <option value="created" ${sortBy==='created'?'selected':''}>Newest</option>
    </select>
    <button class="btn btn-gold btn-sm" onclick="Screens.showCreateAccount()">+ New</button>
  </div>`;

  if (filtered.length === 0) {
    html += '<div class="empty-state"><div class="empty-text">No accounts match</div></div>';
  } else {
    filtered.forEach(acc => {
      const badge = acc.status === 'approved' ? 'badge-approved' : acc.status === 'pending' ? 'badge-pending' : 'badge-suspended';
      html += `
      <div class="list-item" onclick="App.go('account-detail',{account_id:'${esc(acc.account_id)}'})">
        <div class="item-info" style="flex:1">
          <div class="item-name">${esc(acc.display_label || acc.username)}</div>
          <div class="item-meta">${esc(acc.account_id)} · ${esc(acc.tier_id)} · ${esc(acc.account_type)} · ${acc.user_count} users</div>
        </div>
        <span class="item-badge ${badge}">${esc(acc.status)}</span>
      </div>`;
    });
    html += `<div style="text-align:center;padding:12px;font-size:11px;color:var(--tm)">${filtered.length} of ${_allAccounts.length} accounts</div>`;
  }
  container.innerHTML = html;
}

function filterAccounts() {
  const container = $('admin-content');
  if (container) renderAccountList(container);
}

// ─── Create Account Modal ───
async function showCreateAccount() {
  // Load stores + departments from API
  let storeOptions = '<option value="">-- ไม่ระบุ --</option>';
  let deptOptions = '<option value="">-- ไม่ระบุ --</option>';
  try {
    const [storesData, deptsData] = await Promise.all([API.getStores(), API.getDepartments()]);
    if (storesData.stores) storesData.stores.forEach(s => {
      storeOptions += `<option value="${esc(s.store_id)}">${esc(s.store_name)} (${esc(s.store_id)})</option>`;
    });
    if (deptsData.departments) deptsData.departments.forEach(d => {
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
async function loadPermissions(container) {
  const data = await API.adminGetPermissions();
  const PERM_OPTIONS = ['no_access', 'view_only', 'edit', 'admin', 'super_admin'];
  
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
      if (editable) {
        let opts = PERM_OPTIONS.map(p => `<option value="${p}" ${p===level?'selected':''}>${p.replace('_',' ')}</option>`).join('');
        bodyHtml += `<td><select class="perm-select perm-${level}" onchange="Screens.setPerm('${esc(m.module_id)}','${esc(t.tier_id)}',this.value)">${opts}</select></td>`;
      } else {
        bodyHtml += `<td><span class="perm-cell perm-${level}">${level.replace('_', ' ')}</span></td>`;
      }
    });
    bodyHtml += '</tr>';
  });

  container.innerHTML = `
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
    loadAdminContent();
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

  let filtered = _allRegs.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!q) return true;
    return (r.display_name || '').toLowerCase().includes(q)
      || (r.username || '').toLowerCase().includes(q)
      || (r.requested_store_id || '').toLowerCase().includes(q);
  });

  let html = `<div class="admin-toolbar">
    <input type="text" class="input-field input-sm" id="reg-search" placeholder="Search..." value="${esc(q)}" oninput="Screens.filterRegs()">
    <select class="input-field input-sm" id="reg-status" onchange="Screens.filterRegs()">
      <option value="all" ${statusFilter==='all'?'selected':''}>All</option>
      <option value="pending" ${statusFilter==='pending'?'selected':''}>Pending</option>
      <option value="approved" ${statusFilter==='approved'?'selected':''}>Approved</option>
      <option value="rejected" ${statusFilter==='rejected'?'selected':''}>Rejected</option>
    </select>
  </div>`;

  if (filtered.length === 0) {
    html += '<div class="empty-state"><div class="empty-text">No requests match</div></div>';
  } else {
    filtered.forEach(r => {
      const badge = r.status === 'pending' ? 'badge-pending' : r.status === 'approved' ? 'badge-approved' : 'badge-rejected';
      html += `
      <div class="list-item" onclick="App.go('reg-review',{request_id:'${esc(r.request_id)}'})">
        <div class="item-info" style="flex:1">
          <div class="item-name">${esc(r.display_name)} (${esc(r.username)})</div>
          <div class="item-meta">${esc(r.requested_store_id || '-')} · ${esc(r.requested_dept_id || '-')} · ${formatShortDate(r.submitted_at)}</div>
        </div>
        <span class="item-badge ${badge}">${esc(r.status)}</span>
      </div>`;
    });
    html += `<div style="text-align:center;padding:12px;font-size:11px;color:var(--tm)">${filtered.length} of ${_allRegs.length} requests</div>`;
  }
  container.innerHTML = html;
}

function filterRegs() {
  const container = $('admin-content');
  if (container) renderRegList(container);
}

// ─── Bridge Tab ───
async function loadBridge(container) {
  const data = await API.adminGetBridgeConfig();

  if (!data.bridges || data.bridges.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-text">No Data Bridges configured</div></div>`;
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
    App.toast(enable ? 'Bridge enabled' : 'Bridge disabled', 'success');
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
      <div class="header-title">Account Detail</div>
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
    const data = await API.adminGetAccounts({ search: accountId, page_size: 50 });
    const acc = data.accounts?.find(a => a.account_id === accountId || a.username === accountId);
    if (!acc) { content.innerHTML = '<div class="empty-state">Account not found</div>'; return; }
    _accountDetail = acc;

    content.innerHTML = `
    <div class="profile-avatar">
      <div class="emoji">${acc.account_type === 'group' ? '👥' : '👤'}</div>
      <div class="name">${esc(acc.display_label)}</div>
      <div class="sub">${esc(acc.username)} · ${esc(acc.account_id)}</div>
    </div>
    <div class="profile-section">
      <div class="profile-row"><span class="label">Type</span><span class="value">${esc(acc.account_type)}</span></div>
      <div class="profile-row"><span class="label">Tier</span><span class="value">${esc(acc.tier_id)}</span></div>
      <div class="profile-row"><span class="label">Status</span><span class="value">${esc(acc.status)}</span></div>
      <div class="profile-row"><span class="label">Store</span><span class="value">${esc(acc.store_id || '-')}</span></div>
      <div class="profile-row"><span class="label">Department</span><span class="value">${esc(acc.dept_id || '-')}</span></div>
      <div class="profile-row"><span class="label">Users</span><span class="value">${acc.user_count}</span></div>
      <div class="profile-row"><span class="label">Last Login</span><span class="value">${formatDate(acc.last_login)}</span></div>
      <div class="profile-row"><span class="label">Created</span><span class="value">${formatDate(acc.created_at)}</span></div>
    </div>
    <div class="profile-section" style="margin-top:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:600;font-size:14px">Users</div>
        ${acc.account_type === 'group' ? \`<button class="btn btn-gold btn-sm" onclick="Screens.showAddUser('\${esc(acc.account_id)}')">+ Add</button>\` : ''}
      </div>
      <div id="acc-users-list"><div style="text-align:center;padding:10px;color:var(--tm);font-size:12px">Loading users...</div></div>
    </div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-outline btn-full" onclick="Screens.showEditAccount('${esc(acc.account_id)}')">Edit Account</button>
      ${acc.status === 'approved' ? `<button class="btn btn-danger btn-full" onclick="Screens.suspendAccount('${esc(acc.account_id)}')">Suspend Account</button>` : ''}
      ${acc.status === 'suspended' ? `<button class="btn btn-gold btn-full" onclick="Screens.reactivateAccount('${esc(acc.account_id)}')">Reactivate Account</button>` : ''}
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
              <button class="btn btn-ghost btn-sm" onclick="Screens.showEditUser(${JSON.stringify(u).replace(/'/g,'\\u0027')})">Edit</button>
            </div>`).join('');
        }
      }
    } catch(e) { console.warn('Load users failed', e); }

  } catch (err) {
    content.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
  }
}

function showEditAccount(accountId) {
  const acc = _accountDetail;
  if (!acc) return;

  const html = `
  <div class="modal-overlay" id="modal-edit-acc" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-close" onclick="document.getElementById('modal-edit-acc').remove()">✕</div>
      <div class="modal-title">Edit Account</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="input-group"><label>Display Label</label><input class="input-field" id="inp-ea-label" value="${esc(acc.display_label || '')}"></div>
        <div class="input-group"><label>Tier</label>
          <select class="input-field" id="inp-ea-tier">
            ${['T1','T2','T3','T4','T5','T6','T7'].map(t => `<option value="${t}" ${acc.tier_id===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="input-group"><label>Store</label><input class="input-field" id="inp-ea-store" value="${esc(acc.store_id || '')}" placeholder="e.g. MNG, BC"></div>
        <div class="input-group"><label>Department</label><input class="input-field" id="inp-ea-dept" value="${esc(acc.dept_id || '')}" placeholder="e.g. dessert, bakery"></div>
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
    loadAccountDetail(accountId);
  } catch (err) {
    showFieldError('ea-error', err.message);
  } finally {
    App.hideLoader();
  }
}

async function suspendAccount(accountId) {
  if (!confirm('Confirm suspend this account?')) return;
  App.showLoader();
  try {
    await API.adminUpdateAccount({ target_account_id: accountId, status: 'suspended' });
    App.toast('Account suspended', 'success');
    loadAccountDetail(accountId);
  } catch (err) { App.toast(err.message, 'error'); }
  finally { App.hideLoader(); }
}

async function reactivateAccount(accountId) {
  App.showLoader();
  try {
    await API.adminUpdateAccount({ target_account_id: accountId, status: 'approved' });
    App.toast('Account reactivated', 'success');
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
      <div class="header-title">Review Request</div>
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
      <button class="btn btn-ghost btn-sm" onclick="Screens.exportAudit()">Export</button>
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
  const data = {
    user_id: userId,
    display_name: $('inp-eu-name')?.value?.trim(),
    full_name: $('inp-eu-full')?.value?.trim(),
    phone: $('inp-eu-phone')?.value?.trim(),
    is_active: $('inp-eu-active')?.value === 'true',
  };
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

// EXTEND Screens OBJECT (Part 2)
// ════════════════════════════════
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
  filterRegs,
  renderRegReview, loadRegReview, reviewReg,
  renderAudit, loadAuditLog, exportAudit
});

})();
