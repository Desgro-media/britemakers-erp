/* BRITEMAKERS ERP — UI toolkit: toasts, drawer, modal, dropdowns, command palette, tooltips, shared components */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, num } = BM.util;
  const ui = BM.ui, D = BM.data;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  BM.$ = $; BM.$$ = $$;

  /* ---------- small components ---------- */
  ui.badge = (text, kind = '', nodot = false) => `<span class="badge ${kind} ${nodot ? 'nodot' : ''}">${esc(text)}</span>`;
  ui.statusBadge = (id) => { const s = D.statusById[id]; return `<span class="badge ${s.kind}">${esc(s.label)}</span>`; };
  ui.tier = (t) => `<span class="tier ${t === 'Signature' ? 'sig' : t === 'Gold' ? 'gold' : t === 'Fleet' ? 'fleet' : 'reg'}">${t === 'Signature' ? BM.icon('star', 11) : ''}${esc(t)}</span>`;
  ui.plate = (p) => `<span class="plate-tag">${esc(p)}</span>`;
  ui.svcTag = (id) => { const s = D.svcById[id], c = D.svcCats[s.cat]; return `<span class="tag"><i style="background:${c.color}"></i>${esc(s.name)}</span>`; };
  ui.vehTile = (v) => `<span class="vtile">${BM.car(v.shape, v.color)}</span>`;
  ui.branchTag = (id) => { const b = D.branchById[id]; return b ? `<span class="tag"><i style="background:${b.color}"></i>${esc(b.name)}</span>` : ''; };
  ui.delta = (pct, cap = '') => `<span class="delta ${pct >= 0 ? 'up' : 'down'}">${BM.icon(pct >= 0 ? 'up' : 'dn', 13)}${Math.abs(pct).toFixed(1)}%</span>${cap ? `<span class="delta-cap">${esc(cap)}</span>` : ''}`;
  ui.header = ({ eyebrow, title, sub, actions = '' }) => `<div class="ph"><div><div class="ph-eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div><div class="ph-actions">${actions}</div></div>`;
  ui.kpi = ({ icon, label, count, fmt = 'inrC', suffix = '', delta, cap, spark, ring, html }) => `
    <div class="card kpi hover">
      <div class="kpi-top"><div class="kpi-l"><span class="kpi-ico">${BM.icon(icon, 16)}</span>${esc(label)}</div>${delta != null ? ui.delta(delta) : ''}</div>
      <div class="kpi-f"><div class="kpi-v">${html != null ? html : `<span data-count="${count}" data-fmt="${fmt}">0</span>${suffix ? `<small>${esc(suffix)}</small>` : ''}`}</div>${spark || ring || ''}</div>
      ${cap ? `<div class="delta-cap">${esc(cap)}</div>` : ''}
    </div>`;
  ui.empty = (icon, text) => `<div class="empty">${BM.icon(icon, 30)}<div>${esc(text)}</div></div>`;
  ui.field = (label, control, full) => `<div class="field ${full ? 'full' : ''}"><label>${esc(label)}</label>${control}</div>`;
  ui.opts = (arr, sel) => arr.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`; }).join('');

  /* overlay roots (scrim, toasts, tooltip) live outside any screen so sign-in, the client portal and the ERP all share them */
  ui.mountOverlays = () => {
    const o = $('#overlays');
    if (o && !$('#toasts')) o.innerHTML = '<div id="scrim2" class="overlay-scrim" style="pointer-events:none"></div><div id="toasts" aria-live="polite"></div><div id="gtip" class="gtip" role="tooltip"></div>';
  };

  /* ---------- count-up ---------- */
  const FMT = { inr, inrC, num, pct: (v) => v.toFixed(1) + '%', int: (v) => String(Math.round(v)), d1: (v) => v.toFixed(1), d2: (v) => v.toFixed(2) };
  ui.countUp = (root = document) => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    $$('[data-count]', root).forEach((el) => {
      const to = parseFloat(el.dataset.count), f = FMT[el.dataset.fmt] || FMT.num;
      if (reduce || !isFinite(to)) { el.textContent = f(to); return; }
      const t0 = performance.now(), dur = 900;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = f(to * e); if (k < 1) requestAnimationFrame(step); else el.textContent = f(to); };
      requestAnimationFrame(step);
    });
  };

  /* ---------- toasts ---------- */
  ui.toast = (msg, o = {}) => {
    const box = $('#toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (o.kind || '');
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="t-ic">${BM.icon(o.icon || (o.kind === 'bad' ? 'alert' : 'check'), 16)}</span><div class="grow"><span class="tm"></span>${o.sub ? '<small class="ts"></small>' : ''}</div>`;
    el.querySelector('.tm').textContent = msg; if (o.sub) el.querySelector('.ts').textContent = o.sub;
    box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, o.ms || 3600);
  };

  /* ---------- drawer & modal (shared scrim, Esc closes topmost) ---------- */
  const stack = [];
  const scrim = () => $('#scrim2');
  const syncScrim = () => { const s = scrim(); if (!s) return; s.classList.toggle('on', stack.length > 0); s.style.pointerEvents = stack.length ? 'auto' : 'none'; document.body.style.overflow = stack.length ? 'hidden' : ''; };
  function mkPanel(kind) {
    const api = {
      el: null,
      open(o) {
        api.close(true);
        const el = document.createElement('div');
        el.className = kind + ' ' + (o.size ? 'm-' + o.size : '') + ' ' + (o.cls || '');
        el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', o.title || '');
        el.innerHTML = `${o.title ? `<div class="drawer-h">${o.lead || ''}<div class="grow"><h3>${esc(o.title)}</h3>${o.sub ? `<p>${o.sub}</p>` : ''}</div>${o.headRight || ''}<button class="btn btn-ghost btn-icon btn-sm" data-action="closePanel" aria-label="Close">${BM.icon('x', 18)}</button></div>` : ''}<div class="drawer-b">${o.body || ''}</div>${o.footer ? `<div class="drawer-f">${o.footer}</div>` : ''}`;
        $('#overlays').appendChild(el); api.el = el; stack.push(api); syncScrim();
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
        ui.countUp(el);
        if (o.onMount) o.onMount(el);
        const f = el.querySelector('[autofocus],input,select,textarea'); if (f && kind === 'modal') setTimeout(() => f.focus(), 120);
        return el;
      },
      close(quick) {
        if (!api.el) return;
        const el = api.el; api.el = null;
        const i = stack.indexOf(api); if (i > -1) stack.splice(i, 1);
        syncScrim(); el.classList.remove('on');
        setTimeout(() => el.remove(), quick ? 0 : 380);
      },
    };
    return api;
  }
  ui.drawer = mkPanel('drawer');
  ui.modal = mkPanel('modal');
  ui.closeTop = () => { const t = stack[stack.length - 1]; if (t) { t.close(); return true; } return false; };
  BM.actions.closePanel = (el) => { const p = el.closest('.drawer,.modal'); if (p === (ui.modal.el)) ui.modal.close(); else if (p === ui.drawer.el) ui.drawer.close(); else ui.closeTop(); };

  /* ---------- global tooltip for [data-tip="title|value|sub"] ---------- */
  let gtip;
  document.addEventListener('pointermove', (e) => {
    if (!gtip) gtip = $('#gtip'); if (!gtip) return;
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { gtip.classList.remove('on'); return; }
    const [a, b, c] = t.dataset.tip.split('|');
    gtip.textContent = '';
    const d1 = document.createElement('div'); d1.className = 'tip-t'; d1.textContent = a;
    const d2 = document.createElement('div'); d2.className = 'tip-r'; const v = document.createElement('b'); v.textContent = b || ''; v.style.fontSize = '15px'; d2.appendChild(v);
    gtip.append(d1, d2);
    if (c) { const d3 = document.createElement('div'); d3.className = 'tip-sub'; d3.textContent = c; gtip.appendChild(d3); }
    gtip.classList.add('on');
    const w = gtip.offsetWidth, h = gtip.offsetHeight;
    let x = e.clientX + 16, y = e.clientY + 16;
    if (x + w > innerWidth - 8) x = e.clientX - w - 16; if (y + h > innerHeight - 8) y = e.clientY - h - 16;
    gtip.style.left = x + 'px'; gtip.style.top = y + 'px';
  });

  /* ---------- dropdowns ---------- */
  document.addEventListener('click', (e) => {
    const trig = e.target.closest('[data-dd]');
    $$('.dd.open').forEach((d) => { if (!trig || !d.contains(trig)) d.classList.remove('open'); });
    if (trig) { const dd = trig.closest('.dd'); dd.classList.toggle('open'); }
    else if (e.target.closest('.dd-panel [data-action]')) $$('.dd.open').forEach((d) => d.classList.remove('open'));
  });

  /* ---------- global click actions ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const fn = BM.actions[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  Object.assign(BM.actions, {
    go: (el) => { ui.drawer.close(true); ui.modal.close(true); ui.cmdk.close(); location.hash = el.dataset.href; },
    toast: (el) => ui.toast(el.dataset.msg, { sub: el.dataset.sub, icon: el.dataset.icon, kind: el.dataset.kind }),
    openCmdk: () => ui.cmdk.open(),
  });

  /* ---------- command palette ---------- */
  const cmdk = {
    el: null, sel: 0, items: [],
    open() {
      if (cmdk.el || !BM.auth.isStaff()) return;   // the palette searches every customer, job and invoice — staff only
      const el = document.createElement('div'); el.className = 'cmdk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Command palette');
      el.innerHTML = `<div class="cmdk-in">${BM.icon('search', 20)}<input type="text" placeholder="Search customers, job cards, invoices — or jump anywhere" aria-label="Search"/><span class="kbd">Esc</span></div><div class="cmdk-list"></div><div class="cmdk-f"><span>↑↓ navigate</span><span>↵ open</span><span>Esc close</span></div>`;
      $('#overlays').appendChild(el); cmdk.el = el; stack.push(cmdk); syncScrim();
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
      const inp = el.querySelector('input'); inp.focus();
      inp.addEventListener('input', () => cmdk.render(inp.value));
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); cmdk.move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); cmdk.move(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); cmdk.run(cmdk.sel); }
      });
      el.addEventListener('click', (e) => { const i = e.target.closest('.cmdk-i'); if (i) cmdk.run(+i.dataset.i); });
      el.addEventListener('pointermove', (e) => { const i = e.target.closest('.cmdk-i'); if (i && +i.dataset.i !== cmdk.sel) { cmdk.sel = +i.dataset.i; cmdk.paintSel(); } });
      cmdk.render('');
    },
    close() {
      if (!cmdk.el) return; const el = cmdk.el; cmdk.el = null;
      const i = stack.indexOf(cmdk); if (i > -1) stack.splice(i, 1); syncScrim();
      el.classList.remove('on'); setTimeout(() => el.remove(), 250);
    },
    build(q) {
      q = q.trim().toLowerCase(); const out = [];
      const go = (href) => () => { location.hash = href; };
      const pages = (BM.nav || []).flatMap((g) => g.items).map((n) => ({ g: 'Go to', icon: n.icon, t: n.label, s: n.desc || '', run: go(n.href) }));
      const actions = [
        { g: 'Quick actions', icon: 'plus', t: 'New job card', s: 'Check in a vehicle', run: () => BM.actions.newJob && BM.actions.newJob() },
        { g: 'Quick actions', icon: 'userPlus', t: 'Add customer', s: 'Create a profile', run: () => BM.actions.newCustomer && BM.actions.newCustomer() },
        { g: 'Quick actions', icon: 'target', t: 'Add lead', s: 'Log an enquiry', run: () => BM.actions.newLead && BM.actions.newLead() },
        { g: 'Quick actions', icon: 'moon', t: 'Toggle light / dark theme', s: '', run: () => BM.actions.toggleTheme && BM.actions.toggleTheme() },
        ...D.branches.map((b) => ({ g: 'Switch branch', icon: 'pin', t: `View ${b.name} only`, s: b.code, run: () => BM.setBranch(b.id) })),
        { g: 'Switch branch', icon: 'pin', t: 'View all branches', s: 'Network', run: () => BM.setBranch('all') },
      ];
      const match = (x) => !q || (x.t + ' ' + x.s).toLowerCase().includes(q);
      if (!q) { out.push(...pages.slice(0, 8), ...actions.slice(0, 4)); return out; }
      out.push(...pages.filter(match).slice(0, 4), ...actions.filter(match).slice(0, 4));
      D.customers.forEach((c) => { const plates = c.vehicles.map((v) => v.plate).join(' '); if ((c.name + ' ' + plates + ' ' + c.vehicles.map((v) => v.make + ' ' + v.model).join(' ')).toLowerCase().includes(q)) out.push({ g: 'Customers', icon: 'users', t: c.name, s: c.vehicles[0].make + ' ' + c.vehicles[0].model + ' · ' + c.city, run: () => BM.actions.openCustomer && BM.actions.openCustomer({ dataset: { id: c.id } }) }); });
      D.jobs.forEach((j) => { const v = D.vehById[j.vehId]; if ((j.id + ' ' + v.plate + ' ' + v.make + ' ' + v.model).toLowerCase().includes(q)) out.push({ g: 'Job cards', icon: 'jobs', t: `${j.id} · ${v.make} ${v.model}`, s: D.statusById[j.status].label, run: () => BM.actions.openJob && BM.actions.openJob({ dataset: { id: j.id } }) }); });
      D.invoices.slice(0, 80).forEach((i) => { if (i.id.toLowerCase().includes(q) || D.custById[i.custId].name.toLowerCase().includes(q)) out.push({ g: 'Invoices', icon: 'receipt', t: `${i.id} · ${D.custById[i.custId].name}`, s: inr(i.total), run: () => BM.actions.openInvoice && BM.actions.openInvoice({ dataset: { id: i.id } }) }); });
      return out.slice(0, 14);
    },
    render(q) {
      cmdk.items = cmdk.build(q); cmdk.sel = 0;
      let last = '', html = '';
      cmdk.items.forEach((it, i) => { if (it.g !== last) { html += `<div class="cmdk-g">${esc(it.g)}</div>`; last = it.g; } html += `<div class="cmdk-i ${i === 0 ? 'sel' : ''}" data-i="${i}">${BM.icon(it.icon, 18)}<span>${esc(it.t)}</span><small>${esc(it.s)}</small></div>`; });
      cmdk.el.querySelector('.cmdk-list').innerHTML = html || `<div class="empty">No results for “${esc(q)}”</div>`;
    },
    move(d) { if (!cmdk.items.length) return; cmdk.sel = (cmdk.sel + d + cmdk.items.length) % cmdk.items.length; cmdk.paintSel(); const s = cmdk.el.querySelector('.cmdk-i.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); },
    paintSel() { cmdk.el.querySelectorAll('.cmdk-i').forEach((n) => n.classList.toggle('sel', +n.dataset.i === cmdk.sel)); },
    run(i) { const it = cmdk.items[i]; if (!it) return; cmdk.close(); setTimeout(it.run, 60); },
  };
  ui.cmdk = cmdk;

  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    const staff = BM.auth.isStaff();
    if (staff && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.el ? cmdk.close() : cmdk.open(); }
    else if (staff && e.key === '/' && !typing && !cmdk.el) { e.preventDefault(); cmdk.open(); }
    else if (e.key === 'Escape') { if (!ui.closeTop()) $$('.dd.open').forEach((d) => d.classList.remove('open')); }
  });
  document.addEventListener('click', (e) => { if (e.target.id === 'scrim2') ui.closeTop(); });
})(window.BM);
