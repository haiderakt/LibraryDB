import { createIcons, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleAlert, Clock3, LayoutDashboard, Library, LogOut, Menu, MoreHorizontal, Plus, Search, Trash2, UserRound, UsersRound, X } from 'lucide';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const state = {
  page: 'dashboard', books: [], customers: [], borrowed: [], loading: true,
  error: '', notice: '', bookQuery: '', customerQuery: '', borrowingQuery: '', mobileNav: false,
};

const icons = { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleAlert, Clock3, LayoutDashboard, Library, LogOut, Menu, MoreHorizontal, Plus, Search, Trash2, UserRound, UsersRound, X };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&#38;', '<': '&#60;', '>': '&#62;', "'": '&#39;', '"': '&#34;' }[character]));
const formatDate = (value) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—';
const formatTime = (value) => value ? new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '';

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try { detail = (await response.json()).detail || detail; } catch { /* response may not be JSON */ }
    throw new Error(detail);
  }
  return response.status === 204 ? null : response.json();
}

async function loadData() {
  state.loading = true; state.error = ''; render();
  try {
    const [books, customers, borrowed] = await Promise.all([api('/books'), api('/customer'), api('/borrowed')]);
    state.books = books || []; state.customers = customers || []; state.borrowed = borrowed || [];
  } catch (error) { state.error = error.message; } finally { state.loading = false; render(); }
}

function notify(message, isError = false) {
  state.notice = isError ? '' : message; state.error = isError ? message : ''; render();
  window.setTimeout(() => { if (state.notice === message) { state.notice = ''; render(); } }, 3200);
}

function getBorrowingRows() {
  return state.borrowed.map((record) => ({
    ...record,
    customerName: record.customer || record.customer_name || state.customers.find((customer) => customer.id === record.customer_id)?.name || `Customer #${record.customer_id ?? '—'}`,
    bookTitle: record.title || record.book_title || state.books.find((book) => book.id === record.book_id)?.title || `Book #${record.book_id ?? '—'}`,
  }));
}

function navItem(page, label, icon, count = '') { return `<button class="nav-item ${state.page === page ? 'active' : ''}" data-page="${page}"><i data-lucide="${icon}"></i><span>${label}</span>${count ? `<b>${count}</b>` : ''}</button>`; }
function pageTitle() { return { dashboard: 'Overview', books: 'Books', customers: 'Customers', borrowing: 'Borrowing' }[state.page]; }

function renderShell(content) {
  return `<div class="app-shell"><aside class="sidebar ${state.mobileNav ? 'open' : ''}"><div class="brand"><span class="brand-mark"><i data-lucide="library"></i></span><span>Circulation<br><em>Desk</em></span><button class="icon-btn mobile-close" data-action="close-nav" aria-label="Close navigation"><i data-lucide="x"></i></button></div><div class="workspace-label">Workspace</div><nav>${navItem('dashboard', 'Overview', 'layout-dashboard')}${navItem('books', 'Books', 'book-open', state.books.length)}${navItem('customers', 'Customers', 'users-round', state.customers.length)}${navItem('borrowing', 'Borrowing', 'clock-3', getBorrowingRows().filter((row) => !row.returned_at).length)}</nav><div class="sidebar-foot"><div class="status-dot"><span></span><div><strong>API connected</strong><small>${escapeHtml(API_BASE_URL.replace(/^https?:\/\//, ''))}</small></div></div><button class="nav-item muted" data-action="refresh"><i data-lucide="log-out"></i><span>Refresh data</span></button></div></aside><main class="main-content"><header class="topbar"><button class="icon-btn menu-toggle" data-action="open-nav" aria-label="Open navigation"><i data-lucide="menu"></i></button><div class="breadcrumbs"><span>Library</span><i data-lucide="chevron-down"></i><strong>${pageTitle()}</strong></div><div class="top-actions"><span class="date-label">${new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</span><button class="avatar" aria-label="Account">JD</button></div></header>${state.notice ? `<div class="toast success"><i data-lucide="check"></i>${escapeHtml(state.notice)}</div>` : ''}${state.error ? `<div class="toast error"><i data-lucide="circle-alert"></i>${escapeHtml(state.error)}<button class="toast-close" data-action="clear-error"><i data-lucide="x"></i></button></div>` : ''}<section class="page-content">${content}</section></main></div>`;
}

function pageHeader(eyebrow, title, description, action = '') { return `<div class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-description">${description}</p></div>${action}</div>`; }
function statCard(label, value, detail, icon, tone) { return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon ${tone}"><i data-lucide="${icon}"></i></span></div><strong>${value}</strong><small>${detail}</small></article>`; }
function emptyState(icon, title, message) { return `<div class="empty-state"><span class="empty-icon"><i data-lucide="${icon}"></i></span><strong>${title}</strong><p>${message}</p></div>`; }
function loadingState() { return `<div class="loading-state"><span></span><span></span><span></span><p>Loading your library...</p></div>`; }

function dashboard() {
  const active = getBorrowingRows().filter((row) => !row.returned_at);
  const recent = [...getBorrowingRows()].sort((a, b) => new Date(b.borrowed_at || 0) - new Date(a.borrowed_at || 0)).slice(0, 5);
  return `${pageHeader('Good morning, Jordan', 'Your library at a glance', 'A calm view of what is happening across your collection today.', '<button class="primary-btn" data-action="open-borrow"><i data-lucide="plus"></i>New borrowing</button>')}<div class="stats-grid">${statCard('Total books', state.books.length, 'Titles in your collection', 'book-open', 'coral')}${statCard('Total customers', state.customers.length, 'Registered members', 'users-round', 'teal')}${statCard('Currently borrowed', active.length, active.length ? 'Need to be returned' : 'Nothing overdue', 'clock-3', 'gold')}</div><div class="section-grid"><section class="panel activity-panel"><div class="panel-header"><div><p class="eyebrow">Live feed</p><h2>Recent activity</h2></div><button class="text-btn" data-page="borrowing">View all <i data-lucide="arrow-right"></i></button></div>${recent.length ? `<div class="activity-list">${recent.map((row) => `<div class="activity-item"><span class="activity-avatar">${escapeHtml(row.customerName).slice(0, 1).toUpperCase()}</span><div class="activity-copy"><strong>${escapeHtml(row.customerName)}</strong><span>${row.returned_at ? 'Returned' : 'Borrowed'} <b>${escapeHtml(row.bookTitle)}</b></span></div><time>${formatDate(row.returned_at || row.borrowed_at)}<small>${formatTime(row.returned_at || row.borrowed_at)}</small></time></div>`).join('')}</div>` : emptyState('clock-3', 'No borrowing activity', 'Activity will appear here when books move in or out.')}</section><section class="panel quick-panel"><div class="panel-header"><div><p class="eyebrow">Shortcuts</p><h2>Quick actions</h2></div></div><button class="quick-action" data-page="books"><span class="quick-icon coral"><i data-lucide="book-open"></i></span><span><strong>Manage books</strong><small>Browse and update your collection</small></span><i data-lucide="arrow-right"></i></button><button class="quick-action" data-page="customers"><span class="quick-icon teal"><i data-lucide="user-round"></i></span><span><strong>Manage customers</strong><small>View your library community</small></span><i data-lucide="arrow-right"></i></button><button class="quick-action" data-action="open-borrow"><span class="quick-icon gold"><i data-lucide="plus"></i></span><span><strong>Record borrowing</strong><small>Check out a book in seconds</small></span><i data-lucide="arrow-right"></i></button></section></div>`;
}

function searchableHeader(type, title, description, query, action) { return `${pageHeader(type, title, description, `<button class="primary-btn" data-action="${action}"><i data-lucide="plus"></i>Add ${type === 'Books' ? 'book' : 'customer'}</button>`)}<div class="toolbar"><label class="search-box"><i data-lucide="search"></i><input data-search="${type.toLowerCase()}" value="${escapeHtml(query)}" placeholder="Search ${type.toLowerCase()}..." /><kbd>⌘ K</kbd></label><button class="filter-btn"><i data-lucide="more-horizontal"></i></button></div>`; }
function booksPage() {
  const books = state.books.filter((book) => !state.bookQuery || book.title?.toLowerCase().includes(state.bookQuery.toLowerCase()));
  return `${searchableHeader('Books', 'Collection', 'Keep your shelves organized and easy to explore.', state.bookQuery, 'open-book')}<section class="panel table-panel"><div class="table-meta"><span>${books.length} ${books.length === 1 ? 'title' : 'titles'}</span><span class="meta-status"><i data-lucide="check"></i>Synced just now</span></div>${books.length ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Author</th><th>ID</th><th></th></tr></thead><tbody>${books.map((book) => `<tr><td><div class="item-title"><span class="book-cover"><i data-lucide="book-open"></i></span><strong>${escapeHtml(book.title)}</strong></div></td><td>${escapeHtml(book.author)}</td><td><span class="id-pill">#${escapeHtml(book.id)}</span></td><td class="row-actions"><button class="icon-btn danger" data-delete-book="${escapeHtml(book.id)}" aria-label="Delete ${escapeHtml(book.title)}"><i data-lucide="trash-2"></i></button></td></tr>`).join('')}</tbody></table></div>` : emptyState('book-open', state.bookQuery ? 'No books found' : 'Your collection is empty', state.bookQuery ? 'Try a different title.' : 'Add your first book to get started.')}</section>`;
}
function customersPage() {
  const customers = state.customers.filter((customer) => !state.customerQuery || customer.name?.toLowerCase().includes(state.customerQuery.toLowerCase()));
  return `${searchableHeader('Customers', 'Library community', 'The people who make your library worth running.', state.customerQuery, 'open-customer')}<section class="panel table-panel"><div class="table-meta"><span>${customers.length} ${customers.length === 1 ? 'member' : 'members'}</span><span class="meta-status"><i data-lucide="check"></i>Synced just now</span></div>${customers.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>ID</th><th></th></tr></thead><tbody>${customers.map((customer) => `<tr><td><div class="item-title"><span class="person-avatar">${escapeHtml(customer.name).slice(0, 1).toUpperCase()}</span><strong>${escapeHtml(customer.name)}</strong></div></td><td>${escapeHtml(customer.email)}</td><td><span class="id-pill">#${escapeHtml(customer.id)}</span></td><td class="row-actions"><button class="icon-btn danger" data-delete-customer="${escapeHtml(customer.id)}" aria-label="Delete ${escapeHtml(customer.name)}"><i data-lucide="trash-2"></i></button></td></tr>`).join('')}</tbody></table></div>` : emptyState('users-round', state.customerQuery ? 'No customers found' : 'No customers yet', state.customerQuery ? 'Try a different name.' : 'Add your first customer to get started.')}</section>`;
}
function borrowingPage() {
  const rows = getBorrowingRows().filter((row) => !state.borrowingQuery || row.customerName.toLowerCase().includes(state.borrowingQuery.toLowerCase()));
  return `${pageHeader('Circulation', 'Borrowing history', 'Keep track of every book on its journey.', '<button class="primary-btn" data-action="open-borrow"><i data-lucide="plus"></i>Record borrowing</button>')}<div class="toolbar"><label class="search-box"><i data-lucide="search"></i><input data-search="borrowing" value="${escapeHtml(state.borrowingQuery)}" placeholder="Search by customer name..." /></label><button class="filter-btn"><i data-lucide="more-horizontal"></i></button></div><section class="panel table-panel"><div class="table-meta"><span>${rows.length} ${rows.length === 1 ? 'record' : 'records'}</span><span class="meta-status"><i data-lucide="clock-3"></i>${rows.filter((row) => !row.returned_at).length} currently out</span></div>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Book</th><th>Borrowed</th><th>Returned</th><th></th></tr></thead><tbody>${rows.map((row) => `<tr><td><div class="item-title"><span class="person-avatar">${escapeHtml(row.customerName).slice(0, 1).toUpperCase()}</span><strong>${escapeHtml(row.customerName)}</strong></div></td><td>${escapeHtml(row.bookTitle)}</td><td>${formatDate(row.borrowed_at)}</td><td>${row.returned_at ? `<span class="returned-label"><i data-lucide="check"></i>${formatDate(row.returned_at)}</span>` : '<span class="active-label">Currently out</span>'}</td><td class="row-actions">${!row.returned_at && row.id ? `<button class="return-btn" data-return="${escapeHtml(row.id)}">Return</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : emptyState('clock-3', state.borrowingQuery ? 'No records found' : 'No borrowing history', state.borrowingQuery ? 'Try a different customer name.' : 'Borrowing records will appear here.')}</section>`;
}
function modal(type) {
  const isBook = type === 'book';
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" data-modal-content><div class="modal-head"><div><p class="eyebrow">New record</p><h2>${isBook ? 'Add a book' : type === 'customer' ? 'Add a customer' : 'Record borrowing'}</h2></div><button class="icon-btn" data-action="close-modal" aria-label="Close"><i data-lucide="x"></i></button></div><form data-form="${type}">${isBook ? `<label>Title<input name="title" required placeholder="e.g. The Left Hand of Darkness" /></label><label>Author<input name="author" required placeholder="e.g. Ursula K. Le Guin" /></label>` : type === 'customer' ? `<label>Name<input name="name" required placeholder="e.g. Maya Chen" /></label><label>Email<input type="email" name="email" required placeholder="maya@example.com" /></label>` : `<label>Customer ID<input type="number" name="customer_id" required min="1" placeholder="e.g. 12" /></label><label>Book ID<input type="number" name="book_id" required min="1" placeholder="e.g. 42" /></label><p class="form-hint">Use the IDs shown in the Books and Customers tables.</p>`}<button class="primary-btn full-width" type="submit"><i data-lucide="check"></i>${isBook ? 'Add book' : type === 'customer' ? 'Add customer' : 'Check out book'}</button></form></div></div>`;
}
function render() { const content = state.loading ? loadingState() : state.page === 'dashboard' ? dashboard() : state.page === 'books' ? booksPage() : state.page === 'customers' ? customersPage() : borrowingPage(); document.querySelector('#app').innerHTML = renderShell(content); createIcons({ icons }); }
function openModal(type) { document.querySelector('#app').insertAdjacentHTML('beforeend', modal(type)); createIcons({ icons }); }
function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }

document.addEventListener('click', async (event) => {
  const page = event.target.closest('[data-page]')?.dataset.page;
  if (page) { state.page = page; state.mobileNav = false; render(); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'open-nav') { state.mobileNav = true; render(); }
  if (action === 'close-nav') { state.mobileNav = false; render(); }
  if (action === 'clear-error') { state.error = ''; render(); }
  if (action === 'refresh') await loadData();
  if (action === 'close-modal' && (!event.target.closest('[data-modal-content]') || event.target.closest('.modal-head button'))) closeModal();
  if (action === 'open-book') openModal('book');
  if (action === 'open-customer') openModal('customer');
  if (action === 'open-borrow') openModal('borrow');
  const deleteBook = event.target.closest('[data-delete-book]')?.dataset.deleteBook;
  if (deleteBook && window.confirm('Delete this book? This cannot be undone.')) { try { await api(`/books/${deleteBook}`, { method: 'DELETE' }); await loadData(); notify('Book deleted'); } catch (error) { notify(error.message, true); } }
  const deleteCustomer = event.target.closest('[data-delete-customer]')?.dataset.deleteCustomer;
  if (deleteCustomer && window.confirm('Delete this customer? This cannot be undone.')) { try { await api(`/customer/${deleteCustomer}`, { method: 'DELETE' }); await loadData(); notify('Customer deleted'); } catch (error) { notify(error.message, true); } }
  const returnId = event.target.closest('[data-return]')?.dataset.return;
  if (returnId && window.confirm('Mark this book as returned?')) { try { await api(`/borrowed/${returnId}/return`, { method: 'PUT' }); await loadData(); notify('Book marked as returned'); } catch (error) { notify(error.message, true); } }
});
document.addEventListener('input', (event) => { const input = event.target.closest('[data-search]'); if (!input) return; if (input.dataset.search === 'books') state.bookQuery = input.value; if (input.dataset.search === 'customers') state.customerQuery = input.value; if (input.dataset.search === 'borrowing') state.borrowingQuery = input.value; render(); const next = document.querySelector(`[data-search="${input.dataset.search}"]`); next?.focus(); next?.setSelectionRange(next.value.length, next.value.length); });
document.addEventListener('submit', async (event) => { const form = event.target.closest('[data-form]'); if (!form) return; event.preventDefault(); const data = Object.fromEntries(new FormData(form)); try { if (form.dataset.form === 'book') await api('/books', { method: 'POST', body: JSON.stringify(data) }); if (form.dataset.form === 'customer') await api('/customer', { method: 'POST', body: JSON.stringify(data) }); if (form.dataset.form === 'borrow') await api(`/borrowed?customer_id=${encodeURIComponent(data.customer_id)}&book_id=${encodeURIComponent(data.book_id)}`, { method: 'PUT' }); closeModal(); await loadData(); notify(form.dataset.form === 'borrow' ? 'Book checked out' : `${form.dataset.form === 'book' ? 'Book' : 'Customer'} added`); } catch (error) { notify(error.message, true); } });
loadData();