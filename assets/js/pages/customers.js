/* Customers — CRM, vehicles, history */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, fmtDate, fmtDateS, fmtDateY, relTime } = BM.util;
  const D = BM.data, ui = BM.ui, S = BM.state, $ = BM.$;
  let q = '', tier = 'All', sort = 'ltv';

  const list = () => {
    let l = BM.sel.customers().filter((c) => (tier === 'All' || c.tier === tier) && (!q || (c.name + c.city + c.vehicles.map((v) => v.plate + v.make + v.model).join(' ')).toLowerCase().includes(q)));
    const by = { ltv: (a, b) => b.ltv - a.ltv, recent: (a, b) => (b.last || 0) - (a.last || 0), name: (a, b) => a.name.localeCompare(b.name), visits: (a, b) => b.visits - a.visits }[sort];
    return l.sort(by);
  };
  const rows = (l) => l.map((c) => `<tr class="click" data-action="openCustomer" data-id="${c.id}">
    <td><div class="cell">${BM.avatar(c.name, 40)}<div style="min-width:0"><b class="ellipsis">${esc(c.name)}</b><small>${esc(c.city)}${c.kind === 'fleet' ? ' · Corporate' : ''}</small></div></div></td>
    <td><div class="cell">${c.vehicles.slice(0, 2).map(ui.vehTile).join('')}${c.vehicles.length > 2 ? `<span class="tag">+${c.vehicles.length - 2}</span>` : ''}<div style="min-width:0"><b class="ellipsis">${esc(c.vehicles[0].make)} ${esc(c.vehicles[0].model)}</b><small>${esc(c.vehicles[0].plate)}</small></div></div></td>
    <td>${ui.tier(c.tier)}</td><td class="num">${c.visits}</td><td class="nowrap">${c.last ? fmtDateS(c.last) : '—'}</td><td class="r num"><b>${inr(c.ltv)}</b></td><td class="r chev">${BM.icon('right', 16)}</td></tr>`).join('');

  BM.pages.customers = {
    title: 'Customers',
    render() {
      const all = BM.sel.customers(), avg = all.reduce((t, c) => t + c.ltv, 0) / (all.length || 1);
      const counts = (t) => (t === 'All' ? all.length : all.filter((c) => c.tier === t).length);
      return `${ui.header({ eyebrow: 'Customers', title: 'Customer Hub', sub: 'Every owner, every vehicle, every visit — with lifetime value, tier and care-plan status in one place.', actions: `<button class="btn" data-action="toast" data-msg="Customer export started" data-sub="demo-customers.csv" data-icon="download">${BM.icon('download', 16)}Export</button><button class="btn btn-primary" data-action="newCustomer">${BM.icon('userPlus', 17)}Add customer</button>` })}
      <div class="stat-row">
        <div class="card stat"><small>Customer profiles</small><b data-count="18426" data-fmt="num">0</b><span style="color:var(--ok-ink)">+212 this month</span></div>
        <div class="card stat"><small>Repeat customers</small><b>43%</b><span>came back within 12 months</span></div>
        <div class="card stat"><small>Avg. lifetime value</small><b>${inrC(avg)}</b><span>across ${all.length} key accounts</span></div>
        <div class="card stat"><small>Net promoter score</small><b>71</b><span>from post-delivery surveys</span></div>
      </div>
      <div class="filters"><div class="search">${BM.icon('search', 17)}<input class="input" id="cq" type="search" placeholder="Search name, plate, vehicle, city…" value="${esc(q)}" aria-label="Search customers"/></div>
        <div class="chips" id="cTier">${['All', 'Signature', 'Gold', 'Regular', 'Fleet'].map((t) => `<button class="chip-btn ${tier === t ? 'on' : ''}" data-action="custTier" data-t="${t}">${t} <small>${counts(t)}</small></button>`).join('')}</div>
        <select class="select" id="cs" style="margin-left:auto" aria-label="Sort">${ui.opts([['ltv', 'Sort: Lifetime value'], ['recent', 'Sort: Last visit'], ['visits', 'Sort: Visits'], ['name', 'Sort: Name']], sort)}</select></div>
      <div class="card flush"><div class="table-wrap"><table class="tbl"><thead><tr><th>Customer</th><th>Vehicles</th><th>Tier</th><th>Visits</th><th>Last visit</th><th class="r">Lifetime value</th><th></th></tr></thead><tbody id="cBody"></tbody></table></div><div class="tbl-foot"><span id="cCount"></span><span>Demo dataset · fictional customers</span></div></div>`;
    },
    mount() {
      const paint = () => { const l = list(); $('#cBody').innerHTML = rows(l) || `<tr><td colspan="7">${ui.empty('users', 'No customers match your search')}</td></tr>`; $('#cCount').textContent = `Showing ${l.length} of 18,426 profiles`; };
      paint();
      $('#cq').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); paint(); });
      $('#cs').addEventListener('change', (e) => { sort = e.target.value; paint(); });
      BM.actions.custTier = (el) => { tier = el.dataset.t; BM.$$('#cTier .chip-btn').forEach((b) => b.classList.toggle('on', b.dataset.t === tier)); paint(); };
    },
  };

  function drawer(c) {
    const ws = D.warranties.filter((w) => w.custId === c.id);
    const avg = c.visits ? c.ltv / c.visits : 0;
    return `
      <div class="row" style="gap:8px;margin-bottom:18px;flex-wrap:wrap"><button class="btn btn-sm" data-action="toast" data-msg="Calling ${esc(c.name)}…" data-icon="phone">${BM.icon('phone', 15)}Call</button><button class="btn btn-sm" data-action="toast" data-msg="WhatsApp chat opened" data-sub="${esc(c.name)}" data-icon="chat">${BM.icon('chat', 15)}WhatsApp</button><button class="btn btn-sm" data-action="toast" data-msg="Email draft opened" data-icon="mail">${BM.icon('mail', 15)}Email</button></div>
      <div class="mini-kpis"><div><small>Lifetime value</small><b>${inrC(c.ltv)}</b></div><div><small>Visits</small><b>${c.visits}</b></div><div><small>Avg. ticket</small><b>${inrC(avg)}</b></div></div>
      <div class="kv"><div><small>Customer since</small><b>${fmtDateY(c.since)}</b></div><div><small>Home branch</small>${ui.branchTag(c.branch)}</div><div><small>Phone</small><b>${esc(c.phone)}</b></div><div><small>Email</small><b class="ellipsis" style="display:block">${esc(c.email)}</b></div><div><small>City</small><b>${esc(c.city)}</b></div><div><small>Satisfaction</small><b>${c.nps}/10 ${BM.icon('thumbs', 14)}</b></div></div>
      <div class="row wrap" style="margin-top:14px;gap:6px">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="sec-t">Vehicles · ${c.vehicles.length}</div>
      <div class="stack" style="gap:10px">${c.vehicles.map((v) => `<div class="card" style="background:var(--surface-2);box-shadow:none;padding:12px 14px"><div class="row" style="gap:14px"><div style="width:96px;flex:none">${BM.car(v.shape, v.color)}</div><div class="grow"><b>${esc(v.make)} ${esc(v.model)}</b><div class="muted" style="font-size:12px;margin:2px 0 6px">${esc(v.colorName)} · ${v.year}</div>${ui.plate(v.plate)}</div><button class="btn btn-sm btn-soft" data-action="newJobFor" data-c="${c.id}" data-v="${v.id}">${BM.icon('plus', 14)}Job</button></div></div>`).join('')}</div>
      ${ws.length ? `<div class="sec-t">Coatings &amp; warranties · ${ws.length}</div><div class="stack" style="gap:8px">${ws.slice(0, 4).map((w) => `<div class="row between"><div class="cell">${BM.icon('shield', 18)}<div><b>${esc(D.svcById[w.svcId].name)}</b><small>${esc(D.vehById[w.vehId].make)} ${esc(D.vehById[w.vehId].model)} · valid to ${fmtDateY(w.expiry)}</small></div></div>${w.status === 'due' ? ui.badge('Check-up due', 'warn') : w.status === 'claim' ? ui.badge('Claim open', 'bad') : ui.badge('Active', 'ok')}</div>`).join('')}</div>` : ''}
      <div class="sec-t">Visit history</div>
      <div class="tl">${c.history.slice(0, 6).map((h) => `<div class="tl-i"><div class="row between"><b>${h.svcs.map((s) => D.svcById[s].name).join(' + ')}</b><b class="num">${inr(h.amount)}</b></div><small>${fmtDateY(h.date)} · ${esc(D.vehById[h.vehicleId].make)} ${esc(D.vehById[h.vehicleId].model)} · ${esc(D.branchById[h.branch].name)}</small></div>`).join('') || '<div class="muted">No visits yet — first job card will appear here.</div>'}</div>
      <div class="sec-t">Notes</div><p class="t2">${esc(c.notes)}</p>`;
  }

  Object.assign(BM.actions, {
    openCustomer: (el) => {
      const c = D.custById[el.dataset.id]; if (!c) return;
      ui.drawer.open({ title: c.name, lead: BM.avatar(c.name, 48), sub: `${ui.tier(c.tier)} &nbsp;·&nbsp; ${esc(c.city)}`, body: drawer(c), footer: `<button class="btn btn-primary" data-action="newJobFor" data-c="${c.id}" data-v="${c.vehicles[0].id}">${BM.icon('plus', 16)}New job card</button><button class="btn" data-action="toast" data-msg="Quote sent to ${esc(c.name)}" data-icon="send">${BM.icon('send', 16)}Send quote</button>` });
    },
    newJobFor: (el) => { ui.drawer.close(true); BM.actions.newJob({ custId: el.dataset.c, vehId: el.dataset.v }); },
    newCustomer: () => {
      ui.modal.open({
        title: 'Add customer', sub: 'Create a profile and their first vehicle', size: 'lg',
        body: `<form class="form-grid" autocomplete="off">
          ${ui.field('Full name', '<input class="input" id="ncN" placeholder="e.g. Anita Joseph" autofocus/>')}${ui.field('Phone', '<input class="input" id="ncP" placeholder="+91 …" inputmode="tel"/>')}
          ${ui.field('City', `<select class="select" id="ncC">${ui.opts(['Kottayam', 'Kochi', 'Trivandrum', 'Alappuzha', 'Thrissur', 'Kollam', 'Pathanamthitta'], 'Kochi')}</select>`)}${ui.field('Email', '<input class="input" id="ncE" type="email" placeholder="name@example.com"/>')}
          ${ui.field('Vehicle make', '<input class="input" id="ncMk" placeholder="e.g. Toyota"/>')}${ui.field('Vehicle model', '<input class="input" id="ncMd" placeholder="e.g. Fortuner"/>')}
          ${ui.field('Vehicle class', `<select class="select" id="ncCl">${ui.opts(['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Bike'], 'SUV')}</select>`)}${ui.field('Registration no.', '<input class="input" id="ncR" placeholder="KL 07 AB 1234"/>')}
        </form>`,
        footer: `<button class="btn btn-primary" data-action="ncSave">${BM.icon('check', 16)}Save customer</button><button class="btn btn-ghost" data-action="closePanel">Cancel</button>`,
      });
    },
    ncSave: () => {
      const m = ui.modal.el, v = (s) => m.querySelector(s).value.trim();
      if (!v('#ncN')) { ui.toast('Please enter a name', { kind: 'bad', icon: 'alert' }); return; }
      const cl = v('#ncCl'), shape = { Hatchback: 'hatch', Sedan: 'sedan', SUV: 'suv', Luxury: 'suv', Bike: 'bike' }[cl], tierN = { Hatchback: 0, Sedan: 1, SUV: 2, Luxury: 3, Bike: 1 }[cl];
      const id = 'C-' + (2001 + D.customers.length), city = v('#ncC');
      const cityB = { Kottayam: 'ktym', Alappuzha: 'ktym', Pathanamthitta: 'ktym', Kochi: 'kochi', Thrissur: 'kochi', Trivandrum: 'tvm', Kollam: 'tvm' }[city];
      const veh = { id: 'V-' + (1000 + Object.keys(D.vehById).length), custId: id, make: v('#ncMk') || 'Unknown', model: v('#ncMd') || 'Vehicle', cls: cl, shape, tier: tierN, plate: v('#ncR').toUpperCase() || 'KL 00 XX 0000', color: '#8a8f98', colorName: 'Silver', year: 2024, bike: cl === 'Bike' };
      const c = { id, name: v('#ncN'), city, branch: cityB, kind: 'person', tier: 'Regular', vehicles: [veh], history: [], ltv: 0, visits: 0, last: null, phone: v('#ncP') || '+91 •••• ••••••', email: v('#ncE') || 'not-provided@example.com', tags: ['New'], nps: 9, since: new Date(), notes: 'Added from the ERP.' };
      D.customers.unshift(c); D.custById[id] = c; D.vehById[veh.id] = veh;
      ui.modal.close(); ui.toast('Customer added', { sub: `${c.name} · ${veh.make} ${veh.model}`, icon: 'userPlus' });
      if (location.hash === '#/customers') BM.refresh(); else location.hash = '#/customers';
    },
  });
})(window.BM);
