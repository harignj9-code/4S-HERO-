// 4S HERO Admin Portal Controller - Malkajgiri Municipal Corporation
// Real Database-backed Admin operations with Role-Based Access Control

let currentUser = null;
let cachedCircles = [];
let cachedWards = [];

// Initialize Admin Portal on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupEventListeners();
});

// Setup Global Event Listeners
function setupEventListeners() {
  // Login Form
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Toggle Password Visibility
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passInput = document.getElementById('loginPassword');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassBtn.innerHTML = '<i class="fa-regular fa-eye-slash mr-1"></i>Hide';
      } else {
        passInput.type = 'password';
        togglePassBtn.innerHTML = '<i class="fa-regular fa-eye mr-1"></i>Show';
      }
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Mobile Menu Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('adminSidebar');
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
    });
  }

  // Sidebar Tab Navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Circle Modal Form
  document.getElementById('circleForm').addEventListener('submit', handleCircleSubmit);
  // Ward Modal Form
  document.getElementById('wardForm').addEventListener('submit', handleWardSubmit);
  // Area Modal Form
  document.getElementById('areaForm').addEventListener('submit', handleAreaSubmit);
  // Waste Item Modal Form
  document.getElementById('wasteItemForm').addEventListener('submit', handleWasteItemSubmit);
  // Question Modal Form
  document.getElementById('questionForm').addEventListener('submit', handleQuestionSubmit);
  // Logo Modal Form
  document.getElementById('logoForm').addEventListener('submit', handleLogoSubmit);
  // User Modal Form
  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);

  // Role select in User modal
  document.getElementById('userFormRole').addEventListener('change', (e) => {
    const jurisDiv = document.getElementById('jurisdictionFields');
    if (e.target.value === 'CIRCLE_WARD_USER') {
      jurisDiv.classList.remove('hidden');
    } else {
      jurisDiv.classList.add('hidden');
    }
  });

  // Participant Live Search on Enter
  const pSearch = document.getElementById('participantSearchInput');
  if (pSearch) {
    pSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loadParticipants();
    });
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & SESSION
// -------------------------------------------------------------

async function initAuth() {
  try {
    const res = await fetch('/api/admin/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      showAdminPortal();
    } else {
      showLoginView();
    }
  } catch (err) {
    console.error('Auth verification error:', err);
    showLoginView();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const alertBox = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');

  alertBox.className = 'hidden mb-4 p-3 rounded-lg text-sm';
  alertBox.textContent = '';
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alertBox.className = 'mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2';
      alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${data.error || 'Authentication failed'}`;
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> <span>Authenticate & Sign In</span>';
      return;
    }

    currentUser = data.user;
    if (data.token) {
      localStorage.setItem('mmc_admin_token', data.token);
    }

    showAdminPortal();
    showToast(`Welcome back, ${currentUser.full_name}!`, 'success');
  } catch (err) {
    alertBox.className = 'mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium';
    alertBox.textContent = 'Network or server error during authentication.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> <span>Authenticate & Sign In</span>';
  }
}

async function handleLogout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  }
  currentUser = null;
  localStorage.removeItem('mmc_admin_token');
  showLoginView();
  showToast('Logged out securely.', 'info');
}

function showLoginView() {
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('adminPortal').classList.add('hidden');
}

function showAdminPortal() {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('adminPortal').classList.remove('hidden');

  // Update profile header
  document.getElementById('userName').textContent = currentUser.full_name || currentUser.username;
  document.getElementById('userAvatar').textContent = (currentUser.full_name || currentUser.username)[0].toUpperCase();
  document.getElementById('userRoleBadge').textContent = currentUser.role.replace(/_/g, ' ');

  // RBAC Tab Visibility
  applyRoleVisibility();

  // Load circles for dropdowns
  loadCachedCircles();

  // Load Initial Tab (Dashboard)
  switchTab('dashboard');
}

function applyRoleVisibility() {
  const isSuper = currentUser.role === 'SUPER_ADMIN';
  const superSection = document.getElementById('superAdminSection');
  if (superSection) {
    superSection.style.display = isSuper ? 'block' : 'none';
  }

  // Hide write buttons if read-only role
  const isViewer = currentUser.role === 'REPORT_VIEWER';
  if (isViewer) {
    document.querySelectorAll('button[onclick^="open"]').forEach(btn => btn.style.display = 'none');
  }
}

// -------------------------------------------------------------
// TAB NAVIGATION
// -------------------------------------------------------------

function switchTab(tabId) {
  // Update sidebar buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Switch pane
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.add('hidden');
  });

  const activePane = document.getElementById(`tab-${tabId}`);
  if (activePane) {
    activePane.classList.remove('hidden');
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById('adminSidebar');
  if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('hidden')) {
    sidebar.classList.add('hidden');
  }

  // Load Data for Tab
  switch (tabId) {
    case 'dashboard': loadDashboardStats(); break;
    case 'participants': loadParticipants(); break;
    case 'certificates': loadCertificates(); break;
    case 'circles': loadCircles(); break;
    case 'wards': loadWards(); break;
    case 'areas': loadAreas(); break;
    case 'waste': loadWasteItems(); break;
    case 'questions': loadQuestions(); break;
    case 'logos': loadBrandLogos(); break;
    case 'contact': loadContactSettings(); break;
    case 'settings': loadWebsiteSettings(); break;
    case 'users': loadAdminUsers(); break;
    case 'audit': loadAuditLogs(); break;
  }
}

// -------------------------------------------------------------
// TOAST NOTIFICATIONS
// -------------------------------------------------------------

function showToast(message, type = 'success') {
  const toast = document.getElementById('adminToast');
  const msgElem = document.getElementById('toastMessage');
  if (!toast || !msgElem) return;

  toast.className = 'mb-4 p-4 rounded-xl text-xs font-semibold shadow-md flex items-center justify-between transition ';
  if (type === 'success') {
    toast.className += 'bg-emerald-50 border border-emerald-200 text-emerald-800';
    msgElem.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 text-base"></i> ${message}`;
  } else if (type === 'error') {
    toast.className += 'bg-rose-50 border border-rose-200 text-rose-800';
    msgElem.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600 text-base"></i> ${message}`;
  } else {
    toast.className += 'bg-blue-50 border border-blue-200 text-blue-800';
    msgElem.innerHTML = `<i class="fa-solid fa-circle-info text-blue-600 text-base"></i> ${message}`;
  }

  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 5000);
}

// Modal helper
function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('hidden');
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('hidden');
}

// -------------------------------------------------------------
// CACHED CIRCLE & WARD DROPDOWNS
// -------------------------------------------------------------

async function loadCachedCircles() {
  try {
    const res = await fetch('/api/circles/active');
    const data = await res.json();
    cachedCircles = data.circles || [];
    
    // Populate filter dropdowns
    const pCircleSelect = document.getElementById('participantCircleFilter');
    const wCircleSelect = document.getElementById('wardCircleFilter');
    const uCircleSelect = document.getElementById('userFormCircle');
    const modalCircleSelect = document.getElementById('wardCircleSelect');

    const options = cachedCircles.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('');
    
    if (pCircleSelect) pCircleSelect.innerHTML = '<option value="">All Circles</option>' + options;
    if (wCircleSelect) wCircleSelect.innerHTML = '<option value="">All Circles</option>' + options;
    if (uCircleSelect) uCircleSelect.innerHTML = '<option value="">None / All</option>' + options;
    if (modalCircleSelect) modalCircleSelect.innerHTML = options;

  } catch (err) {
    console.error('Failed to load active circles:', err);
  }
}

// -------------------------------------------------------------
// MODULE 1: DASHBOARD
// -------------------------------------------------------------

async function loadDashboardStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return;
    const data = await res.json();

    const { kpis, genderStats, categoryStats, circleStats, recentAttempts } = data;

    // Update KPI numbers
    document.getElementById('kpiTotalParticipants').textContent = (kpis.totalParticipants || 0).toLocaleString();
    document.getElementById('kpiTodayParticipants').textContent = (kpis.todayParticipants || 0).toLocaleString();
    document.getElementById('kpiTotalCompletions').textContent = (kpis.totalCompletions || 0).toLocaleString();
    document.getElementById('kpiTotalCertificates').textContent = (kpis.totalCertificates || 0).toLocaleString();
    document.getElementById('kpiAvgScore').textContent = `${kpis.avgScore || 0} pts`;
    document.getElementById('kpiPassPercentage').textContent = `${kpis.passPercentage || 0}%`;

    // Gender Breakdown Bars
    const totalG = genderStats.reduce((acc, g) => acc + g.cnt, 0) || 1;
    const genderContainer = document.getElementById('genderBreakdownContainer');
    genderContainer.innerHTML = genderStats.map(g => {
      const pct = Math.round((g.cnt / totalG) * 100);
      return `
        <div>
          <div class="flex justify-between text-slate-700 mb-1">
            <span class="font-medium">${g.gender}</span>
            <span class="font-bold">${g.cnt} (${pct}%)</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2">
            <div class="bg-indigo-600 h-2 rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('') || '<div class="text-slate-400">No data yet</div>';

    // Category Breakdown Bars
    const totalC = categoryStats.reduce((acc, c) => acc + c.cnt, 0) || 1;
    const catContainer = document.getElementById('categoryBreakdownContainer');
    catContainer.innerHTML = categoryStats.slice(0, 5).map(c => {
      const pct = Math.round((c.cnt / totalC) * 100);
      return `
        <div>
          <div class="flex justify-between text-slate-700 mb-1">
            <span class="font-medium truncate max-w-[140px]">${c.category}</span>
            <span class="font-bold">${c.cnt} (${pct}%)</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2">
            <div class="bg-emerald-600 h-2 rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('') || '<div class="text-slate-400">No data yet</div>';

    // Circle Breakdown Bars
    const totalCirc = circleStats.reduce((acc, c) => acc + c.count, 0) || 1;
    const circContainer = document.getElementById('circleBreakdownContainer');
    circContainer.innerHTML = circleStats.map(c => {
      const pct = Math.round((c.count / totalCirc) * 100);
      return `
        <div>
          <div class="flex justify-between text-slate-700 mb-1">
            <span class="font-medium truncate max-w-[140px]">${c.name}</span>
            <span class="font-bold">${c.count} (${pct}%)</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2">
            <div class="bg-cyan-600 h-2 rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('') || '<div class="text-slate-400">No data yet</div>';

    // Recent Attempts Table
    const tbody = document.getElementById('recentAttemptsBody');
    if (!recentAttempts || recentAttempts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-slate-400">No attempts logged yet.</td></tr>';
      return;
    }

    tbody.innerHTML = recentAttempts.map(att => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-bold text-slate-900">${att.participant_name}</td>
        <td class="px-4 py-3 text-slate-500">${att.circle_name} / ${att.ward_name}</td>
        <td class="px-4 py-3 font-semibold text-slate-800">${att.score} pts</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${att.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${att.percentage}%
          </span>
        </td>
        <td class="px-4 py-3 font-medium text-slate-700">${att.rank_title}</td>
        <td class="px-4 py-3 text-slate-400 text-[11px]">${att.created_at}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

// -------------------------------------------------------------
// MODULE 2: PARTICIPANTS MASTER
// -------------------------------------------------------------

async function loadParticipants() {
  const search = document.getElementById('participantSearchInput')?.value || '';
  const circleId = document.getElementById('participantCircleFilter')?.value || '';
  const wardId = document.getElementById('participantWardFilter')?.value || '';
  const category = document.getElementById('participantCategoryFilter')?.value || '';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (circleId) params.append('circle_id', circleId);
  if (wardId) params.append('ward_id', wardId);
  if (category) params.append('category', category);

  try {
    const res = await fetch(`/api/admin/participants?${params.toString()}`);
    const data = await res.json();
    const tbody = document.getElementById('participantsTableBody');

    if (!data.participants || data.participants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-slate-400">No participants matching query found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.participants.map(p => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 text-slate-400 font-mono text-[11px]">#${p.id}</td>
        <td class="px-4 py-3 font-bold text-slate-900">${p.name}</td>
        <td class="px-4 py-3 text-slate-600">${p.age || '—'} / ${p.gender}</td>
        <td class="px-4 py-3">
          <span class="font-medium text-slate-800 block">${p.category}</span>
          <span class="text-[11px] text-slate-400">${p.organisation || 'Independent'}</span>
        </td>
        <td class="px-4 py-3 text-slate-600">
          <div class="font-medium">${p.circle_name}</div>
          <div class="text-[11px] text-slate-400">Ward ${p.ward_number}: ${p.ward_name} ${p.area_name ? '• ' + p.area_name : ''}</div>
        </td>
        <td class="px-4 py-3">
          ${p.score !== null ? `
            <div class="font-bold text-slate-800">${p.score} pts (${p.percentage}%)</div>
            <div class="text-[10px] text-mmc-700 font-semibold">${p.rank_title}</div>
          ` : '<span class="text-slate-400 italic">Not played</span>'}
        </td>
        <td class="px-4 py-3">
          ${p.certificate_id ? `
            <a href="/verify/${p.certificate_id}" target="_blank" class="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono text-[10px] rounded inline-flex items-center gap-1 font-bold">
              <i class="fa-solid fa-award"></i> ${p.certificate_id}
            </a>
          ` : '<span class="text-slate-400 text-[11px]">Pending</span>'}
        </td>
        <td class="px-4 py-3 text-slate-400 text-[11px]">${p.created_at}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading participants:', err);
  }
}

// -------------------------------------------------------------
// MODULE 3: CERTIFICATES REGISTRY
// -------------------------------------------------------------

async function loadCertificates() {
  const search = document.getElementById('certificateSearchInput')?.value || '';
  try {
    const res = await fetch(`/api/admin/certificates?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    const tbody = document.getElementById('certificatesTableBody');

    if (!data.certificates || data.certificates.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-slate-400">No certificates matching query found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.certificates.map(c => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-mono font-bold text-mmc-800">${c.certificate_id}</td>
        <td class="px-4 py-3 font-bold text-slate-900">${c.participant_name}</td>
        <td class="px-4 py-3 text-slate-600">${c.organisation || c.category}</td>
        <td class="px-4 py-3 text-slate-600">${c.circle_name} / ${c.ward_name}</td>
        <td class="px-4 py-3 font-bold text-slate-800">${c.score} (${c.percentage}%)</td>
        <td class="px-4 py-3 text-slate-500">${c.issue_date}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${c.status}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-2">
          <a href="/verify/${c.certificate_id}" target="_blank" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1">
            <i class="fa-solid fa-check-to-slot text-emerald-600"></i> Verify
          </a>
          <button onclick="toggleCertificateStatus(${c.id}, '${c.status === 'Active' ? 'Revoked' : 'Active'}')"
                  class="px-2.5 py-1 ${c.status === 'Active' ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'} rounded text-xs font-semibold">
            ${c.status === 'Active' ? 'Revoke' : 'Reinstate'}
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading certificates:', err);
  }
}

async function toggleCertificateStatus(certId, newStatus) {
  if (!confirm(`Are you sure you want to change certificate status to "${newStatus}"?`)) return;
  try {
    const res = await fetch(`/api/admin/certificates/${certId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast(`Certificate status changed to ${newStatus}`, 'success');
      loadCertificates();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to update certificate status', 'error');
    }
  } catch (err) {
    showToast('Network error updating certificate', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 4: CIRCLES MASTER CRUD
// -------------------------------------------------------------

async function loadCircles() {
  try {
    const res = await fetch('/api/admin/circles');
    const data = await res.json();
    const tbody = document.getElementById('circlesTableBody');

    if (!data.circles || data.circles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-slate-400">No circles configured yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.circles.map(c => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-mono font-bold text-slate-800">${c.code}</td>
        <td class="px-4 py-3 font-bold text-slate-900">${c.name}</td>
        <td class="px-4 py-3 font-telugu text-slate-700">${c.name_te || '—'}</td>
        <td class="px-4 py-3 font-semibold text-slate-700">${c.ward_count} wards</td>
        <td class="px-4 py-3 font-semibold text-slate-700">${c.participant_count} citizens</td>
        <td class="px-4 py-3 text-slate-400">${c.display_order}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${c.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-2">
          <button onclick='editCircle(${JSON.stringify(c)})' class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button onclick="toggleCircleActive(${c.id})" class="px-2.5 py-1 ${c.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'} rounded text-xs font-semibold">
            ${c.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading circles:', err);
  }
}

function openCircleModal() {
  document.getElementById('circleModalTitle').textContent = 'Add New Circle';
  document.getElementById('circleId').value = '';
  document.getElementById('circleCode').value = '';
  document.getElementById('circleName').value = '';
  document.getElementById('circleNameTe').value = '';
  document.getElementById('circleOrder').value = '1';
  document.getElementById('circleIsActive').checked = true;
  openModal('circleModal');
}

function editCircle(c) {
  document.getElementById('circleModalTitle').textContent = 'Edit Circle';
  document.getElementById('circleId').value = c.id;
  document.getElementById('circleCode').value = c.code;
  document.getElementById('circleName').value = c.name;
  document.getElementById('circleNameTe').value = c.name_te || '';
  document.getElementById('circleOrder').value = c.display_order || 1;
  document.getElementById('circleIsActive').checked = !!c.is_active;
  openModal('circleModal');
}

async function handleCircleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('circleId').value;
  const payload = {
    code: document.getElementById('circleCode').value,
    name: document.getElementById('circleName').value,
    name_te: document.getElementById('circleNameTe').value,
    display_order: parseInt(document.getElementById('circleOrder').value, 10),
    is_active: document.getElementById('circleIsActive').checked
  };

  const url = id ? `/api/admin/circles/${id}` : '/api/admin/circles';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('circleModal');
      showToast(id ? 'Circle updated successfully' : 'New Circle added successfully');
      loadCircles();
      loadCachedCircles();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save circle', 'error');
    }
  } catch (err) {
    showToast('Network error saving circle', 'error');
  }
}

async function toggleCircleActive(id) {
  if (!confirm('Are you sure you want to toggle this circle status?')) return;
  try {
    await fetch(`/api/admin/circles/${id}`, { method: 'DELETE' });
    showToast('Circle status updated');
    loadCircles();
    loadCachedCircles();
  } catch (err) {
    showToast('Error toggling circle status', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 5: WARDS MASTER CRUD
// -------------------------------------------------------------

async function loadWards() {
  const circleId = document.getElementById('wardCircleFilter')?.value || '';
  const url = circleId ? `/api/admin/wards?circle_id=${circleId}` : '/api/admin/wards';

  try {
    const res = await fetch(url);
    const data = await res.json();
    cachedWards = data.wards || [];
    const tbody = document.getElementById('wardsTableBody');

    // Also update area ward filter
    const areaWardFilter = document.getElementById('areaWardFilter');
    const areaWardSelect = document.getElementById('areaWardSelect');
    const wardOpts = cachedWards.map(w => `<option value="${w.id}">Ward ${w.ward_number} - ${w.name}</option>`).join('');
    if (areaWardFilter) areaWardFilter.innerHTML = '<option value="">All Wards</option>' + wardOpts;
    if (areaWardSelect) areaWardSelect.innerHTML = wardOpts;

    if (!data.wards || data.wards.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-slate-400">No wards configured yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.wards.map(w => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-mono font-bold text-slate-900">Ward ${w.ward_number}</td>
        <td class="px-4 py-3 font-bold text-slate-900">${w.name}</td>
        <td class="px-4 py-3 font-telugu text-slate-700">${w.name_te || '—'}</td>
        <td class="px-4 py-3 text-slate-600 font-medium">${w.circle_name}</td>
        <td class="px-4 py-3 text-slate-600">${w.area_count} areas</td>
        <td class="px-4 py-3 text-slate-600">${w.participant_count} citizens</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${w.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${w.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-2">
          <button onclick='editWard(${JSON.stringify(w)})' class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
            <i class="fa-solid fa-pen-to-square"></i> Edit / Move
          </button>
          <button onclick="toggleWardActive(${w.id})" class="px-2.5 py-1 ${w.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'} rounded text-xs font-semibold">
            ${w.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading wards:', err);
  }
}

function openWardModal() {
  document.getElementById('wardModalTitle').textContent = 'Add New Ward';
  document.getElementById('wardId').value = '';
  document.getElementById('wardNumber').value = '';
  document.getElementById('wardName').value = '';
  document.getElementById('wardNameTe').value = '';
  document.getElementById('wardOrder').value = '1';
  document.getElementById('wardIsActive').checked = true;
  openModal('wardModal');
}

function editWard(w) {
  document.getElementById('wardModalTitle').textContent = 'Edit / Move Ward';
  document.getElementById('wardId').value = w.id;
  document.getElementById('wardCircleSelect').value = w.circle_id;
  document.getElementById('wardNumber').value = w.ward_number;
  document.getElementById('wardName').value = w.name;
  document.getElementById('wardNameTe').value = w.name_te || '';
  document.getElementById('wardOrder').value = w.display_order || 1;
  document.getElementById('wardIsActive').checked = !!w.is_active;
  openModal('wardModal');
}

async function handleWardSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('wardId').value;
  const payload = {
    circle_id: parseInt(document.getElementById('wardCircleSelect').value, 10),
    ward_number: document.getElementById('wardNumber').value,
    name: document.getElementById('wardName').value,
    name_te: document.getElementById('wardNameTe').value,
    display_order: parseInt(document.getElementById('wardOrder').value, 10),
    is_active: document.getElementById('wardIsActive').checked
  };

  const url = id ? `/api/admin/wards/${id}` : '/api/admin/wards';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('wardModal');
      showToast(id ? 'Ward updated / moved successfully' : 'New Ward added successfully');
      loadWards();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save ward', 'error');
    }
  } catch (err) {
    showToast('Network error saving ward', 'error');
  }
}

async function toggleWardActive(id) {
  if (!confirm('Are you sure you want to toggle this ward status?')) return;
  try {
    await fetch(`/api/admin/wards/${id}`, { method: 'DELETE' });
    showToast('Ward status updated');
    loadWards();
  } catch (err) {
    showToast('Error toggling ward status', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 6: AREAS MASTER CRUD
// -------------------------------------------------------------

async function loadAreas() {
  const wardId = document.getElementById('areaWardFilter')?.value || '';
  const url = wardId ? `/api/admin/areas?ward_id=${wardId}` : '/api/admin/areas';

  try {
    const res = await fetch(url);
    const data = await res.json();
    const tbody = document.getElementById('areasTableBody');

    if (!data.areas || data.areas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-slate-400">No areas found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.areas.map(a => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-bold text-slate-900">${a.name}</td>
        <td class="px-4 py-3 font-telugu text-slate-700">${a.name_te || '—'}</td>
        <td class="px-4 py-3 font-mono text-slate-600">${a.pincode || '500047'}</td>
        <td class="px-4 py-3 font-medium text-slate-800">Ward ${a.ward_number}: ${a.ward_name}</td>
        <td class="px-4 py-3 text-slate-600">${a.circle_name}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${a.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-2">
          <button onclick='editArea(${JSON.stringify(a)})' class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button onclick="toggleAreaActive(${a.id})" class="px-2.5 py-1 ${a.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'} rounded text-xs font-semibold">
            ${a.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading areas:', err);
  }
}

function openAreaModal() {
  document.getElementById('areaModalTitle').textContent = 'Add New Area / Locality';
  document.getElementById('areaId').value = '';
  document.getElementById('areaName').value = '';
  document.getElementById('areaNameTe').value = '';
  document.getElementById('areaPincode').value = '500047';
  document.getElementById('areaIsActive').checked = true;
  openModal('areaModal');
}

function editArea(a) {
  document.getElementById('areaModalTitle').textContent = 'Edit Area / Locality';
  document.getElementById('areaId').value = a.id;
  document.getElementById('areaWardSelect').value = a.ward_id;
  document.getElementById('areaName').value = a.name;
  document.getElementById('areaNameTe').value = a.name_te || '';
  document.getElementById('areaPincode').value = a.pincode || '500047';
  document.getElementById('areaIsActive').checked = !!a.is_active;
  openModal('areaModal');
}

async function handleAreaSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('areaId').value;
  const payload = {
    ward_id: parseInt(document.getElementById('areaWardSelect').value, 10),
    name: document.getElementById('areaName').value,
    name_te: document.getElementById('areaNameTe').value,
    pincode: document.getElementById('areaPincode').value,
    is_active: document.getElementById('areaIsActive').checked
  };

  const url = id ? `/api/admin/areas/${id}` : '/api/admin/areas';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('areaModal');
      showToast(id ? 'Area updated successfully' : 'New Area added successfully');
      loadAreas();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save area', 'error');
    }
  } catch (err) {
    showToast('Network error saving area', 'error');
  }
}

async function toggleAreaActive(id) {
  if (!confirm('Are you sure you want to toggle this area status?')) return;
  try {
    await fetch(`/api/admin/areas/${id}`, { method: 'DELETE' });
    showToast('Area status updated');
    loadAreas();
  } catch (err) {
    showToast('Error toggling area status', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 7: WASTE MASTER CRUD
// -------------------------------------------------------------

async function loadWasteItems() {
  try {
    const res = await fetch('/api/admin/waste-items');
    const data = await res.json();
    const tbody = document.getElementById('wasteItemsTableBody');

    if (!data.items || data.items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-slate-400">No waste items found.</td></tr>';
      return;
    }

    const streamBadges = {
      'WET': '<span class="px-2 py-0.5 rounded font-bold text-[10px] badge-wet">🟢 Wet Waste (Green)</span>',
      'DRY': '<span class="px-2 py-0.5 rounded font-bold text-[10px] badge-dry">🔵 Dry Waste (Blue)</span>',
      'SANITARY': '<span class="px-2 py-0.5 rounded font-bold text-[10px] badge-sanitary">🔴 Sanitary Waste (Red)</span>',
      'SPECIAL': '<span class="px-2 py-0.5 rounded font-bold text-[10px] badge-special">⚫ Special Care (Black)</span>'
    };

    tbody.innerHTML = data.items.map(it => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 text-center">
          <i class="fa-solid ${it.image_icon || 'fa-trash'} text-lg text-slate-600"></i>
        </td>
        <td class="px-4 py-3 font-bold text-slate-900">${it.name}</td>
        <td class="px-4 py-3 font-telugu text-slate-700">${it.name_te || '—'}</td>
        <td class="px-4 py-3">${streamBadges[it.stream_code] || it.stream_code}</td>
        <td class="px-4 py-3 text-slate-600 max-w-xs truncate" title="${it.explanation}">${it.explanation}</td>
        <td class="px-4 py-3 text-slate-500">${it.difficulty}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${it.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${it.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-2">
          <button onclick='editWasteItem(${JSON.stringify(it)})' class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button onclick="toggleWasteItem(${it.id})" class="px-2.5 py-1 ${it.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'} rounded text-xs font-semibold">
            ${it.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading waste items:', err);
  }
}

function openWasteItemModal() {
  document.getElementById('wasteModalTitle').textContent = 'Add Waste Item';
  document.getElementById('wasteItemId').value = '';
  document.getElementById('wasteItemStreamSelect').value = '1';
  document.getElementById('wasteItemName').value = '';
  document.getElementById('wasteItemNameTe').value = '';
  document.getElementById('wasteItemCategory').value = 'General';
  document.getElementById('wasteItemIcon').value = 'fa-trash';
  document.getElementById('wasteItemExplanation').value = '';
  document.getElementById('wasteItemExplanationTe').value = '';
  document.getElementById('wasteItemDifficulty').value = 'Medium';
  document.getElementById('wasteItemIsActive').checked = true;
  openModal('wasteItemModal');
}

function editWasteItem(it) {
  document.getElementById('wasteModalTitle').textContent = 'Edit Waste Item';
  document.getElementById('wasteItemId').value = it.id;
  document.getElementById('wasteItemStreamSelect').value = it.stream_id;
  document.getElementById('wasteItemName').value = it.name;
  document.getElementById('wasteItemNameTe').value = it.name_te || '';
  document.getElementById('wasteItemCategory').value = it.category || 'General';
  document.getElementById('wasteItemIcon').value = it.image_icon || 'fa-trash';
  document.getElementById('wasteItemExplanation').value = it.explanation || '';
  document.getElementById('wasteItemExplanationTe').value = it.explanation_te || '';
  document.getElementById('wasteItemDifficulty').value = it.difficulty || 'Medium';
  document.getElementById('wasteItemIsActive').checked = !!it.is_active;
  openModal('wasteItemModal');
}

async function handleWasteItemSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('wasteItemId').value;
  const payload = {
    stream_id: parseInt(document.getElementById('wasteItemStreamSelect').value, 10),
    name: document.getElementById('wasteItemName').value,
    name_te: document.getElementById('wasteItemNameTe').value,
    category: document.getElementById('wasteItemCategory').value,
    image_icon: document.getElementById('wasteItemIcon').value,
    explanation: document.getElementById('wasteItemExplanation').value,
    explanation_te: document.getElementById('wasteItemExplanationTe').value,
    difficulty: document.getElementById('wasteItemDifficulty').value,
    is_active: document.getElementById('wasteItemIsActive').checked
  };

  const url = id ? `/api/admin/waste-items/${id}` : '/api/admin/waste-items';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('wasteItemModal');
      showToast(id ? 'Waste item updated' : 'Waste item added');
      loadWasteItems();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save waste item', 'error');
    }
  } catch (err) {
    showToast('Network error saving waste item', 'error');
  }
}

async function toggleWasteItem(id) {
  try {
    await fetch(`/api/admin/waste-items/${id}`, { method: 'DELETE' });
    showToast('Waste item status updated');
    loadWasteItems();
  } catch (err) {
    showToast('Error updating waste item', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 8: QUESTIONS MASTER CRUD
// -------------------------------------------------------------

async function loadQuestions() {
  try {
    const res = await fetch('/api/admin/questions');
    const data = await res.json();
    const tbody = document.getElementById('questionsTableBody');

    if (!data.questions || data.questions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-slate-400">No questions found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.questions.map(q => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-bold text-mmc-800">Level ${q.level_number}</td>
        <td class="px-4 py-3 font-semibold text-slate-900 max-w-sm">${q.question_text}</td>
        <td class="px-4 py-3 text-slate-500 text-[11px]">${(q.options || []).join(' • ')}</td>
        <td class="px-4 py-3 font-bold text-emerald-700">${q.correct_answer}</td>
        <td class="px-4 py-3 text-slate-500 max-w-xs truncate" title="${q.explanation}">${q.explanation}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${q.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${q.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-2">
          <button onclick='editQuestion(${JSON.stringify(q)})' class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button onclick="toggleQuestion(${q.id})" class="px-2.5 py-1 ${q.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'} rounded text-xs font-semibold">
            ${q.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading questions:', err);
  }
}

function openQuestionModal() {
  document.getElementById('questionModalTitle').textContent = 'Add Question';
  document.getElementById('questionId').value = '';
  document.getElementById('questionLevelNumber').value = '7';
  document.getElementById('questionDifficulty').value = 'Medium';
  document.getElementById('questionText').value = '';
  document.getElementById('questionTextTe').value = '';
  document.getElementById('questionOptions').value = '';
  document.getElementById('questionCorrectAnswer').value = '';
  document.getElementById('questionExplanation').value = '';
  document.getElementById('questionIsActive').checked = true;
  openModal('questionModal');
}

function editQuestion(q) {
  document.getElementById('questionModalTitle').textContent = 'Edit Question';
  document.getElementById('questionId').value = q.id;
  document.getElementById('questionLevelNumber').value = q.level_number;
  document.getElementById('questionDifficulty').value = q.difficulty || 'Medium';
  document.getElementById('questionText').value = q.question_text;
  document.getElementById('questionTextTe').value = q.question_text_te || '';
  document.getElementById('questionOptions').value = (q.options || []).join(', ');
  document.getElementById('questionCorrectAnswer').value = q.correct_answer;
  document.getElementById('questionExplanation').value = q.explanation || '';
  document.getElementById('questionIsActive').checked = !!q.is_active;
  openModal('questionModal');
}

async function handleQuestionSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('questionId').value;
  const rawOpts = document.getElementById('questionOptions').value;
  const options = rawOpts.split(',').map(o => o.trim()).filter(Boolean);

  const payload = {
    level_number: parseInt(document.getElementById('questionLevelNumber').value, 10),
    difficulty: document.getElementById('questionDifficulty').value,
    question_text: document.getElementById('questionText').value,
    question_text_te: document.getElementById('questionTextTe').value,
    options,
    correct_answer: document.getElementById('questionCorrectAnswer').value,
    explanation: document.getElementById('questionExplanation').value,
    is_active: document.getElementById('questionIsActive').checked
  };

  const url = id ? `/api/admin/questions/${id}` : '/api/admin/questions';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('questionModal');
      showToast(id ? 'Question updated' : 'Question added');
      loadQuestions();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save question', 'error');
    }
  } catch (err) {
    showToast('Network error saving question', 'error');
  }
}

async function toggleQuestion(id) {
  try {
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    showToast('Question status updated');
    loadQuestions();
  } catch (err) {
    showToast('Error updating question', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 9: BRAND ASSET MANAGER
// -------------------------------------------------------------

async function loadBrandLogos() {
  try {
    const res = await fetch('/api/admin/logos');
    const data = await res.json();
    const container = document.getElementById('logosContainer');

    if (!data.logos || data.logos.length === 0) {
      container.innerHTML = '<div class="col-span-3 text-slate-400 text-xs">No brand assets configured yet.</div>';
      return;
    }

    container.innerHTML = data.logos.map(l => `
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div>
          <!-- Image Display preserving original aspect ratio -->
          <div class="h-36 bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center justify-center mb-3 overflow-hidden">
            <img src="${l.file_path}" alt="${l.name}" class="max-h-full max-w-full object-contain">
          </div>
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-900 truncate">${l.name}</h4>
            <span class="px-2 py-0.5 rounded font-bold text-[10px] ${l.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
              ${l.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-1">
            <span class="font-medium text-slate-700">Placement:</span> ${l.placement}
          </div>
          <div class="text-[10px] font-mono text-slate-400 mt-0.5 truncate">${l.file_path}</div>
        </div>

        <div class="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[10px] text-slate-400">Order: ${l.display_order}</span>
          <div class="space-x-1">
            <button onclick='editLogo(${JSON.stringify(l)})' class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button onclick="deleteLogo(${l.id})" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loading brand assets:', err);
  }
}

function openLogoModal() {
  document.getElementById('logoModalTitle').textContent = 'Upload / Add Official Brand Asset';
  document.getElementById('logoId').value = '';
  document.getElementById('logoName').value = '';
  document.getElementById('logoPlacement').value = 'Header';
  document.getElementById('logoFilePath').value = '';
  document.getElementById('logoFileInput').value = '';
  document.getElementById('logoAspectRatio').value = 'auto';
  document.getElementById('logoOrder').value = '1';
  document.getElementById('logoIsActive').checked = true;
  openModal('logoModal');
}

function editLogo(l) {
  document.getElementById('logoModalTitle').textContent = 'Edit Brand Asset';
  document.getElementById('logoId').value = l.id;
  document.getElementById('logoName').value = l.name;
  document.getElementById('logoPlacement').value = l.placement;
  document.getElementById('logoFilePath').value = l.file_path;
  document.getElementById('logoFileInput').value = '';
  document.getElementById('logoAspectRatio').value = l.aspect_ratio || 'auto';
  document.getElementById('logoOrder').value = l.display_order || 1;
  document.getElementById('logoIsActive').checked = !!l.is_active;
  openModal('logoModal');
}

async function handleLogoSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('logoId').value;
  const fileInput = document.getElementById('logoFileInput');
  let base64_data = null;

  if (fileInput.files.length > 0) {
    base64_data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(fileInput.files[0]);
    });
  }

  const payload = {
    name: document.getElementById('logoName').value,
    placement: document.getElementById('logoPlacement').value,
    file_path: document.getElementById('logoFilePath').value,
    aspect_ratio: document.getElementById('logoAspectRatio').value,
    display_order: parseInt(document.getElementById('logoOrder').value, 10),
    is_active: document.getElementById('logoIsActive').checked,
    base64_data
  };

  const url = id ? `/api/admin/logos/${id}` : '/api/admin/logos';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('logoModal');
      showToast('Brand asset saved successfully');
      loadBrandLogos();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save logo', 'error');
    }
  } catch (err) {
    showToast('Network error saving logo', 'error');
  }
}

async function deleteLogo(id) {
  if (!confirm('Are you sure you want to delete this brand logo?')) return;
  try {
    await fetch(`/api/admin/logos/${id}`, { method: 'DELETE' });
    showToast('Brand asset deleted');
    loadBrandLogos();
  } catch (err) {
    showToast('Error deleting brand asset', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 10: CONTACT & SOCIAL CMS
// -------------------------------------------------------------

let currentContactList = [];

async function loadContactSettings() {
  try {
    const res = await fetch('/api/admin/contact-settings');
    const data = await res.json();
    currentContactList = data.contacts || [];
    const container = document.getElementById('contactSettingsForm');

    container.innerHTML = currentContactList.map((c, idx) => `
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-solid ${c.icon || 'fa-phone'} text-mmc-700"></i>
            <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">${c.setting_key.replace(/_/g, ' ')}</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-semibold">${c.category}</span>
          </div>
          <label class="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" id="contactActive_${idx}" ${c.is_active ? 'checked' : ''} class="rounded text-mmc-600"> Active
          </label>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Value (English)</label>
            <input type="text" id="contactVal_${idx}" value="${c.value || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-mmc-600 focus:outline-none">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Value (Telugu)</label>
            <input type="text" id="contactValTe_${idx}" value="${c.value_te || ''}" class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-telugu focus:ring-2 focus:ring-mmc-600 focus:outline-none">
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loading contact settings:', err);
  }
}

async function saveContactSettings() {
  const updatedItems = currentContactList.map((c, idx) => ({
    setting_key: c.setting_key,
    value: document.getElementById(`contactVal_${idx}`).value,
    value_te: document.getElementById(`contactValTe_${idx}`).value,
    is_active: document.getElementById(`contactActive_${idx}`).checked,
    label: c.label,
    label_te: c.label_te,
    icon: c.icon
  }));

  try {
    const res = await fetch('/api/admin/contact-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updatedItems })
    });
    if (res.ok) {
      showToast('Contact details and social links updated successfully!');
      loadContactSettings();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to update contact settings', 'error');
    }
  } catch (err) {
    showToast('Network error saving contact details', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 11: PORTAL & QUALIFICATION SETTINGS
// -------------------------------------------------------------

async function loadWebsiteSettings() {
  try {
    const res = await fetch('/api/admin/website-settings');
    const data = await res.json();
    const map = {};
    (data.settings || []).forEach(s => { map[s.setting_key] = s.setting_value; });

    if (map['qualifying_score_percent']) {
      document.getElementById('settingQualifyingScore').value = map['qualifying_score_percent'];
    }
    if (map['commissioner_name']) {
      document.getElementById('settingCommissionerName').value = map['commissioner_name'];
    }
    if (map['commissioner_title']) {
      document.getElementById('settingCommissionerTitle').value = map['commissioner_title'];
    }
    if (map['campaign_tagline']) {
      document.getElementById('settingCampaignTagline').value = map['campaign_tagline'];
    }

    // Signature Preview
    const sigPath = map['signature_asset'];
    const previewImg = document.getElementById('sigPreviewImg');
    const emptyNote = document.getElementById('sigEmptyNote');

    if (sigPath && sigPath.trim() !== '') {
      previewImg.src = sigPath;
      previewImg.classList.remove('hidden');
      emptyNote.classList.add('hidden');
    } else {
      previewImg.classList.add('hidden');
      emptyNote.classList.remove('hidden');
    }

  } catch (err) {
    console.error('Error loading website settings:', err);
  }
}

async function saveWebsiteSettings() {
  const settings = {
    qualifying_score_percent: document.getElementById('settingQualifyingScore').value,
    commissioner_name: document.getElementById('settingCommissionerName').value,
    commissioner_title: document.getElementById('settingCommissionerTitle').value,
    campaign_tagline: document.getElementById('settingCampaignTagline').value
  };

  const sigFile = document.getElementById('sigFileInput');
  let signature_base64 = null;

  if (sigFile.files.length > 0) {
    signature_base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(sigFile.files[0]);
    });
  }

  try {
    const res = await fetch('/api/admin/website-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, signature_base64 })
    });
    if (res.ok) {
      showToast('Portal and Qualification settings saved successfully!');
      loadWebsiteSettings();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save settings', 'error');
    }
  } catch (err) {
    showToast('Network error saving settings', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 12: ADMIN USERS (RBAC)
// -------------------------------------------------------------

async function loadAdminUsers() {
  try {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    const tbody = document.getElementById('usersTableBody');

    if (!data.users || data.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-slate-400">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.users.map(u => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-mono font-bold text-slate-900">${u.username}</td>
        <td class="px-4 py-3 font-bold text-slate-900">${u.full_name}</td>
        <td class="px-4 py-3 text-slate-500">${u.email || '—'}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
            ${u.role.replace(/_/g, ' ')}
          </span>
        </td>
        <td class="px-4 py-3 text-slate-600">${u.circle_name ? `${u.circle_name} / ${u.ward_name || 'All Wards'}` : 'All Circles (Full)'}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${u.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-3 text-slate-400 text-[11px]">${u.created_at}</td>
        <td class="px-4 py-3 text-right space-x-2">
          <button onclick='editAdminUser(${JSON.stringify(u)})' class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading admin users:', err);
  }
}

function openUserModal() {
  document.getElementById('userModalTitle').textContent = 'Create Admin User';
  document.getElementById('adminUserId').value = '';
  document.getElementById('userFormUsername').value = '';
  document.getElementById('userFormUsername').disabled = false;
  document.getElementById('userFormFullName').value = '';
  document.getElementById('userFormEmail').value = '';
  document.getElementById('userFormPassword').value = '';
  document.getElementById('userPasswordLabel').textContent = 'Password *';
  document.getElementById('userFormRole').value = 'CONTENT_ADMIN';
  document.getElementById('jurisdictionFields').classList.add('hidden');
  document.getElementById('userFormIsActive').checked = true;
  openModal('userModal');
}

function editAdminUser(u) {
  document.getElementById('userModalTitle').textContent = 'Edit Admin User';
  document.getElementById('adminUserId').value = u.id;
  document.getElementById('userFormUsername').value = u.username;
  document.getElementById('userFormUsername').disabled = true;
  document.getElementById('userFormFullName').value = u.full_name;
  document.getElementById('userFormEmail').value = u.email || '';
  document.getElementById('userFormPassword').value = '';
  document.getElementById('userPasswordLabel').textContent = 'Reset Password (Leave blank to keep current)';
  document.getElementById('userFormRole').value = u.role;

  if (u.role === 'CIRCLE_WARD_USER') {
    document.getElementById('jurisdictionFields').classList.remove('hidden');
    document.getElementById('userFormCircle').value = u.circle_id || '';
    document.getElementById('userFormWard').value = u.ward_id || '';
  } else {
    document.getElementById('jurisdictionFields').classList.add('hidden');
  }

  document.getElementById('userFormIsActive').checked = !!u.is_active;
  openModal('userModal');
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('adminUserId').value;
  const payload = {
    username: document.getElementById('userFormUsername').value,
    full_name: document.getElementById('userFormFullName').value,
    email: document.getElementById('userFormEmail').value,
    role: document.getElementById('userFormRole').value,
    circle_id: document.getElementById('userFormCircle').value || null,
    ward_id: document.getElementById('userFormWard').value || null,
    is_active: document.getElementById('userFormIsActive').checked
  };

  const password = document.getElementById('userFormPassword').value;
  if (!id && !password) {
    showToast('Password is required for new user', 'error');
    return;
  }
  if (!id) payload.password = password;
  if (id && password) payload.new_password = password;

  const url = id ? `/api/admin/users/${id}` : '/api/admin/users';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('userModal');
      showToast(id ? 'Admin user updated' : 'Admin user created');
      loadAdminUsers();
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save admin user', 'error');
    }
  } catch (err) {
    showToast('Network error saving user', 'error');
  }
}

// -------------------------------------------------------------
// MODULE 13: AUDIT LOGS
// -------------------------------------------------------------

async function loadAuditLogs() {
  try {
    const res = await fetch('/api/admin/audit-logs');
    const data = await res.json();
    const tbody = document.getElementById('auditLogsTableBody');

    if (!data.logs || data.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-slate-400">No audit logs recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.logs.map(l => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-mono text-[11px] text-slate-400">${l.created_at}</td>
        <td class="px-4 py-3 font-bold text-slate-800">${l.username || 'System'}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold ${l.action.includes('FAILED') ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}">
            ${l.action}
          </span>
        </td>
        <td class="px-4 py-3 text-slate-600 font-medium">${l.entity_name || '—'}</td>
        <td class="px-4 py-3 font-mono text-slate-500">${l.entity_id || '—'}</td>
        <td class="px-4 py-3 font-mono text-slate-400 text-[11px]">${l.ip_address || '—'}</td>
        <td class="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate" title="${l.details_json || ''}">${l.details_json || '—'}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading audit logs:', err);
  }
}
