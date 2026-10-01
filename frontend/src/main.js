import { createIcons, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleAlert, Clock3, LayoutDashboard, Library, LogOut, Menu, MoreHorizontal, Plus, Search, Trash2, UserRound, UsersRound, X } from 'lucide';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const state = {
  page: 'dashboard', books: [], customers: [], borrowed: [], accounting: [], totalIncome: 0, bookResults: null, customerResults: null, borrowingResults: null, searchVersion: { books: 0, customers: 0, borrowing: 0 }, loading: true,
  error: '', notice: '', bookQuery: '', customerQuery: '', borrowingQuery: '', mobileNav: false,
  authenticated: Boolean(localStorage.getItem('library_access_token')),
  authLoading: false, authError: '', refreshPromise: null,
  returnToBorrow: false, borrowCustomerId: '',
};

const icons = { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleAlert, Clock3, LayoutDashboard, Library, LogOut, Menu, MoreHorizontal, Plus, Search, Trash2, UserRound, UsersRound, X };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&#38;', '<': '&#60;', '>': '&#62;', "'": '&#39;', '"': '&#34;' }[character]));
const formatDate = (value) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—';
const formatTime = (value) => value ? new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '';

function authTokens() {
  return {
    accessToken: localStorage.getItem('library_access_token'),
    refreshToken: localStorage.getItem('library_refresh_token'),
  };
}

function currentUser() {
  return tokenPayload()?.username || '';
}

function tokenPayload() {
  const { accessToken } = authTokens();
  if (!accessToken) return '';
  try {
    const encodedPayload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(encodedPayload.padEnd(encodedPayload.length + ((4 - encodedPayload.length % 4) % 4), '=')));
  } catch {
    return '';
  }
}

function currentRole() {
  return String(tokenPayload()?.role || '').toLowerCase();
}

function isLibrarian() {
  return ['librarian', 'admin'].includes(currentRole());
}

function isAdmin() {
  return currentRole() === 'admin';
}

function canVisitPage(page) {
  return ['dashboard', 'books'].includes(page) || (isLibrarian() && ['customers', 'borrowing'].includes(page)) || (isAdmin() && page === 'accounting');
}

function permissionMessage() {
  return 'Your account does not have permission to do that.';
}

function userInitials(username) {
  return username.split(/[._\s-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U';
}

function clearAuth(message = '') {
  localStorage.removeItem('library_access_token');
  localStorage.removeItem('library_refresh_token');
  state.authenticated = false;
  state.authLoading = false;
  state.authError = message;
  state.loading = false;
  state.error = '';
  state.notice = '';
  render();
}

async function refreshAccessToken() {
  if (state.refreshPromise) return state.refreshPromise;
  const { refreshToken } = authTokens();
  if (!refreshToken) throw new Error('Your session has expired. Please sign in again.');
  state.refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) throw new Error('Your session has expired. Please sign in again.');
    const data = await response.json();
    localStorage.setItem('library_access_token', data.access_token);
    state.authenticated = true;
    return data.access_token;
  })().finally(() => { state.refreshPromise = null; });
  return state.refreshPromise;
}

async function api(path, options = {}, retry = true) {
  const { skipAuth = false, ...requestOptions } = options;
  const headers = { ...(requestOptions.body instanceof URLSearchParams ? {} : { 'Content-Type': 'application/json' }), ...(requestOptions.headers || {}) };
  if (!skipAuth && authTokens().accessToken) headers.Authorization = `Bearer ${authTokens().accessToken}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, headers });
  if (response.status === 401 && !skipAuth && retry) {
    try { await refreshAccessToken(); return api(path, options, false); }
    catch { clearAuth('Your session has expired. Please sign in again.'); throw new Error('Your session has expired. Please sign in again.'); }
  }
  if (response.status === 401 && !skipAuth) {
    clearAuth('Your session has expired. Please sign in again.');
    throw new Error('Your session has expired. Please sign in again.');
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try { detail = (await response.json()).detail || detail; } catch { /* response may not be JSON */ }
    if (response.status === 403) detail = permissionMessage();
    throw new Error(detail);
  }
  return response.status === 204 ? null : response.json();
}

async function loadData() {
  if (!state.authenticated) { state.loading = false; render(); return; }
  if (!['user', 'librarian', 'admin'].includes(currentRole())) {
    clearAuth('Your access token does not contain a recognized user role. Please sign in again.');
    return;
  }
  state.loading = true; state.error = ''; render();
  try {
    const requests = { books: api('/books') };
    if (isLibrarian()) {
      requests.customers = api('/customer');
      requests.borrowed = api('/borrowed');
    }
    if (isAdmin()) {
      requests.accounting = api('/accounting');
      requests.totalIncome = api('/accounting/total');
    }
    const requestEntries = Object.entries(requests);
    const settled = await Promise.allSettled(requestEntries.map(([, request]) => request));
    const results = Object.fromEntries(requestEntries.map(([key], index) => [key, settled[index]]));
    if (results.books.status === 'rejected') throw results.books.reason;
    state.books = results.books.value || [];
    state.bookResults = null;
    state.customers = results.customers?.status === 'fulfilled' ? results.customers.value || [] : [];
    state.borrowed = results.borrowed?.status === 'fulfilled' ? results.borrowed.value || [] : [];
    state.accounting = results.accounting?.status === 'fulfilled' ? results.accounting.value || [] : [];
    state.totalIncome = results.totalIncome?.status === 'fulfilled' ? Number(results.totalIncome.value?.total_income || 0) : 0;
    const denied = Object.values(results).find((result) => result.status === 'rejected');
    if (denied) state.error = denied.reason.message;
  } catch (error) { if (!state.authenticated) state.authError = error.message; else state.error = error.message; } finally { state.loading = false; render(); }
}

function notify(message, isError = false) {
  state.notice = isError ? '' : message; state.error = isError && state.authenticated ? message : ''; if (isError && !state.authenticated) state.authError = message; render();
  window.setTimeout(() => { if (state.notice === message) { state.notice = ''; render(); } }, 3200);
}

function getBorrowingRows(records = state.borrowed) {
  return records.map((record) => ({
    ...record,
    customerName: record.customer || record.customer_name || record.name || state.customers.find((customer) => customer.id === record.customer_id)?.name || `Customer #${record.customer_id ?? '—'}`,
    bookTitle: record.book || record.title || record.book_title || state.books.find((book) => book.id === record.book_id)?.title || `Book #${record.book_id ?? '—'}`,
    id: record.id || state.borrowed.find((item) => item.customer === record.customer && item.book === record.book && item.borrowed_at === record.borrowed_at)?.id,
  }));
}

function navItem(page, label, icon, count = '') { return `<button class="nav-item ${state.page === page ? 'active' : ''}" data-page="${page}"><i data-lucide="${icon}"></i><span>${label}</span>${count ? `<b>${count}</b>` : ''}</button>`; }
function pageTitle() { return { dashboard: 'Overview', books: 'Books', customers: 'Customers', borrowing: 'Borrowing', accounting: 'Accounting' }[state.page]; }

function loginPage() {
  return `<main class="auth-page"><div class="auth-orbit orbit-one"></div><div class="auth-orbit orbit-two"></div><section class="auth-card"><div class="auth-brand"><span class="brand-mark"><i data-lucide="library"></i></span><span>Circulation<br><em>Desk</em></span></div><p class="eyebrow">Library workspace</p><h1>Welcome back</h1><p class="auth-description">Sign in to manage your collection, members, and circulation.</p>${state.authError ? `<div class="auth-error"><i data-lucide="circle-alert"></i>${escapeHtml(state.authError)}</div>` : ''}<form data-form="login" class="login-form"><label>Username<input name="username" autocomplete="username" required autofocus placeholder="Enter your username" /></label><label>Password<input type="password" name="password" autocomplete="current-password" required placeholder="Enter your password" /></label><button class="primary-btn full-width" type="submit" ${state.authLoading ? 'disabled' : ''}>${state.authLoading ? '<span class="button-spinner"></span>Signing in...' : '<i data-lucide="arrow-right"></i>Sign in'}</button></form><small class="auth-footer">Your session is secured by the Library API.</small></section></main>`;
}

function renderShell(content) {
  const username = currentUser();
  const protectedNav = `${isLibrarian() ? `${navItem('customers', 'Customers', 'users-round', state.customers.length)}${navItem('borrowing', 'Borrowing', 'clock-3', getBorrowingRows().filter((row) => !row.returned_at).length)}` : ''}${isAdmin() ? navItem('accounting', 'Accounting', 'layout-dashboard') : ''}`;
  return `<div class="app-shell"><aside class="sidebar ${state.mobileNav ? 'open' : ''}"><div class="brand"><span class="brand-mark"><i data-lucide="library"></i></span><span>Circulation<br><em>Desk</em></span><button class="icon-btn mobile-close" data-action="close-nav" aria-label="Close navigation"><i data-lucide="x"></i></button></div><div class="workspace-label">Workspace</div><nav>${navItem('dashboard', 'Overview', 'layout-dashboard')}${navItem('books', 'Books', 'book-open', state.books.length)}${protectedNav}</nav><div class="sidebar-foot"><div class="status-dot"><span></span><div><strong>API connected</strong><small>${escapeHtml(API_BASE_URL.replace(/^https?:\/\//, ''))}</small></div></div><button class="nav-item muted" data-action="refresh"><i data-lucide="rotate-cw"></i><span>Refresh data</span></button><button class="nav-item muted" data-action="logout"><i data-lucide="log-out"></i><span>Sign out</span></button></div></aside><main class="main-content"><header class="topbar"><button class="icon-btn menu-toggle" data-action="open-nav" aria-label="Open navigation"><i data-lucide="menu"></i></button><div class="breadcrumbs"><span>Library</span><i data-lucide="chevron-down"></i><strong>${pageTitle()}</strong></div><div class="top-actions"><span class="date-label">${new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</span><span class="role-label">${escapeHtml(currentRole())}</span><button class="avatar" aria-label="Sign out" data-action="logout">${escapeHtml(userInitials(username))}</button></div></header>${state.notice ? `<div class="toast success"><i data-lucide="check"></i>${escapeHtml(state.notice)}</div>` : ''}${state.error ? `<div class="toast error"><i data-lucide="circle-alert"></i>${escapeHtml(state.error)}<button class="toast-close" data-action="clear-error"><i data-lucide="x"></i></button></div>` : ''}<section class="page-content">${content}</section></main></div>`;
}

function pageHeader(eyebrow, title, description, action = '') { return `<div class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-description">${description}</p></div>${action}</div>`; }
function statCard(label, value, detail, icon, tone) { return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon ${tone}"><i data-lucide="${icon}"></i></span></div><strong>${value}</strong><small>${detail}</small></article>`; }
function emptyState(icon, title, message) { return `<div class="empty-state"><span class="empty-icon"><i data-lucide="${icon}"></i></span><strong>${title}</strong><p>${message}</p></div>`; }
function loadingState() { return `<div class="loading-state"><span></span><span></span><span></span><p>Loading your library...</p></div>`; }

function dashboard() {
  const active = getBorrowingRows().filter((row) => !row.returned_at);
  const recent = [...getBorrowingRows()].sort((a, b) => new Date(b.borrowed_at || 0) - new Date(a.borrowed_at || 0)).slice(0, 5);
  const username = currentUser();
  const librarianContent = isLibrarian() ? `<div class="stats-grid">${statCard('Total customers', state.customers.length, 'Registered members', 'users-round', 'teal')}${statCard('Currently borrowed', active.length, 'Books not yet returned', 'clock-3', 'gold')}</div><div class="section-grid"><section class="panel activity-panel"><div class="panel-header"><div><p class="eyebrow">Live feed</p><h2>Recent activity</h2></div><button class="text-btn" data-page="borrowing">View all <i data-lucide="arrow-right"></i></button></div>${recent.length ? `<div class="activity-list">${recent.map((row) => `<div class="activity-item"><span class="activity-avatar">${escapeHtml(row.customerName).slice(0, 1).toUpperCase()}</span><div class="activity-copy"><strong>${escapeHtml(row.customerName)}</strong><span>${row.returned_at ? 'Returned' : 'Borrowed'} <b>${escapeHtml(row.bookTitle)}</b></span></div><time>${formatDate(row.returned_at || row.borrowed_at)}<small>${formatTime(row.returned_at || row.borrowed_at)}</small></time></div>`).join('')}</div>` : emptyState('clock-3', 'No borrowing activity', 'Activity will appear here when books are borrowed or returned.')}</section><section class="panel quick-panel"><div class="panel-header"><div><p class="eyebrow">Shortcuts</p><h2>Quick actions</h2></div></div><button class="quick-action" data-page="books"><span class="quick-icon coral"><i data-lucide="book-open"></i></span><span><strong>View books</strong><small>Browse the collection</small></span><i data-lucide="arrow-right"></i></button><button class="quick-action" data-page="customers"><span class="quick-icon teal"><i data-lucide="user-round"></i></span><span><strong>Manage customers</strong><small>View your library community</small></span><i data-lucide="arrow-right"></i></button><button class="quick-action" data-action="open-borrow"><span class="quick-icon gold"><i data-lucide="plus"></i></span><span><strong>Record borrowing</strong><small>Check out a book</small></span><i data-lucide="arrow-right"></i></button></section></div>` : '';
  return `${pageHeader(`Good morning, ${escapeHtml(username || 'there')}`, 'Your library at a glance', isLibrarian() ? 'A clear view of your collection and circulation.' : 'Explore the books in your library.')}<div class="stats-grid">${statCard('Total books', state.books.length, 'Titles in your collection', 'book-open', 'coral')}</div>${librarianContent}<section class="panel quick-panel user-shortcuts"><div class="panel-header"><div><p class="eyebrow">Collection</p><h2>Explore your library</h2></div></div><button class="quick-action" data-page="books"><span class="quick-icon coral"><i data-lucide="book-open"></i></span><span><strong>Browse books</strong><small>Search titles and authors</small></span><i data-lucide="arrow-right"></i></button></section>`;
}

function searchableHeader(type, title, description, query, action) { const canCreate = type === 'Books' ? isAdmin() : isLibrarian(); const addButton = canCreate ? `<button class="primary-btn" data-action="${action}"><i data-lucide="plus"></i>Add ${type === 'Books' ? 'book' : 'customer'}</button>` : ''; return `${pageHeader(type, title, description, addButton)}<div class="toolbar"><label class="search-box"><i data-lucide="search"></i><input data-search="${type.toLowerCase()}" value="${escapeHtml(query)}" placeholder="Search ${type.toLowerCase()}..." /></label></div>`; }
function booksPage() {
  const books = state.bookQuery ? state.bookResults ?? state.books.filter((book) => book.title?.toLowerCase().includes(state.bookQuery.toLowerCase())) : state.books;
  return `${searchableHeader('Books', 'Collection', 'Keep your shelves organized and easy to explore.', state.bookQuery, 'open-book')}<section class="panel table-panel"><div class="table-meta"><span>${books.length} ${books.length === 1 ? 'title' : 'titles'}</span><span class="meta-status"><i data-lucide="check"></i>Synced just now</span></div>${books.length ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Author</th><th>Price</th><th>ID</th>${isAdmin() ? '<th></th>' : ''}</tr></thead><tbody>${books.map((book) => `<tr><td><div class="item-title"><span class="book-cover"><i data-lucide="book-open"></i></span><strong>${escapeHtml(book.title)}</strong></div></td><td>${escapeHtml(book.author)}</td><td>${book.price == null ? '—' : escapeHtml(Number(book.price).toFixed(2))}</td><td><span class="id-pill">#${escapeHtml(book.id)}</span></td>${isAdmin() ? `<td class="row-actions"><button class="icon-btn danger" data-delete-book="${escapeHtml(book.id)}" aria-label="Delete ${escapeHtml(book.title)}"><i data-lucide="trash-2"></i></button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : emptyState('book-open', state.bookQuery ? 'No books found' : 'Your collection is empty', state.bookQuery ? 'Try a different title.' : 'Add your first book to get started.')}</section>`;
}
function customersPage() {
  const customers = state.customerQuery ? state.customerResults ?? state.customers.filter((customer) => customer.name?.toLowerCase().includes(state.customerQuery.toLowerCase())) : state.customers;
  return `${searchableHeader('Customers', 'Library community', 'The people who make your library worth running.', state.customerQuery, 'open-customer')}<section class="panel table-panel"><div class="table-meta"><span>${customers.length} ${customers.length === 1 ? 'member' : 'members'}</span><span class="meta-status"><i data-lucide="check"></i>Synced just now</span></div>${customers.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>ID</th>${isAdmin() ? '<th></th>' : ''}</tr></thead><tbody>${customers.map((customer) => `<tr><td><div class="item-title"><span class="person-avatar">${escapeHtml(customer.name).slice(0, 1).toUpperCase()}</span><strong>${escapeHtml(customer.name)}</strong></div></td><td>${escapeHtml(customer.email)}</td><td><span class="id-pill">#${escapeHtml(customer.id)}</span></td>${isAdmin() ? `<td class="row-actions"><button class="icon-btn danger" data-delete-customer="${escapeHtml(customer.id)}" aria-label="Delete ${escapeHtml(customer.name)}"><i data-lucide="trash-2"></i></button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : emptyState('users-round', state.customerQuery ? 'No customers found' : 'No customers yet', state.customerQuery ? 'Try a different name.' : 'Add your first customer to get started.')}</section>`;
}
function borrowingPage() {
  const rows = state.borrowingQuery ? getBorrowingRows(state.borrowingResults).filter((row) => row.customerName.toLowerCase().includes(state.borrowingQuery.toLowerCase())) : getBorrowingRows();
  return `${pageHeader('Circulation', 'Borrowing history', 'Keep track of every book on its journey.', '<button class="primary-btn" data-action="open-borrow"><i data-lucide="plus"></i>Record borrowing</button>')}<div class="toolbar"><label class="search-box"><i data-lucide="search"></i><input data-search="borrowing" value="${escapeHtml(state.borrowingQuery)}" placeholder="Search by customer name..." /></label><button class="filter-btn"><i data-lucide="more-horizontal"></i></button></div><section class="panel table-panel"><div class="table-meta"><span>${rows.length} ${rows.length === 1 ? 'record' : 'records'}</span><span class="meta-status"><i data-lucide="clock-3"></i>${rows.filter((row) => !row.returned_at).length} currently out</span></div>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Book</th><th>Borrowed</th><th>Returned</th><th></th></tr></thead><tbody>${rows.map((row) => `<tr><td><div class="item-title"><span class="person-avatar">${escapeHtml(row.customerName).slice(0, 1).toUpperCase()}</span><strong>${escapeHtml(row.customerName)}</strong></div></td><td>${escapeHtml(row.bookTitle)}</td><td>${formatDate(row.borrowed_at)}</td><td>${row.returned_at ? `<span class="returned-label"><i data-lucide="check"></i>${formatDate(row.returned_at)}</span>` : '<span class="active-label">Currently out</span>'}</td><td class="row-actions">${!row.returned_at && row.id ? `<button class="return-btn" data-return="${escapeHtml(row.id)}">Return</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : emptyState('clock-3', state.borrowingQuery ? 'No records found' : 'No borrowing history', state.borrowingQuery ? 'Try a different customer name.' : 'Borrowing records will appear here.')}</section>`;
}
function accountingPage() {
  return `${pageHeader('Administration', 'Accounting', 'Borrowing fees recorded by the library.', '')}<div class="stats-grid">${statCard('Total income', Number(state.totalIncome).toFixed(2), 'Recorded borrowing fees', 'layout-dashboard', 'teal')}</div><section class="panel table-panel"><div class="table-meta"><span>${state.accounting.length} ${state.accounting.length === 1 ? 'transaction' : 'transactions'}</span><span class="meta-status"><i data-lucide="check"></i>Synced just now</span></div>${state.accounting.length ? `<div class="table-wrap"><table><thead><tr><th>Transaction</th><th>Customer</th><th>Customer ID</th><th>Book</th><th>Book ID</th><th>Amount</th></tr></thead><tbody>${state.accounting.map((entry) => {
    const customerName = state.customers.find((customer) => String(customer.id) === String(entry.customer_id))?.name || 'Unknown customer';
    const bookTitle = state.books.find((book) => String(book.id) === String(entry.book_id))?.title || 'Unknown book';
    return `<tr><td>${escapeHtml(entry.transaction_type || '—')}</td><td>${escapeHtml(customerName)}</td><td>${escapeHtml(entry.customer_id ?? '—')}</td><td>${escapeHtml(bookTitle)}</td><td>${escapeHtml(entry.book_id ?? '—')}</td><td>${entry.amount == null ? '—' : escapeHtml(Number(entry.amount).toFixed(2))}</td></tr>`;
  }).join('')}</tbody></table></div>` : emptyState('layout-dashboard', 'No transactions yet', 'Borrowing fees will appear here.')}</section>`;
}
function modal(type) {
  const isBook = type === 'book';
  const borrowForm = `<label>Customer<select name="customer_id" required><option value="">Choose a customer</option>${state.customers.map((customer) => `<option value="${escapeHtml(customer.id)}" ${String(customer.id) === String(state.borrowCustomerId) ? 'selected' : ''}>${escapeHtml(customer.name)} · ${escapeHtml(customer.email)}</option>`).join('')}</select></label><button type="button" class="inline-action" data-action="open-customer-from-borrow"><i data-lucide="plus"></i>Add a new customer</button><label>Book<select name="book_id" required><option value="">Choose a book</option>${state.books.map((book) => `<option value="${escapeHtml(book.id)}">${escapeHtml(book.title)} · ${escapeHtml(book.author)}</option>`).join('')}</select></label><p class="form-hint">Choose from the records already in your library.</p>`;
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" data-modal-content><div class="modal-head"><div><p class="eyebrow">New record</p><h2>${isBook ? 'Add a book' : type === 'customer' ? 'Add a customer' : 'Record borrowing'}</h2></div><button class="icon-btn" data-action="close-modal" aria-label="Close"><i data-lucide="x"></i></button></div><form data-form="${type}">${isBook ? `<label>Title<input name="title" required placeholder="e.g. The Left Hand of Darkness" /></label><label>Author<input name="author" required placeholder="e.g. Ursula K. Le Guin" /></label><label>Price<input type="number" name="price" min="0" step="0.01" required placeholder="0.00" /></label>` : type === 'customer' ? `<label>Name<input name="name" required placeholder="e.g. Maya Chen" /></label><label>Email<input type="email" name="email" required placeholder="maya@example.com" /></label>` : borrowForm}<button class="primary-btn full-width" type="submit"><i data-lucide="check"></i>${isBook ? 'Add book' : type === 'customer' ? 'Add customer' : 'Check out book'}</button></form></div></div>`;
}
function render() {
  if (state.authenticated && !canVisitPage(state.page)) state.page = 'dashboard';
  const content = state.authenticated ? (state.loading ? loadingState() : state.page === 'dashboard' ? dashboard() : state.page === 'books' ? booksPage() : state.page === 'customers' ? customersPage() : state.page === 'accounting' ? accountingPage() : borrowingPage()) : loginPage();
  document.querySelector('#app').innerHTML = state.authenticated ? renderShell(content) : content;
  createIcons({ icons });
}
function openModal(type) { document.querySelector('#app').insertAdjacentHTML('beforeend', modal(type)); createIcons({ icons }); }
function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }

document.addEventListener('click', async (event) => {
  const page = event.target.closest('[data-page]')?.dataset.page;
  if (page) { if (!canVisitPage(page)) { notify(permissionMessage(), true); return; } state.page = page; state.mobileNav = false; render(); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'open-nav') { state.mobileNav = true; render(); }
  if (action === 'close-nav') { state.mobileNav = false; render(); }
  if (action === 'clear-error') { state.error = ''; render(); }
  if (action === 'logout') { clearAuth(); }
  if (action === 'refresh') await loadData();
  if (action === 'close-modal' && (!event.target.closest('[data-modal-content]') || event.target.closest('.modal-head button'))) closeModal();
  if (action === 'open-book') { if (isAdmin()) openModal('book'); else notify(permissionMessage(), true); }
  if (action === 'open-customer') { if (isLibrarian()) openModal('customer'); else notify(permissionMessage(), true); }
  if (action === 'open-customer-from-borrow') { if (isLibrarian()) { state.returnToBorrow = true; closeModal(); openModal('customer'); } else notify(permissionMessage(), true); }
  if (action === 'open-borrow') { if (isLibrarian()) openModal('borrow'); else notify(permissionMessage(), true); }
  const deleteBook = event.target.closest('[data-delete-book]')?.dataset.deleteBook;
  if (deleteBook && isAdmin() && window.confirm('Delete this book? This cannot be undone.')) { try { await api(`/books/${deleteBook}`, { method: 'DELETE' }); await loadData(); notify('Book deleted'); } catch (error) { notify(error.message, true); } }
  const deleteCustomer = event.target.closest('[data-delete-customer]')?.dataset.deleteCustomer;
  if (deleteCustomer && isAdmin() && window.confirm('Delete this customer? This cannot be undone.')) { try { await api(`/customer/${deleteCustomer}`, { method: 'DELETE' }); await loadData(); notify('Customer deleted'); } catch (error) { notify(error.message, true); } }
  const returnId = event.target.closest('[data-return]')?.dataset.return;
  if (returnId && isLibrarian() && window.confirm('Mark this book as returned?')) { try { await api(`/borrowed/${returnId}/return`, { method: 'PUT' }); await loadData(); notify('Book marked as returned'); } catch (error) { notify(error.message, true); } }
});
document.addEventListener('input', async (event) => {
  const input = event.target.closest('[data-search]');
  if (!input) return;
  const type = input.dataset.search;
  const query = input.value.trim();
  const config = {
    books: { queryKey: 'bookQuery', resultsKey: 'bookResults', path: '/books/search?title=' },
    customers: { queryKey: 'customerQuery', resultsKey: 'customerResults', path: '/customer/search?name=' },
    borrowing: { queryKey: 'borrowingQuery', resultsKey: 'borrowingResults', path: '/borrowed/search?customer_name=' },
  }[type];
  if (!config) return;
  state[config.queryKey] = query;
  const version = ++state.searchVersion[type];
  if (!query) state[config.resultsKey] = null;
  render();
  const focusInput = () => {
    const next = document.querySelector(`[data-search="${type}"]`);
    next?.focus();
    next?.setSelectionRange(next.value.length, next.value.length);
  };
  focusInput();
  if (!query) return;
  try {
    const results = await api(`${config.path}${encodeURIComponent(query)}`);
    if (version !== state.searchVersion[type]) return;
    state[config.resultsKey] = results || [];
    render();
    focusInput();
  } catch (error) {
    if (version === state.searchVersion[type]) {
      notify(error.message, true);
      focusInput();
    }
  }
});
document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-form]'); if (!form) return; event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (form.dataset.form === 'login') {
    state.authLoading = true; state.authError = ''; render();
    try {
      const body = new URLSearchParams({ username: data.username, password: data.password });
      const tokens = await api('/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, skipAuth: true });
      localStorage.setItem('library_access_token', tokens.access_token);
      localStorage.setItem('library_refresh_token', tokens.refresh_token);
      state.authenticated = true; state.authLoading = false; state.page = 'dashboard';
      await loadData();
    } catch (error) { state.authLoading = false; state.authError = error.message === 'Failed to fetch' ? 'Unable to reach the Library API.' : error.message; render(); }
    return;
  }
  if ((form.dataset.form === 'book' && !isAdmin()) || (form.dataset.form === 'customer' && !isLibrarian()) || (form.dataset.form === 'borrow' && !isLibrarian())) {
    closeModal();
    notify(permissionMessage(), true);
    return;
  }
  try {
    if (form.dataset.form === 'book') await api('/books', { method: 'POST', body: JSON.stringify(data) });
    if (form.dataset.form === 'customer') {
      const created = await api('/customer', { method: 'POST', body: JSON.stringify(data) });
      state.borrowCustomerId = created?.[0]?.id ?? '';
    }
    if (form.dataset.form === 'borrow') await api(`/borrowed?customer_id=${encodeURIComponent(data.customer_id)}&book_id=${encodeURIComponent(data.book_id)}`, { method: 'PUT' });
    closeModal(); await loadData();
    notify(form.dataset.form === 'borrow' ? 'Book checked out' : `${form.dataset.form === 'book' ? 'Book' : 'Customer'} added`);
    if (form.dataset.form === 'customer' && state.returnToBorrow) { state.returnToBorrow = false; openModal('borrow'); }
  } catch (error) { notify(error.message, true); }
});
loadData();