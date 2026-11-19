/* BRITEMAKERS — sign-in, sessions and which screen is showing (sign-in · client portal · ERP).

   DEMO ONLY. There is no server, so this is a screen-level gate and not real security: accounts and
   passwords live in this file, and anyone who can open the page can read them in dev tools. A production
   build must authenticate on a server (hashed passwords, sessions/tokens) and enforce access there too. */
(function (BM) {
  'use strict';
  const { esc, cap } = BM.util;
  const D = BM.data, ui = BM.ui, $ = BM.$;
  const A = BM.auth;

  /* The login screen lists these accounts so the demo is easy to try. Set to false to hide them. */
  A.SHOW_DEMO_ACCOUNTS = true;

  /* ---------- accounts ---------- */
  const CLIENT_PASSWORD = 'client123';   // one shared password for every demo customer
  const STAFF = [
    { id: 'owner', role: 'owner', login: 'owner', email: 'owner@britemakers.example', password: 'owner123', staffId: 's07' },    // Nikhil Raj
    { id: 'admin', role: 'admin', login: 'admin', email: 'admin@britemakers.example', password: 'admin123', staffId: 's02' },    // Rahul Varghese · Branch Manager
    { id: 'worker', role: 'worker', login: 'worker', email: 'worker@britemakers.example', password: 'worker123', staffId: 't06' },  // Sreejith Mohan · Master Detailer
  ];
  const clients = () => D.customers.map((c) => ({ id: c.id, role: 'client', login: c.id.toLowerCase(), email: c.email.toLowerCase(), password: CLIENT_PASSWORD, custId: c.id }));
  const staffTitle = (a) => (a.role === 'owner' ? 'Owner' : `${cap(a.role)} · ${D.staffById[a.staffId].role}`);
  const firstName = (c) => (c.kind === 'fleet' ? c.name : c.name.replace(/^(Dr|Mr|Ms|Mrs)\.?\s+/i, '').split(' ')[0]);

  /* kind: 'staff' | 'client'. Matches on email or username/customer ID; the password must match exactly. */
  function authenticate(kind, ident, pw) {
    const id = String(ident || '').trim().toLowerCase();
    if (!id || !pw) return null;
    const acc = (kind === 'staff' ? STAFF : clients()).find((a) => a.email === id || a.login === id);
    return acc && acc.password === pw ? acc : null;
  }

  /* ---------- session (per tab; only the account id is stored, everything else is looked up again) ---------- */
  const KEY = 'bm.session';
  const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } };
  const persist = (s) => { try { if (s) sessionStorage.setItem(KEY, JSON.stringify({ kind: s.kind, id: s.acc.id })); else sessionStorage.removeItem(KEY); } catch (e) { /* private mode */ } };
  let session = null;   // { kind, acc, title }

  A.isStaff = () => !!session && session.kind === 'staff';
  A.isClient = () => !!session && session.kind === 'client';
  A.role = () => (session ? session.acc.role : null);
  A.user = () => {
    if (session && session.kind === 'client') { const c = D.custById[session.acc.custId]; return { name: c.name, first: firstName(c), title: session.title, role: 'client', custId: c.id }; }
    const m = D.me;
    return { name: m.name, first: m.name.split(' ')[0], title: session ? session.title : m.role, role: session ? session.acc.role : null };
  };

  /* ---------- screens ---------- */
  const SCREENS = { auth: '#auth', portal: '#portal', erp: '#app' };
  const show = (name) => Object.entries(SCREENS).forEach(([k, sel]) => { $(sel).hidden = k !== name; });
  const clearHash = () => { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; } };

  const clearToasts = () => { const t = $('#toasts'); if (t) t.innerHTML = ''; };

  function enter(acc, kind) {
    session = { kind, acc, title: kind === 'staff' ? staffTitle(acc) : 'Customer · ' + acc.custId };
    persist(session);
    clearToasts();
    $('#auth').innerHTML = '';
    if (kind === 'staff') {
      D.me = D.staffById[acc.staffId];
      show('erp'); BM.erp.start();
    } else {
      show('portal'); BM.portal.mount(acc.custId);
    }
    window.scrollTo(0, 0);
  }

  A.signOut = () => {
    if (!session) return;
    const kind = session.kind;
    if (kind === 'staff') BM.erp.stop(); else BM.portal.unmount();
    session = null; persist(null); clearHash();
    ui.drawer.close(true); ui.modal.close(true);
    loginKind = kind;
    showLogin();
    clearToasts();
    ui.toast('You have been signed out', { sub: 'See you soon.', icon: 'logout' });
  };

  /* returns true when the credentials were accepted */
  A.signIn = (kind, ident, pw) => {
    const acc = authenticate(kind, ident, pw);
    if (!acc || (kind === 'staff' && !D.staffById[acc.staffId])) return false;
    enter(acc, kind);
    return true;
  };

  /* ---------- sign-in screen ---------- */
  let loginKind = 'client';   // which tab is open

  /* a few customers worth trying: one per live stage, plus one with nothing in the studio */
  function demoRows() {
    if (loginKind === 'staff') {
      return STAFF.map((a) => ({ id: a.id, name: D.staffById[a.staffId].name, sub: `${staffTitle(a)} · ${a.login} / ${a.password}`, login: a.login, password: a.password }));
    }
    const live = D.jobs.filter((j) => j.status !== 'delivered'), used = new Set(), rows = [];
    ['progress', 'qc', 'ready'].forEach((st) => {
      const j = live.find((x) => x.status === st && !used.has(x.custId));
      if (!j) return;
      used.add(j.custId);
      const c = D.custById[j.custId], v = D.vehById[j.vehId];
      rows.push({ id: c.id, name: c.name, sub: `${v.make} ${v.model} · ${D.statusById[j.status].label}`, login: c.email, password: CLIENT_PASSWORD });
    });
    const idle = D.customers.find((c) => c.kind !== 'fleet' && !live.some((j) => j.custId === c.id) && !used.has(c.id));
    if (idle) rows.push({ id: idle.id, name: idle.name, sub: 'Nothing in the studio right now', login: idle.email, password: CLIENT_PASSWORD });
    return rows;
  }

  const POINTS = [
    ['activity', 'Live stage tracking', 'See exactly where your vehicle is, from check-in to handover.'],
    ['clock', 'Estimated ready time', 'Know when to collect — updated as the work progresses.'],
    ['phone', 'A direct line to your studio', 'Call the branch looking after your vehicle in one tap.'],
  ];

  function loginHTML() {
    const staff = loginKind === 'staff', rows = A.SHOW_DEMO_ACCOUNTS ? demoRows() : [];
    return `
    <aside class="auth-brand">
      <div class="checker" aria-hidden="true"></div>
      <div class="brand"><div class="logo-mark"><span>BM</span></div><div class="brand-txt"><b>Brite<em>makers</em></b><small>Premium auto detailing</small></div></div>
      <div class="auth-pitch">
        <h2>Detailing. Protection. Perfection.</h2>
        <p>Customers follow their vehicle through every stage of its care. The Britemakers team runs jobs, bays and billing from one workspace.</p>
        <ul class="auth-points">${POINTS.map(([ic, t, s]) => `<li><span class="ic-box">${BM.icon(ic, 17)}</span><div><b>${t}</b><small>${s}</small></div></li>`).join('')}</ul>
      </div>
      <div class="auth-branches">Kottayam &nbsp;·&nbsp; Kochi &nbsp;·&nbsp; Trivandrum</div>
    </aside>
    <main class="auth-main">
      <div class="auth-top">
        <div class="brand"><div class="logo-mark"><span>BM</span></div><div class="brand-txt"><b>Brite<em>makers</em></b><small>Premium auto detailing</small></div></div>
        <button class="btn btn-icon" id="themeBtn" data-action="toggleTheme" aria-label="Toggle theme"></button>
      </div>
      <div class="auth-center">
        <section class="auth-card" id="authCard" aria-labelledby="authTitle">
          <h1 id="authTitle">Sign in</h1>
          <p class="auth-sub">${staff ? 'Team access for owners, admins and workers.' : 'Follow your vehicle’s progress and see your past visits.'}</p>
          <div class="seg auth-seg" role="tablist" aria-label="Account type">
            <button role="tab" aria-selected="${!staff}" class="${staff ? '' : 'on'}" data-action="authTab" data-k="client">Customer</button>
            <button role="tab" aria-selected="${staff}" class="${staff ? 'on' : ''}" data-action="authTab" data-k="staff">Team</button>
          </div>
          <form id="loginForm" novalidate>
            <div class="field"><label for="lgId">${staff ? 'Work email or username' : 'Email or customer ID'}</label><input class="input" id="lgId" name="username" type="text" inputmode="email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="${staff ? 'name@britemakers.example' : 'you@example.com'}"/></div>
            <div class="field"><label for="lgPw">Password</label><div class="pw"><input class="input" id="lgPw" name="password" type="password" autocomplete="current-password" placeholder="Enter your password"/><button type="button" class="pw-t" data-action="togglePw" aria-label="Show password" aria-pressed="false">Show</button></div></div>
            <div class="auth-err" id="lgErr" role="alert" hidden></div>
            <button class="btn btn-primary btn-lg" type="submit">Sign in${BM.icon('arrowR', 17)}</button>
          </form>
          ${rows.length ? `<div class="demo">
            <div class="demo-h"><span>Demo accounts</span><small>${staff ? 'Tap one to fill the form' : `Password for all: <code>${CLIENT_PASSWORD}</code>`}</small></div>
            <div class="demo-list">${rows.map((r) => `<button type="button" class="demo-row" data-action="demoFill" data-id="${esc(r.id)}">${BM.avatar(r.name, 30)}<div class="grow"><b class="ellipsis">${esc(r.name)}</b><small class="ellipsis">${esc(r.sub)}</small></div><span class="use">Use</span></button>`).join('')}</div>
          </div>` : ''}
        </section>
      </div>
      <footer class="auth-foot">
        <p>Trouble signing in? Call your branch — ${D.branches.map((b) => `${esc(b.name)} <a href="tel:${b.phone.replace(/\s+/g, '')}">${esc(b.phone)}</a>`).join(' · ')}</p>
        <p>Demo build · names, vehicles and figures are fictional · sign-in is not real security.</p>
      </footer>
    </main>`;
  }

  function showLogin() {
    show('auth');
    $('#auth').innerHTML = loginHTML();
    document.title = 'Sign in · Britemakers';
    BM.applyTheme();
    const f = $('#lgId'); if (f && matchMedia('(pointer: fine)').matches) f.focus();   // don't pop the keyboard up on phones
  }

  const setErr = (msg) => {
    const e = $('#lgErr'); if (!e) return;
    e.textContent = msg || ''; e.hidden = !msg;
    const c = $('#authCard');
    if (msg && c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
  };

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'loginForm') return;
    e.preventDefault();
    const id = $('#lgId').value, pw = $('#lgPw').value;
    if (!id.trim() || !pw) { setErr(`Enter your ${loginKind === 'staff' ? 'work email or username' : 'email or customer ID'} and password.`); return; }
    if (!A.signIn(loginKind, id, pw)) { setErr('That sign-in doesn’t match our records. Check the details and try again.'); $('#lgPw').select(); }
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'lgId' || e.target.id === 'lgPw') setErr(''); });

  Object.assign(BM.actions, {
    signOut: () => A.signOut(),
    authTab: (el) => { if (el.dataset.k === loginKind) return; loginKind = el.dataset.k; showLogin(); },
    togglePw: (el) => {
      const i = $('#lgPw'), on = i.type === 'password';
      i.type = on ? 'text' : 'password'; el.textContent = on ? 'Hide' : 'Show';
      el.setAttribute('aria-pressed', String(on)); el.setAttribute('aria-label', on ? 'Hide password' : 'Show password'); i.focus();
    },
    demoFill: (el) => {
      const r = demoRows().find((x) => x.id === el.dataset.id); if (!r) return;
      $('#lgId').value = r.login; $('#lgPw').value = r.password; setErr('');
      $('#loginForm button[type="submit"]').focus();
    },
  });

  /* ---------- start-up ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    ui.mountOverlays();
    const s = load(), kind = s && (s.kind === 'staff' || s.kind === 'client') ? s.kind : null;
    const acc = kind && (kind === 'staff' ? STAFF : clients()).find((a) => a.id === s.id);
    if (acc && (kind === 'client' || D.staffById[acc.staffId])) { loginKind = kind; enter(acc, kind); } else showLogin();
  });
})(window.BM);
