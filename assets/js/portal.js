/* BRITEMAKERS — client portal: what a customer sees after signing in.
   It only ever reads the signed-in customer's own jobs, vehicles and invoices — never the ERP, other
   customers, margins or internal notes. */
(function (BM) {
  'use strict';
  const { esc, inr, fmtTime, fmtDateS, until } = BM.util;
  const D = BM.data, ui = BM.ui, $ = BM.$;
  const P = BM.portal = {};
  let custId = null;

  /* customer-facing stages — "Delivered" is the hand-over itself, so it is never an active stage */
  const TRACK = [['checkin', 'Received'], ['inspection', 'Inspection'], ['progress', 'In progress'], ['qc', 'Quality check'], ['ready', 'Ready for pickup']];

  const tel = (b) => 'tel:' + b.phone.replace(/\s+/g, '');
  const day = (d) => {
    const a = new Date(d); a.setHours(0, 0, 0, 0);
    const n = Math.round((a - D.TODAY) / 864e5);
    return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : a.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  function eta(j, b) {
    if (j.status === 'ready') return { k: 'Status', v: 'Ready for pickup', s: `Open ${b.hours}` };
    if (j.eta.getTime() <= Date.now()) return { k: 'Estimated ready', v: 'Finishing up', s: 'Almost there' };
    return { k: 'Estimated ready', v: `${day(j.eta)}, ${fmtTime(j.eta)}`, s: until(j.eta) };
  }

  function tracker(j) {
    const idx = j.status === 'ready' ? TRACK.length : TRACK.findIndex((t) => t[0] === j.status);   // ready = every stage complete
    return `<div class="stepper" role="list" aria-label="Job stages">${TRACK.map(([, label], i) => `<div class="step ${i < idx ? 'done' : i === idx ? 'now' : ''}" role="listitem"${i === idx ? ' aria-current="step"' : ''}><i>${i < idx ? BM.icon('check', 12) : i + 1}</i><span>${label}</span></div>`).join('')}</div>`;
  }

  /* the work checklist the technicians tick off, read-only; "now" only applies while a vehicle is on the bay */
  function steps(j) {
    const items = D.checklistFor(j), chk = BM.jobChecks(j);
    const now = j.status === 'progress' || j.status === 'qc' ? chk.findIndex((c) => !c) : -1;
    return {
      now, items, done: chk.filter(Boolean).length,
      html: `<ol class="ws">${items.map((t, i) => { const st = chk[i] ? 'done' : i === now ? 'now' : ''; return `<li class="${st}"><i>${chk[i] ? BM.icon('check', 12) : ''}</i><span>${esc(t)}</span>${st === 'now' ? '<em>Current step</em>' : ''}</li>`; }).join('')}</ol>`,
    };
  }

  function note(j, s, b) {
    switch (j.status) {
      case 'checkin': return { ic: 'clock', t: `Received at ${b.name}`, p: 'Your vehicle is checked in and waiting for its pre-work inspection.' };
      case 'inspection': return { ic: 'eye', t: 'Inspection under way', p: 'We are documenting your vehicle’s condition before any work begins.' };
      case 'progress': return { ic: 'wrench', t: 'Work is under way', p: `${j.bay ? `On Bay ${j.bay}. ` : ''}${s.now > -1 ? `Current step: ${s.items[s.now]}.` : 'Finishing the last steps.'}` };
      case 'qc': return { ic: 'shield', t: 'Final quality check', p: 'The work is done. We are inspecting every panel under studio lights before handover.' };
      default: return { ic: 'check', kind: 'ok', t: 'Ready for pickup', p: `Collect your vehicle from ${b.name}. Open ${b.hours}.` };
    }
  }

  const payment = (j) => {
    const sub = D.jobTotal(j), total = sub + Math.round(sub * 0.18), paid = Math.min(total, Math.round(j.advance * 1.18)), due = total - paid;
    return `<div class="stack" style="gap:8px;font-size:13px">
      <div class="row between"><span class="muted">Estimate incl. GST</span><b class="num">${inr(total)}</b></div>
      <div class="row between"><span class="muted">Paid so far</span><span class="num">${inr(paid)}</span></div>
      <div class="row between"><b>Balance due</b>${due > 0 ? `<b class="num">${inr(due)}</b>` : ui.badge('Settled', 'ok')}</div></div>`;
  };
  const team = (j) => j.techs.map((id) => D.staffById[id]).map((t) => `<div class="pt-person">${BM.avatar(t.name, 30)}<div><b>${esc(t.name.split(' ')[0])}</b><small>${esc(t.role)}</small></div></div>`).join('');
  const studio = (b) => `<div class="pt-studio"><b>${BM.icon('pin', 15)}${esc(b.name)} studio</b><small>Open ${esc(b.hours)}</small><a class="btn btn-sm btn-soft" href="${tel(b)}">${BM.icon('phone', 14)}Call ${esc(b.phone)}</a></div>`;
  const timeline = (j) => `<div class="tl">${BM.jobEvents(j).slice().reverse().map((e, i) => `<div class="tl-i ${i ? 'mute' : ''}">${esc(e[0])}<small>${day(e[1])}, ${fmtTime(e[1])}</small></div>`).join('')}</div>`;

  function jobCard(j) {
    const v = D.vehById[j.vehId], b = D.branchById[j.branch], e = eta(j, b), s = steps(j), n = note(j, s, b);
    return `<article class="card jc" aria-label="${esc(v.make)} ${esc(v.model)}">
      <header class="jc-h">
        <div class="jc-t">
          <div class="row wrap" style="gap:8px"><span class="jc-id">${esc(j.id)}</span>${ui.statusBadge(j.status)}</div>
          <h2>${esc(v.make)} ${esc(v.model)}</h2>
          <div class="row wrap" style="gap:8px">${ui.plate(v.plate)}<span class="tag"><i style="background:${esc(v.color)};border:1px solid var(--line-2)"></i>${esc(v.colorName)} · ${v.year}</span>${ui.branchTag(j.branch)}</div>
        </div>
        <div class="jc-eta"><small>${e.k}</small><b>${esc(e.v)}</b><span>${esc(e.s)}</span></div>
      </header>
      <div class="jc-body">
        <div class="jc-main">
          ${tracker(j)}
          <div class="jc-prog"><div class="row between"><b>${j.progress}% complete</b><span class="muted">${s.done} of ${s.items.length} work steps done</span></div><div class="bar ${j.status === 'ready' ? 'ok' : ''}"><i style="width:${j.progress}%"></i></div></div>
          <div class="jc-note ${n.kind || ''}"><span class="ic-box">${BM.icon(n.ic, 17)}</span><div><b>${esc(n.t)}</b><p>${esc(n.p)}</p></div></div>
          <div class="sec-t">Work steps</div>${s.html}
          <div class="sec-t">Updates</div>${timeline(j)}
        </div>
        <aside class="jc-side">
          <div class="sec-t">Services</div><div class="row wrap" style="gap:6px">${j.svcs.map(ui.svcTag).join('')}</div>
          <div class="sec-t">Your team</div><div class="stack" style="gap:10px">${team(j)}</div>
          <div class="sec-t">Studio</div>${studio(b)}
          <div class="sec-t">Payment</div>${payment(j)}
        </aside>
      </div>
    </article>`;
  }

  /* delivered-today jobs first, then the saved service history */
  function visits(c) {
    const rows = [];
    D.jobs.filter((j) => j.custId === c.id && j.status === 'delivered').forEach((j) => rows.push({ date: j.deliveredAt, when: `Delivered today, ${fmtTime(j.deliveredAt)}`, vehId: j.vehId, svcs: j.svcs, branch: j.branch, sub: D.jobTotal(j), inv: D.invoices.find((i) => i.jobId === j.id) }));
    c.history.forEach((h) => rows.push({ date: h.date, when: fmtDateS(h.date), vehId: h.vehicleId, svcs: h.svcs, branch: h.branch, sub: h.amount, inv: D.invoices.find((i) => i.custId === c.id && !i.jobId && +i.date === +h.date && i.vehId === h.vehicleId) }));
    rows.sort((a, b) => b.date - a.date);
    const shown = rows.slice(0, 8);
    return `<section class="card flush pt-visits" aria-labelledby="ptVisits">
      <div class="card-h pad"><div><div class="card-t" id="ptVisits">Previous visits</div><div class="card-s">${rows.length ? `Your latest ${shown.length} of ${rows.length} visits, totals include GST` : 'No visits recorded yet'}</div></div></div>
      ${shown.length ? shown.map((r) => {
        const v = D.vehById[r.vehId], total = r.inv ? r.inv.total : r.sub + Math.round(r.sub * 0.18), st = r.inv && BM.invStatus[r.inv.status];
        return `<div class="visit"><div class="grow"><b class="ellipsis">${esc(r.svcs.map((s) => D.svcById[s].name).join(' + '))}</b><small class="ellipsis">${esc(r.when)} · ${esc(v.make)} ${esc(v.model)} · ${esc(D.branchById[r.branch].name)}</small></div><div class="visit-r"><b class="num">${inr(total)}</b>${st ? ui.badge(st[0], st[1]) : ''}</div></div>`;
      }).join('') : ui.empty('receipt', 'Your completed services will appear here')}
    </section>`;
  }

  function render() {
    const c = D.custById[custId], me = BM.auth.user();
    const live = D.jobs.filter((j) => j.custId === c.id && j.status !== 'delivered').sort((a, b) => a.eta - b.eta), n = live.length;
    const sub = n ? `${n === 1 ? 'Your vehicle is' : `${n} of your vehicles are`} in our studio right now. Each stage updates here as our team completes it.` : 'None of your vehicles are in our studio right now. Your past visits are listed below.';
    return `
    <header class="pt-bar"><div class="pt-bar-in">
      <div class="brand"><div class="logo-mark"><span>BM</span></div><div class="brand-txt"><b>Brite<em>makers</em></b><small>Customer portal</small></div></div>
      <div class="pt-bar-r">
        <button class="btn btn-icon" id="themeBtn" data-action="toggleTheme" aria-label="Toggle theme"></button>
        <div class="pt-user">${BM.avatar(me.name, 30)}<div class="pt-user-t"><b class="ellipsis">${esc(me.name)}</b><small>${esc(c.id)}</small></div></div>
        <button class="btn pt-signout" data-action="signOut" aria-label="Sign out">${BM.icon('logout', 16)}<span class="pt-so">Sign out</span></button>
      </div>
    </div></header>
    <main class="pt-main" id="ptMain" tabindex="-1">
      ${ui.header({ eyebrow: 'Customer portal', title: `Hello, ${me.first}`, sub })}
      ${n ? live.map(jobCard).join('') : `<section class="card pt-empty">${BM.icon('sparkles', 28)}<h2>Nothing in the studio right now</h2><p>When you drop a vehicle off, its live progress will appear on this page.</p></section>`}
      ${visits(c)}
      <footer class="pt-help"><div><b>Questions about your vehicle?</b><span>Call the studio — we’re happy to help.</span></div><div class="pt-help-l">${D.branches.map((b) => `<a class="btn btn-sm" href="${tel(b)}">${BM.icon('phone', 14)}${esc(b.name)} · ${esc(b.phone)}</a>`).join('')}</div></footer>
    </main>`;
  }

  P.mount = (id) => {
    custId = id;
    $('#portal').innerHTML = render();
    BM.applyTheme();   // sets the theme button's icon
    document.title = 'My vehicle · Britemakers';
  };
  P.unmount = () => { custId = null; $('#portal').innerHTML = ''; };
})(window.BM);
