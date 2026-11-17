/* BRITEMAKERS ERP — shell, navigation, router, theming */
(function (BM) {
  'use strict';
  const { esc, relTime } = BM.util;
  const D = BM.data, ui = BM.ui, S = BM.state, $ = BM.$, $$ = BM.$$;

  const activeJobs = () => BM.sel.jobs().filter((j) => j.status !== 'delivered').length;
  const newLeads = () => BM.sel.leads().filter((l) => l.stage === 'new').length;
  const lowStock = () => D.inventory.filter((i) => (S.branch === 'all' ? D.stockStatus(i, 'all') : D.stockStatus(i, S.branch)) !== 'ok').length;

  BM.nav = [
    { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', desc: 'Command centre' }] },
    { label: 'Operations', items: [
      { id: 'jobs', label: 'Job Cards', icon: 'jobs', desc: 'Live work board', badge: activeJobs, hot: true },
      { id: 'schedule', label: 'Schedule', icon: 'calendar', desc: 'Bay planner & bookings' },
      { id: 'warranty', label: 'Warranty & Care', icon: 'shield', desc: 'Coating & PPF certificates' },
    ] },
    { label: 'Customers', items: [
      { id: 'customers', label: 'Customers', icon: 'users', desc: 'CRM & vehicles' },
      { id: 'leads', label: 'Leads & Social', icon: 'target', desc: 'Enquiries pipeline', badge: newLeads, hot: true },
    ] },
    { label: 'Commerce', items: [
      { id: 'services', label: 'Services', icon: 'sparkles', desc: 'Packages & pricing' },
      { id: 'invoices', label: 'Invoices', icon: 'receipt', desc: 'Billing & GST' },
      { id: 'inventory', label: 'Inventory', icon: 'package', desc: 'Stock & purchase orders', badge: lowStock },
    ] },
    { label: 'Organisation', items: [
      { id: 'team', label: 'Team', icon: 'team', desc: 'Technicians & attendance' },
      { id: 'branches', label: 'Branches', icon: 'pin', desc: 'Kottayam · Kochi · Trivandrum' },
    ] },
    { label: 'Insights & setup', items: [{ id: 'reports', label: 'Reports', icon: 'chart', desc: 'Analytics' }, { id: 'settings', label: 'Settings', icon: 'settings', desc: 'Workspace & appearance' }] },
  ];
  BM.nav.forEach((g) => g.items.forEach((n) => { n.href = '#/' + n.id; }));

  /* ---------- theming ---------- */
  const sysDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  BM.applyTheme = () => {
    const r = document.documentElement;
    r.setAttribute('data-theme', S.theme === 'system' ? (sysDark() ? 'dark' : 'light') : S.theme);
    r.setAttribute('data-accent', S.accent); r.setAttribute('data-density', S.density);
    $('#app') && $('#app').classList.toggle('collapsed', !!S.collapsed);
    const ti = $('#themeBtn'); if (ti) ti.innerHTML = BM.icon(r.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon', 18);
  };
  BM.setPref = (k, v) => { S[k] = v; BM.store.set(k, v); BM.applyTheme(); };
  BM.actions.toggleTheme = () => { const cur = document.documentElement.getAttribute('data-theme'); BM.setPref('theme', cur === 'dark' ? 'light' : 'dark'); BM.refreshCharts && BM.refreshCharts(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.theme === 'system') BM.applyTheme(); });

  /* ---------- shell ---------- */
  function sidebar() {
    return `<div class="brand"><div class="logo-mark"><span>BM</span></div><div class="brand-txt"><b>Brite<em>makers</em></b><small>ERP · Command Centre</small></div></div>
    <nav class="nav" aria-label="Main">${BM.nav.map((g) => `<div class="nav-label">${g.label}</div>${g.items.map((n) => `<a class="nav-item" href="${n.href}" data-id="${n.id}" title="${esc(n.label)}">${BM.icon(n.icon, 19)}<span>${n.label}</span>${n.badge ? `<em class="nav-badge ${n.hot ? 'hot' : ''}" data-badge="${n.id}" style="font-style:normal"></em>` : ''}</a>`).join('')}`).join('')}</nav>
    <div class="sb-promo"><div class="checker"></div><h4>Year-End Shine Fest</h4><p>46 bookings across 3 branches · offer ends 31 Dec</p></div>
    <div class="sb-user">${BM.avatar(D.me.name, 36)}<div class="who grow"><b class="ellipsis">${esc(D.me.name)}</b><small>${esc(D.me.role)}</small></div><button class="btn btn-ghost btn-icon btn-sm" data-action="toast" data-msg="Signed out (demo)" data-sub="This is a front-end demo — no real session." aria-label="Sign out">${BM.icon('logout', 16)}</button></div>`;
  }
  const branchLabel = () => (S.branch === 'all' ? 'All branches' : D.branchById[S.branch].name);
  function topbar() {
    const unread = D.notifications.filter((n) => n.unread).length;
    return `<button class="btn btn-ghost btn-icon menu-btn" data-action="toggleNav" aria-label="Open menu">${BM.icon('menu', 20)}</button>
    <button class="btn btn-ghost btn-icon collapse-btn" data-action="toggleCollapse" aria-label="Collapse sidebar">${BM.icon('panel', 19)}</button>
    <div class="crumbs"><span class="hide-sm">Britemakers</span>${BM.icon('right', 14)}<b id="crumb">Dashboard</b></div>
    <button class="search-btn" data-action="openCmdk" aria-label="Search">${BM.icon('search', 17)}<span>Search customers, jobs, invoices…</span><kbd>Ctrl K</kbd></button>
    <div class="tb-actions">
      <div class="dd" id="ddBranch"><button class="branch-btn" data-dd aria-haspopup="true">${BM.icon('pin', 16)}<span class="bn-txt" id="branchLbl">${esc(branchLabel())}</span>${BM.icon('down', 15)}</button>
        <div class="dd-panel"><div class="dd-h">Branch</div>
          <button class="dd-i" data-action="branch" data-id="all">${BM.icon('globe', 17)}All branches<span class="chk">${S.branch === 'all' ? BM.icon('check', 16) : ''}</span></button>
          ${D.branches.map((b) => `<button class="dd-i" data-action="branch" data-id="${b.id}"><span class="dot" style="background:${b.color}"></span>${b.name}<span class="chk">${S.branch === b.id ? BM.icon('check', 16) : ''}</span></button>`).join('')}</div></div>
      <div class="dd" id="ddNew"><button class="btn btn-primary" data-dd>${BM.icon('plus', 17)}<span class="bn-txt">New</span></button>
        <div class="dd-panel"><div class="dd-h">Create</div>
          <button class="dd-i" data-action="newJob">${BM.icon('jobs', 17)}Job card</button>
          <button class="dd-i" data-action="newAppt">${BM.icon('calendar', 17)}Appointment</button>
          <button class="dd-i" data-action="newCustomer">${BM.icon('userPlus', 17)}Customer</button>
          <button class="dd-i" data-action="newLead">${BM.icon('target', 17)}Lead</button>
          <button class="dd-i" data-action="newInvoice">${BM.icon('receipt', 17)}Invoice</button></div></div>
      <button class="btn btn-icon" id="themeBtn" data-action="toggleTheme" aria-label="Toggle theme"></button>
      <div class="dd" id="ddNotif"><button class="btn btn-icon" data-dd aria-label="Notifications">${BM.icon('bell', 18)}${unread ? '<span class="dot-badge"></span>' : ''}</button>
        <div class="dd-panel notif-panel"><div class="notif-h"><span>Notifications</span><button class="link" data-action="markRead">Mark all read</button></div>
          <div class="notif-list">${D.notifications.map((n) => `<div class="notif ${n.unread ? 'unread' : ''}"><span class="t-ic">${BM.icon(n.icon, 17)}</span><div class="grow"><b>${esc(n.title)}</b><small>${esc(n.sub)}</small><small>${relTime(new Date(Date.now() - n.t * 60000))}</small></div></div>`).join('')}</div></div></div>
      <div class="dd" id="ddUser"><button class="btn btn-icon" data-dd aria-label="Account" style="padding:0">${BM.avatar(D.me.name, 34)}</button>
        <div class="dd-panel"><div class="dd-h">${esc(D.me.name)}</div>
          <button class="dd-i" data-action="go" data-href="#/settings">${BM.icon('settings', 17)}Settings</button>
          <button class="dd-i" data-action="openCmdk">${BM.icon('search', 17)}Command palette<span class="kbd">Ctrl K</span></button>
          <button class="dd-i" data-action="toast" data-msg="Shortcuts: Ctrl+K search · / quick find · Esc close" data-icon="help">${BM.icon('help', 17)}Keyboard shortcuts</button>
          <div class="dd-sep"></div>
          <button class="dd-i" data-action="toast" data-msg="Signed out (demo)" data-sub="This is a front-end demo — no real session.">${BM.icon('logout', 17)}Sign out</button></div></div>
    </div>`;
  }
  function updateBadges() {
    $$('[data-badge]').forEach((b) => { const n = BM.nav.flatMap((g) => g.items).find((x) => x.id === b.dataset.badge); const v = n.badge(); b.textContent = v; b.style.display = v ? '' : 'none'; });
  }
  function mountShell() {
    $('#app').innerHTML = `<aside class="sidebar" id="sidebar">${sidebar()}</aside><div class="scrim" data-action="toggleNav"></div><div class="main"><header class="topbar" id="topbar">${topbar()}</header><main class="page" id="page" tabindex="-1"></main></div>`;
    $('#overlays').innerHTML = `<div id="scrim2" class="overlay-scrim" style="pointer-events:none"></div><div id="toasts" aria-live="polite"></div><div id="gtip" class="gtip" role="tooltip"></div>`;
    BM.applyTheme(); updateBadges();
  }
  Object.assign(BM.actions, {
    toggleNav: () => $('#app').classList.toggle('nav-open'),
    toggleCollapse: () => BM.setPref('collapsed', !S.collapsed),
    branch: (el) => BM.setBranch(el.dataset.id),
    markRead: () => { D.notifications.forEach((n) => { n.unread = false; }); $('#topbar').innerHTML = topbar(); BM.applyTheme(); ui.toast('All caught up', { icon: 'check' }); },
  });
  BM.setBranch = (id) => {
    S.branch = id; BM.store.set('branch', id);
    $('#topbar').innerHTML = topbar(); BM.applyTheme(); updateBadges(); BM.refresh();
    ui.toast(id === 'all' ? 'Showing all 3 branches' : `Showing ${D.branchById[id].name} branch`, { icon: 'pin' });
  };

  /* ---------- router ---------- */
  let current = null;
  function render(keepScroll) {
    const id = (location.hash.replace(/^#\/?/, '') || 'dashboard').split(/[/?]/)[0];
    const page = BM.pages[id] || BM.pages.dashboard, key = BM.pages[id] ? id : 'dashboard';
    const y = window.scrollY;
    BM.charts.cleanup();
    const root = $('#page');
    root.innerHTML = page.render();
    if (!keepScroll) { root.classList.remove('enter'); void root.offsetWidth; root.classList.add('enter'); }
    current = key;
    if (page.mount) page.mount(root);
    ui.countUp(root);
    $$('.nav-item').forEach((a) => { const on = a.dataset.id === key; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#crumb').textContent = page.title;
    document.title = `${page.title} · Britemakers ERP`;
    $('#app').classList.remove('nav-open');
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    updateBadges();
  }
  BM.refresh = () => render(true);
  BM.refreshCharts = () => { if (current) render(true); };
  window.addEventListener('hashchange', () => { ui.drawer.close(true); ui.modal.close(true); render(false); });

  document.addEventListener('DOMContentLoaded', () => {
    mountShell();
    render(false);
    // let the splash-free first paint settle, then a gentle hint for the command palette
    setTimeout(() => ui.toast('Welcome back, Nikhil', { sub: 'Demo workspace · press Ctrl+K to search anything', icon: 'sparkles', ms: 4200 }), 900);
  });
})(window.BM);
