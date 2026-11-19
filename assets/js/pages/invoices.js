/* Invoices — billing, GST, payments */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, fmtDate, fmtDateS, fmtDateY } = BM.util;
  const D = BM.data, ui = BM.ui, C = BM.charts, S = BM.state, $ = BM.$;
  let f = 'all', q = '', limit = 16;
  const ST = { paid: ['Paid', 'ok'], partial: ['Partially paid', 'warn'], pending: ['Pending', 'info'], overdue: ['Overdue', 'bad'] };
  BM.invStatus = ST;   // label + badge colour per invoice status, shared with the client portal
  const list = () => BM.sel.invoices().filter((i) => (f === 'all' || i.status === f) && (!q || (i.id + D.custById[i.custId].name + D.vehById[i.vehId].plate).toLowerCase().includes(q)));

  const row = (i) => {
    const c = D.custById[i.custId], v = D.vehById[i.vehId];
    return `<tr class="click" data-action="openInvoice" data-id="${i.id}"><td><b>${i.id}</b><small class="muted" style="display:block">${esc(D.branchById[i.branch].name)}</small></td><td><div class="cell">${BM.avatar(c.name, 32)}<div style="min-width:0"><b class="ellipsis">${esc(c.name)}</b><small>${esc(v.make)} ${esc(v.model)}</small></div></div></td><td class="nowrap">${fmtDateS(i.date)}</td><td class="nowrap">${fmtDateS(i.due)}</td><td class="r num"><b>${inr(i.total)}</b></td><td class="r num">${i.total - i.paid ? `<span style="color:var(--warn-ink)">${inr(i.total - i.paid)}</span>` : '<span class="muted">—</span>'}</td><td>${ui.badge(ST[i.status][0], ST[i.status][1])}</td><td class="muted">${esc(i.method)}</td></tr>`;
  };

  BM.pages.invoices = {
    title: 'Invoices',
    render() {
      const m = D.revenueMTD(), ids = BM.sel.branchIds(), billed = m.cur * 1.18, coll = billed * 0.93, out = billed - coll;
      const all = BM.sel.invoices();
      const counts = (k) => (k === 'all' ? all.length : all.filter((i) => i.status === k).length);
      return `${ui.header({ eyebrow: 'Commerce', title: 'Invoices & Billing', sub: 'GST-ready invoices generated straight from job cards, with UPI, card and cash reconciliation.', actions: `<button class="btn" data-action="toast" data-msg="GSTR-1 export prepared" data-sub="Nov 2026 · demo" data-icon="download">${BM.icon('download', 16)}GST report</button><button class="btn btn-primary" data-action="newInvoice">${BM.icon('plus', 17)}Create invoice</button>` })}
      <div class="stat-row">
        <div class="card stat"><small>Billed · month to date</small><b data-count="${billed}" data-fmt="inrC">0</b><span>incl. GST · ${m.dayN} days</span></div>
        <div class="card stat"><small>Collected</small><b data-count="${coll}" data-fmt="inrC">0</b><span style="color:var(--ok-ink)">93% collection rate</span></div>
        <div class="card stat"><small>Outstanding</small><b data-count="${out}" data-fmt="inrC">0</b><span>${inrC(out * 0.22)} overdue</span></div>
        <div class="card stat"><small>GST payable</small><b data-count="${m.cur * 0.18}" data-fmt="inrC">0</b><span>CGST 9% + SGST 9%</span></div>
      </div>
      <div class="filters"><div class="search">${BM.icon('search', 17)}<input class="input" id="iq" type="search" placeholder="Search invoice, customer, plate…" value="${esc(q)}" aria-label="Search invoices"/></div>
        <div class="chips">${[['all', 'All'], ['paid', 'Paid'], ['partial', 'Partial'], ['pending', 'Pending'], ['overdue', 'Overdue']].map(([k, l]) => `<button class="chip-btn ${f === k ? 'on' : ''}" data-action="invFilter" data-f="${k}">${l} <small>${counts(k)}</small></button>`).join('')}</div></div>
      <div class="card flush"><div class="table-wrap"><table class="tbl"><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Due</th><th class="r">Total</th><th class="r">Balance</th><th>Status</th><th>Method</th></tr></thead><tbody id="iBody"></tbody></table></div><div class="tbl-foot"><span id="iCount"></span><button class="link" id="iMore">Show more</button></div></div>`;
    },
    mount() {
      const paint = () => { const l = list(); $('#iBody').innerHTML = l.slice(0, limit).map(row).join('') || `<tr><td colspan="8">${ui.empty('receipt', 'No invoices match')}</td></tr>`; $('#iCount').textContent = `Showing ${Math.min(limit, l.length)} of ${l.length} invoices · ${inr(l.reduce((t, i) => t + i.total, 0))}`; $('#iMore').style.display = l.length > limit ? '' : 'none'; };
      paint();
      $('#iq').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); limit = 16; paint(); });
      $('#iMore').addEventListener('click', () => { limit += 16; paint(); });
    },
  };

  function invoiceHTML(i) {
    const c = D.custById[i.custId], v = D.vehById[i.vehId], b = D.branchById[i.branch], bal = i.total - i.paid;
    return `<div class="invoice print-area"><div class="inv-bar"></div>
      <div class="row between" style="align-items:flex-start;gap:20px;flex-wrap:wrap"><div><h2>Brite<span style="color:#f25c05">makers</span></h2><div style="color:#6b625a;margin-top:6px;line-height:1.5">Auto Detailing Service · ${esc(b.name)}<br/>Tel ${esc(b.phone)} · GSTIN 32AAAAA0000A1Z5 <i>(demo)</i></div></div>
        <div style="text-align:right"><div style="font-size:11px;letter-spacing:.14em;color:#8a8179;font-weight:700">TAX INVOICE</div><div style="font-size:20px;font-weight:800">${i.id}</div><div style="color:#6b625a">Date ${fmtDateY(i.date)}<br/>Due ${fmtDateY(i.due)}</div></div></div>
      <div class="row between" style="margin-top:24px;gap:20px;flex-wrap:wrap"><div><div style="font-size:10.5px;letter-spacing:.12em;color:#8a8179;font-weight:700">BILL TO</div><b style="font-size:15px">${esc(c.name)}</b><div style="color:#6b625a">${esc(c.city)}, Kerala<br/>${esc(c.phone)}</div></div><div><div style="font-size:10.5px;letter-spacing:.12em;color:#8a8179;font-weight:700">VEHICLE</div><b style="font-size:15px">${esc(v.make)} ${esc(v.model)}</b><div style="color:#6b625a">${esc(v.plate)} · ${esc(v.colorName)}</div></div></div>
      <table><thead><tr><th>Service</th><th class="r">HSN/SAC</th><th class="r">Amount</th></tr></thead><tbody>${i.svcs.map((s) => `<tr><td>${esc(D.svcById[s].name)}</td><td class="r">9987</td><td class="r">${inr(D.priceFor(s, v.tier))}</td></tr>`).join('')}</tbody></table>
      <div class="tot"><div><span>Subtotal</span><span>${inr(i.sub)}</span></div>${i.disc ? `<div><span>Loyalty discount</span><span>− ${inr(i.disc)}</span></div>` : ''}<div><span>CGST 9%</span><span>${inr(i.gst / 2)}</span></div><div><span>SGST 9%</span><span>${inr(i.gst / 2)}</span></div><div class="g"><span>Total</span><span>${inr(i.total)}</span></div><div style="color:#6b625a"><span>Paid · ${esc(i.method)}</span><span>${inr(i.paid)}</span></div><div style="font-weight:800;${bal ? 'color:#c2410a' : 'color:#15803d'}"><span>${bal ? 'Balance due' : 'Settled'}</span><span>${bal ? inr(bal) : '✓'}</span></div></div>
      <div style="margin-top:26px;padding-top:14px;border-top:1px solid #ece7e1;color:#8a8179;font-size:11.5px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap"><span>Thank you for choosing Britemakers. Ride. Made Bright.</span><span>Demo invoice — not for accounting use.</span></div></div>`;
  }
  function openInvoice(id) {
    const i = D.invById[id]; if (!i) return;
    ui.modal.open({
      title: i.id, sub: `${esc(D.custById[i.custId].name)} · ${ui.badge(ST[i.status][0], ST[i.status][1])}`, size: 'lg', body: invoiceHTML(i),
      footer: `${i.total - i.paid ? `<button class="btn btn-primary" data-action="recordPay" data-id="${i.id}">${BM.icon('card', 16)}Record payment</button>` : ''}<button class="btn" onclick="window.print()">${BM.icon('printer', 16)}Print / PDF</button><button class="btn" data-action="toast" data-msg="Invoice sent to ${esc(D.custById[i.custId].name)}" data-sub="WhatsApp · PDF + UPI link" data-icon="chat">${BM.icon('chat', 16)}Send on WhatsApp</button>`,
    });
  }
  BM.createInvoiceFromJob = (j) => {
    let inv = D.invoices.find((x) => x.jobId === j.id);
    if (!inv) {
      const c = D.custById[j.custId], v = D.vehById[j.vehId], sub = D.jobTotal(j), gst = Math.round(sub * 0.18), total = sub + gst, paid = Math.min(total, Math.round(j.advance * 1.18));
      inv = { id: 'INV-26-' + String(Math.max(...D.invoices.map((x) => +x.id.slice(7))) + 1).padStart(4, '0'), date: new Date(), custId: c.id, vehId: v.id, svcs: j.svcs, branch: j.branch, sub, disc: 0, gst, total, paid, status: paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending', method: 'UPI', jobId: j.id, due: D.addDays(new Date(), 7) };
      D.invoices.unshift(inv); D.invById[inv.id] = inv; ui.toast(`Invoice ${inv.id} generated`, { sub: `From ${j.id} · ${inr(inv.total)}`, icon: 'receipt' });
    }
    openInvoice(inv.id);
  };
  Object.assign(BM.actions, {
    invFilter: (el) => { f = el.dataset.f; limit = 16; BM.refresh(); },
    openInvoice: (el) => openInvoice(el.dataset.id),
    recordPay: (el) => { const i = D.invById[el.dataset.id]; i.paid = i.total; i.status = 'paid'; ui.modal.close(true); ui.toast('Payment recorded', { sub: `${i.id} · ${inr(i.total)} via ${i.method}`, icon: 'check' }); BM.refresh(); setTimeout(() => openInvoice(i.id), 60); },
    newInvoice: () => {
      const avail = D.jobs.filter((j) => !D.invoices.some((x) => x.jobId === j.id));
      ui.modal.open({
        title: 'Create invoice', sub: 'Generate a GST invoice from a job card', size: 'sm',
        body: `<div class="field"><label>Job card</label><select class="select" id="niJ">${avail.map((j) => `<option value="${j.id}">${j.id} · ${esc(D.vehById[j.vehId].make)} ${esc(D.vehById[j.vehId].model)} — ${esc(D.custById[j.custId].name)}</option>`).join('')}</select></div><p class="muted" style="margin-top:12px;font-size:12.5px">Services, vehicle class pricing, advance received and GST are pulled from the job card automatically.</p>`,
        footer: `<button class="btn btn-primary" data-action="niSave">${BM.icon('receipt', 16)}Generate invoice</button><button class="btn btn-ghost" data-action="closePanel">Cancel</button>`,
      });
    },
    niSave: () => { const j = D.jobById[ui.modal.el.querySelector('#niJ').value]; ui.modal.close(true); BM.createInvoiceFromJob(j); if (location.hash === '#/invoices') BM.refresh(); },
  });
})(window.BM);
