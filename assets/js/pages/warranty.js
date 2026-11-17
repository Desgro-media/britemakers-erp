/* Warranty & Care — coating / PPF / film certificates, check-ups, claims */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, fmtDate, fmtDateS, fmtDateY } = BM.util;
  const D = BM.data, ui = BM.ui, C = BM.charts, S = BM.state, $ = BM.$;
  let f = 'all', q = '', limit = 14;

  const list = () => BM.sel.warranties().filter((w) => {
    const c = D.custById[w.custId], v = D.vehById[w.vehId];
    if (f === 'due' && w.status !== 'due') return false;
    if (f === 'claim' && w.status !== 'claim') return false;
    if (f === 'active' && w.status !== 'active') return false;
    if (q && !(c.name + v.plate + v.make + v.model + w.cert + D.svcById[w.svcId].name).toLowerCase().includes(q)) return false;
    return true;
  });
  const badge = (w) => (w.status === 'due' ? ui.badge('Check-up due', 'warn') : w.status === 'claim' ? ui.badge('Claim open', 'bad') : ui.badge('Active', 'ok'));
  const elapsed = (w) => Math.max(2, Math.min(100, ((D.TODAY - w.applied) / (w.expiry - w.applied)) * 100));

  function rows(l) {
    return l.slice(0, limit).map((w) => {
      const c = D.custById[w.custId], v = D.vehById[w.vehId], s = D.svcById[w.svcId];
      return `<tr><td><div class="cell">${ui.vehTile(v)}<div style="min-width:0"><b class="ellipsis">${esc(c.name)}</b><small>${esc(v.make)} ${esc(v.model)} · ${esc(v.plate)}</small></div></div></td>
      <td>${ui.svcTag(w.svcId)}<small class="muted" style="display:block;margin-top:4px">${esc(w.cert)}</small></td>
      <td class="nowrap">${fmtDateS(w.applied)}<small class="muted" style="display:block">${w.years}-year cover</small></td>
      <td style="min-width:140px"><div class="row between" style="font-size:12px;margin-bottom:5px"><b>${fmtDateY(w.expiry)}</b></div><div class="bar thin"><i style="width:${elapsed(w).toFixed(0)}%"></i></div></td>
      <td class="nowrap">${fmtDateS(w.nextCheck)}<small class="muted" style="display:block">${w.daysToCheck <= 0 ? 'overdue' : 'in ' + w.daysToCheck + ' days'}</small></td>
      <td>${badge(w)}</td>
      <td class="r nowrap"><button class="btn btn-sm btn-ghost btn-icon" data-action="openCert" data-id="${w.id}" aria-label="View certificate" title="Certificate">${BM.icon('eye', 16)}</button><button class="btn btn-sm btn-ghost btn-icon" data-action="toast" data-msg="Reminder sent to ${esc(c.name)}" data-sub="WhatsApp · ${esc(s.name)} check-up" data-icon="chat" aria-label="Send reminder" title="Send reminder">${BM.icon('chat', 16)}</button></td></tr>`;
    }).join('');
  }

  BM.pages.warranty = {
    title: 'Warranty & Care',
    render() {
      const all = BM.sel.warranties(), due = all.filter((w) => w.status === 'due'), claims = all.filter((w) => w.status === 'claim');
      const cover = all.reduce((t, w) => t + D.priceLine(w.svcId, w.vehId), 0);
      return `${ui.header({ eyebrow: 'Operations', title: 'Warranty & Care', sub: 'Digital certificates for every coating, PPF and sun-film job — with scheduled check-ups that bring customers back.', actions: `<button class="btn" data-action="toast" data-msg="Exported warranty register" data-sub="warranties.xlsx" data-icon="download">${BM.icon('download', 16)}Export</button><button class="btn btn-primary" data-action="toast" data-msg="${due.length} reminders queued" data-sub="WhatsApp Business · demo" data-icon="chat">${BM.icon('chat', 16)}Remind all due (${due.length})</button>` })}
      <div class="stat-row">
        <div class="card stat"><small>Active warranties</small><b data-count="${all.length}" data-fmt="num">0</b><span>${inrC(cover)} of protected work</span></div>
        <div class="card stat"><small>Check-ups due · 30 days</small><b data-count="${due.length}" data-fmt="int">0</b><span>free 6-monthly care visits</span></div>
        <div class="card stat"><small>Open claims</small><b data-count="${claims.length}" data-fmt="int">0</b><span>avg. resolution 3.2 days</span></div>
        <div class="card stat"><small>Check-up show-up rate</small><b>78%</b><span style="color:var(--ok-ink)">+6 pts with reminders</span></div>
      </div>
      <div class="grid">
        <div class="card c5 w4"><div class="card-h"><div><div class="card-t">Check-ups next 8 weeks</div><div class="card-s">Scheduled free care visits</div></div></div><div id="wChart"></div></div>
        <div class="card c7"><div class="card-h"><div><div class="card-t">Open claims</div><div class="card-s">${claims.length ? 'Awaiting a decision' : 'Nothing open'}</div></div></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">${claims.slice(0, 4).map((w) => `<div class="card" style="background:var(--surface-2);box-shadow:none;padding:12px 14px"><div class="row between"><b style="font-size:13px">${esc(w.claim.issue)}</b>${ui.badge('Open', 'bad')}</div><div class="muted" style="font-size:12px;margin:3px 0 10px">${esc(D.custById[w.custId].name)} · ${esc(D.vehById[w.vehId].make)} ${esc(D.vehById[w.vehId].model)} · opened ${fmtDate(w.claim.opened)}</div><div class="row"><button class="btn btn-sm btn-soft" data-action="resolveClaim" data-id="${w.id}">${BM.icon('check', 14)}Resolve</button><button class="btn btn-sm btn-ghost" data-action="openCert" data-id="${w.id}">Certificate</button></div></div>`).join('') || ui.empty('shield', 'No open claims')}</div></div>
        <div class="card c12 flush"><div class="card-h pad"><div><div class="card-t">Warranty register</div><div class="card-s">Every certificate issued by the network</div></div></div>
          <div style="padding:0 var(--pad)"><div class="filters" style="margin-bottom:12px"><div class="search"><input class="input" id="wq" type="search" placeholder="Search customer, plate, certificate…" value="${esc(q)}" aria-label="Search warranties" style="padding-left:40px"/>${BM.icon('search', 17)}</div>
            <div class="chips">${[['all', 'All', all.length], ['due', 'Check-up due', due.length], ['claim', 'Claims', claims.length], ['active', 'Active', all.length - due.length - claims.length]].map(([k, l, n]) => `<button class="chip-btn ${f === k ? 'on' : ''}" data-action="wFilter" data-f="${k}">${l} <small>${n}</small></button>`).join('')}</div></div></div>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Customer &amp; vehicle</th><th>Coverage</th><th>Applied</th><th>Valid until</th><th>Next check-up</th><th>Status</th><th></th></tr></thead><tbody id="wBody"></tbody></table></div><div class="tbl-foot"><span id="wCount"></span><button class="link" id="wMore">Show more</button></div></div>
      </div>`;
    },
    mount() {
      const paint = () => { const l = list(); $('#wBody').innerHTML = rows(l) || `<tr><td colspan="7">${ui.empty('shield', 'No warranties match')}</td></tr>`; $('#wCount').textContent = `Showing ${Math.min(limit, l.length)} of ${l.length}`; $('#wMore').style.display = l.length > limit ? '' : 'none'; };
      paint();
      $('#wq').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); limit = 14; paint(); });
      $('#wMore').addEventListener('click', () => { limit += 14; paint(); });
      const all = BM.sel.warranties();
      const wk = Array.from({ length: 8 }, (_, i) => { const a = new Date(D.TODAY); a.setDate(a.getDate() + i * 7); const b = new Date(a); b.setDate(b.getDate() + 7); return { label: fmtDate(a), n: all.filter((w) => w.nextCheck >= a && w.nextCheck < b).length }; });
      C.bars($('#wChart'), { labels: wk.map((w) => w.label), tipTitle: (i) => 'Week of ' + wk[i].label, height: 180, fmt: (v) => v + ' check-ups', axFmt: (v) => String(v), valueLabels: true, label: 'Check-ups per week', xw: 52, left: 34, series: [{ name: 'Check-ups', color: 'var(--c3)', data: wk.map((w) => w.n) }] });
    },
  };

  /* decorative QR-style code, deterministic per certificate */
  const qr = (seed) => {
    const n = 21, r = BM.data.mulberry(BM.util.hash(seed)); let cells = '';
    const finder = (x, y) => (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let on = r() > 0.52;
      if (finder(x, y)) { const ax = x < 7 ? x : x - (n - 7), ay = y < 7 ? y : y - (n - 7); on = ax === 0 || ax === 6 || ay === 0 || ay === 6 || (ax > 1 && ax < 5 && ay > 1 && ay < 5); }
      if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return `<svg viewBox="0 0 ${n} ${n}" width="92" height="92" fill="#f6efe8" shape-rendering="crispEdges">${cells}</svg>`;
  };

  Object.assign(BM.actions, {
    wFilter: (el) => { f = el.dataset.f; limit = 14; BM.refresh(); },
    resolveClaim: (el) => { const w = D.warranties.find((x) => x.id === el.dataset.id); w.status = w.daysToCheck <= 30 ? 'due' : 'active'; w.claim = null; ui.toast('Claim resolved', { sub: 'Customer notified · certificate updated', icon: 'check' }); BM.refresh(); },
    openCert: (el) => {
      const w = D.warranties.find((x) => x.id === el.dataset.id); if (!w) return;
      const c = D.custById[w.custId], v = D.vehById[w.vehId], s = D.svcById[w.svcId], b = D.branchById[w.branch];
      const tech = D.techs.find((t) => t.branch === w.branch && t.cert) || D.techs[0];
      ui.modal.open({
        title: 'Certificate of Protection', sub: `${esc(w.cert)} · ${esc(c.name)}`, size: 'lg',
        body: `<div class="cert print-area"><div class="checker"></div>
          <div style="margin-top:12px;letter-spacing:.2em;font-size:11px;font-weight:700;color:rgba(255,255,255,.6)">BRITEMAKERS · DETAILING. PROTECTION. PERFECTION.</div>
          <h2 style="margin-top:12px">${esc(s.name)}</h2><div style="margin:6px 0 20px;color:rgba(255,255,255,.7)">${w.years}-year protection warranty</div>
          <div style="width:min(300px,70%);margin:0 auto 18px">${BM.car(v.shape, v.color)}</div>
          <div class="kv" style="text-align:left;max-width:540px;margin:0 auto 22px;color:#f6efe8"><div><small style="color:rgba(255,255,255,.55)">Vehicle</small><b>${esc(v.make)} ${esc(v.model)} · ${esc(v.plate)}</b></div><div><small style="color:rgba(255,255,255,.55)">Owner</small><b>${esc(c.name)}</b></div><div><small style="color:rgba(255,255,255,.55)">Applied</small><b>${fmtDateY(w.applied)}</b></div><div><small style="color:rgba(255,255,255,.55)">Valid until</small><b>${fmtDateY(w.expiry)}</b></div><div><small style="color:rgba(255,255,255,.55)">Installed by</small><b>${esc(tech.name)} · ${esc(b.name)}</b></div><div><small style="color:rgba(255,255,255,.55)">Next free check-up</small><b>${fmtDateY(w.nextCheck)}</b></div></div>
          <div class="row" style="justify-content:center;gap:22px;align-items:center;flex-wrap:wrap"><div style="padding:8px;border-radius:10px;background:#0a0a0b;border:1px solid rgba(255,255,255,.2)">${qr(w.cert)}</div><div style="max-width:280px;text-align:left;font-size:11.5px;color:rgba(255,255,255,.62);line-height:1.5">Covers hydrophobic failure, delamination and yellowing under normal use. Requires a free check-up every 6 months. Scan to verify authenticity. <i>Demo certificate — not a legal document.</i></div></div></div>`,
        footer: `<button class="btn btn-primary" onclick="window.print()">${BM.icon('printer', 16)}Print certificate</button><button class="btn" data-action="toast" data-msg="Certificate sent to ${esc(c.name)}" data-sub="WhatsApp · PDF" data-icon="chat">${BM.icon('chat', 16)}Send on WhatsApp</button>`,
      });
    },
  });
})(window.BM);
