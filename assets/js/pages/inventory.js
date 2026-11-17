/* Inventory — stock, reorder levels, purchase orders */
(function (BM) {
  'use strict';
  const { esc, inr, inrC } = BM.util;
  const D = BM.data, ui = BM.ui, C = BM.charts, S = BM.state, $ = BM.$;
  let cat = 'All', q = '', only = false;
  const CATS = ['All', 'Coatings', 'Film', 'Chemicals', 'Polish', 'Interior', 'Consumables'];
  const KIND = { ok: ['In stock', 'ok'], low: ['Low', 'warn'], critical: ['Critical', 'bad'] };
  D.pos = D.pos || [
    { id: 'PO-2287', supplier: 'Armour Film Co.', items: 'PPF Gloss rolls × 4', value: 472000, eta: '3 days', status: 'In transit' },
    { id: 'PO-2290', supplier: 'NanoShield Distributors', items: 'Ceramic 9H × 30, Graphene kits × 10', value: 154000, eta: '5 days', status: 'Confirmed' },
    { id: 'PO-2291', supplier: 'ShineChem Traders', items: 'PPF slip solution × 12', value: 17400, eta: '2 days', status: 'Awaiting dispatch' },
  ];

  const list = () => D.inventory.filter((i) => (cat === 'All' || i.cat === cat) && (!q || i.name.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q)) && (!only || D.stockStatus(i, S.branch) !== 'ok'));
  const row = (i) => {
    const st = D.stockStatus(i, S.branch), s = D.stockFor(i, S.branch), r = D.reorderFor(i, S.branch), col = st === 'ok' ? 'var(--ok)' : st === 'low' ? 'var(--warn)' : 'var(--bad)';
    const where = S.branch === 'all' ? D.stockWhere(i).map((b) => D.branchById[b].name).join(', ') : '';
    return `<tr><td><b>${esc(i.name)}</b><small class="muted" style="display:block">${i.id} · ${esc(i.supplier)}</small></td><td><span class="tag">${esc(i.cat)}</span></td>
      <td style="min-width:170px"><div class="row between" style="font-size:12.5px;margin-bottom:6px"><b class="num">${s} ${i.unit}</b><span class="muted">min ${r}</span></div><div class="stock-bar"><i style="width:${Math.min(100, (s / (r * 2)) * 100)}%;background:${col}"></i><u style="left:50%"></u></div></td>
      <td>${ui.badge(KIND[st][0], KIND[st][1])}${where ? `<small class="muted" style="display:block;margin-top:4px">at ${esc(where)}</small>` : ''}</td><td class="r num nowrap">${inr(i.cost)}</td><td class="r num nowrap">${inrC(i.cost * s)}</td><td class="num">${i.usage}/wk</td>
      <td class="r"><button class="btn btn-sm ${st === 'ok' ? 'btn-ghost' : 'btn-soft'}" data-action="reorder" data-id="${i.id}">${BM.icon('cart', 14)}Reorder</button></td></tr>`;
  };

  BM.pages.inventory = {
    title: 'Inventory',
    render() {
      const all = D.inventory, low = all.filter((i) => D.stockStatus(i, S.branch) !== 'ok'), val = all.reduce((t, i) => t + i.cost * D.stockFor(i, S.branch), 0);
      return `${ui.header({ eyebrow: 'Commerce', title: 'Inventory', sub: 'Coatings, PPF rolls, films and consumables — tracked per branch with reorder levels and supplier lead times.', actions: `<button class="btn" data-action="toast" data-msg="Stock count sheet generated" data-icon="download">${BM.icon('download', 16)}Stock sheet</button><button class="btn btn-primary" data-action="newPO">${BM.icon('plus', 17)}Create PO</button>` })}
      <div class="stat-row">
        <div class="card stat"><small>Stock value</small><b data-count="${val}" data-fmt="inrC">0</b><span>${all.length} SKUs · ${S.branch === 'all' ? '3 branches' : esc(D.branchById[S.branch].name)}</span></div>
        <div class="card stat"><small>Below reorder level</small><b data-count="${low.length}" data-fmt="int" style="color:${low.length ? 'var(--warn-ink)' : 'inherit'}">0</b><span>${all.filter((i) => D.stockStatus(i, S.branch) === 'critical').length} critical</span></div>
        <div class="card stat"><small>Open purchase orders</small><b>${D.pos.length}</b><span>${inrC(D.pos.reduce((t, p) => t + p.value, 0))} on order</span></div>
        <div class="card stat"><small>Avg. lead time</small><b>3.6 days</b><span>across 4 suppliers</span></div>
      </div>
      <div class="sec-t" style="margin:2px 0 10px">Open purchase orders</div>
      <div class="grid" style="margin-bottom:22px">
        ${D.pos.slice(0, 3).map((p) => `<div class="card c4"><div class="row between"><b>${p.id}</b>${ui.badge(p.status, p.status === 'In transit' ? 'info' : p.status === 'Confirmed' ? 'ok' : 'warn')}</div><div class="muted" style="font-size:12.5px;margin:6px 0 12px;min-height:38px">${esc(p.supplier)}<br/>${esc(p.items)}</div><div class="row between"><b class="num" style="font-size:17px">${inr(p.value)}</b><span class="muted" style="font-size:12px">${BM.icon('truck', 13)} ETA ${p.eta}</span></div></div>`).join('')}
      </div>
      <div class="grid">
        <div class="card c12 flush"><div style="padding:var(--pad) var(--pad) 0"><div class="filters" style="margin-bottom:14px"><div class="search">${BM.icon('search', 17)}<input class="input" id="vq" type="search" placeholder="Search item or supplier…" value="${esc(q)}" aria-label="Search inventory"/></div><div class="chips">${CATS.map((c) => `<button class="chip-btn ${cat === c ? 'on' : ''}" data-action="invCat" data-c="${c}">${c}</button>`).join('')}</div><label class="row" style="margin-left:auto;gap:8px;font-weight:600;font-size:12.5px;cursor:pointer"><span class="switch ${only ? 'on' : ''}" data-action="invOnly" role="switch" aria-checked="${only}" tabindex="0"></span>Low stock only</label></div></div>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Category</th><th>Stock level</th><th>Status</th><th class="r">Unit cost</th><th class="r">Value</th><th>Usage</th><th></th></tr></thead><tbody id="vBody"></tbody></table></div><div class="tbl-foot"><span id="vCount"></span><span>Marker on the bar = reorder level</span></div></div>
      </div>`;
    },
    mount() {
      const paint = () => { const l = list(); $('#vBody').innerHTML = l.map(row).join('') || `<tr><td colspan="8">${ui.empty('package', 'No items match')}</td></tr>`; $('#vCount').textContent = `${l.length} of ${D.inventory.length} items`; };
      paint(); $('#vq').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); paint(); });
    },
  };
  const poModal = (preset) => {
    ui.modal.open({
      title: 'Create purchase order', sub: 'Order stock from a supplier', size: 'lg',
      body: `<form class="form-grid" autocomplete="off">${ui.field('Item', `<select class="select" id="poI">${D.inventory.map((i) => `<option value="${i.id}" ${preset && preset.id === i.id ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select>`)}${ui.field('Quantity', '<input class="input" id="poQ" type="number" min="1" value="6"/>')}${ui.field('Deliver to', `<select class="select" id="poB">${D.branches.map((b) => `<option value="${b.id}" ${b.id === (S.branch === 'all' ? 'kochi' : S.branch) ? 'selected' : ''}>${b.name}</option>`).join('')}</select>`)}${ui.field('Supplier', '<input class="input" id="poS" readonly/>')}
      <div class="full card" style="background:var(--surface-2);box-shadow:none;padding:14px 16px"><div class="row between"><span class="muted">Order value (before GST)</span><b class="num" id="poV" style="font-size:20px">₹0</b></div></div></form>`,
      footer: `<button class="btn btn-primary" data-action="poSave">${BM.icon('check', 16)}Place order</button><button class="btn btn-ghost" data-action="closePanel">Cancel</button>`,
      onMount: (m) => { const upd = () => { const i = D.inventory.find((x) => x.id === m.querySelector('#poI').value); m.querySelector('#poS').value = i.supplier; m.querySelector('#poV').textContent = inr(i.cost * (+m.querySelector('#poQ').value || 0)); }; m.querySelector('#poI').addEventListener('change', upd); m.querySelector('#poQ').addEventListener('input', upd); upd(); },
    });
  };
  Object.assign(BM.actions, {
    invCat: (el) => { cat = el.dataset.c; BM.refresh(); },
    invOnly: () => { only = !only; BM.refresh(); },
    reorder: (el) => poModal(D.inventory.find((i) => i.id === el.dataset.id)),
    newPO: () => poModal(),
    poSave: () => {
      const m = ui.modal.el, i = D.inventory.find((x) => x.id === m.querySelector('#poI').value), qn = +m.querySelector('#poQ').value || 1;
      D.pos.unshift({ id: 'PO-' + (2292 + D.pos.length), supplier: i.supplier, items: `${i.name.split(' · ')[0]} × ${qn}`, value: i.cost * qn, eta: i.lead + ' days', status: 'Awaiting dispatch' });
      ui.modal.close(); ui.toast('Purchase order placed', { sub: `${i.supplier} · ${inr(i.cost * qn)}`, icon: 'package' }); BM.refresh();
    },
  });
})(window.BM);
