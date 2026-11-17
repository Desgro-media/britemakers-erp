/* Branches — Kottayam · Kochi · Trivandrum */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, fmtDate } = BM.util;
  const D = BM.data, ui = BM.ui, C = BM.charts, S = BM.state;

  const bars7 = (vals, color) => {
    const w = 260, h = 64, n = vals.length, bw = 22, gap = (w - n * bw) / (n - 1), max = Math.max(...vals);
    const days = vals.map((_, i) => { const d = new Date(D.TODAY); d.setDate(d.getDate() - (n - 1 - i)); return d; });
    return `<svg viewBox="0 0 ${w} ${h + 16}" width="100%" height="${h + 16}" role="img" aria-label="Revenue last 7 days">${vals.map((v, i) => { const bh = Math.max(4, (v / max) * h), x = i * (bw + gap), y = h - bh; return `<path d="M${x},${h}V${y + 4}Q${x},${y} ${x + 4},${y}H${x + bw - 4}Q${x + bw},${y} ${x + bw},${y + 4}V${h}Z" style="fill:${color}" opacity="${i === n - 1 ? 1 : 0.55}" data-tip="${esc(days[i].toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }))}|${esc(inrC(v))}|Revenue"/><text class="ax" style="fill:var(--muted);font-size:10px" x="${x + bw / 2}" y="${h + 13}" text-anchor="middle">${days[i].toLocaleDateString('en-IN', { weekday: 'narrow' })}</text>`; }).join('')}</svg>`;
  };
  const stats = (b) => {
    const jobs = D.jobs.filter((j) => j.branch === b.id), inBay = jobs.filter((j) => j.bay).length;
    return { rev30: D.revenue(30, 0, [b.id]), prev30: D.revenue(30, 30, [b.id]), active: jobs.filter((j) => j.status !== 'delivered').length, inBay, util: Math.round((inBay / b.bays) * 100), staff: D.staff.filter((s) => s.branch === b.id).length, techs: D.techs.filter((t) => t.branch === b.id), week: D.daily.slice(-7).map((d) => d[b.id]) };
  };

  BM.pages.branches = {
    title: 'Branches',
    render() {
      const st = Object.fromEntries(D.branches.map((b) => [b.id, stats(b)])), total = D.branches.reduce((t, b) => t + st[b.id].rev30, 0);
      return `${ui.header({ eyebrow: 'Organisation', title: 'Branches', sub: 'Three studios, one standard. Compare performance, capacity and teams across Kottayam, Kochi and Trivandrum.', actions: `<button class="btn" data-action="toast" data-msg="Branch comparison exported" data-icon="download">${BM.icon('download', 16)}Export</button>` })}
      <div class="grid" style="margin-bottom:18px">${D.branches.map((b) => { const s = st[b.id], d = ((s.rev30 - s.prev30) / s.prev30) * 100; return `
        <article class="card branch-card hover c4" style="--bc:${b.color}">
          <div class="row between" style="align-items:flex-start"><div><div class="ph-eyebrow" style="margin:0 0 4px;color:var(--text-2)">${esc(b.code)}</div><h3 style="font-size:24px;font-weight:800;letter-spacing:-.02em">${esc(b.name)}</h3><div class="muted" style="font-size:12.5px;margin-top:2px">${BM.icon('clock', 12)} ${esc(b.hours)}</div></div>${ui.delta(d)}</div>
          <div class="mini-kpis"><div><small>Revenue · 30d</small><b>${inrC(s.rev30)}</b></div><div><small>Active jobs</small><b>${s.active}</b></div><div><small>Bay use</small><b>${s.util}%</b></div></div>
          <div class="row between" style="font-size:12px;margin-bottom:8px"><b>Bays · ${s.inBay} of ${b.bays} occupied</b></div><div class="bay-dots" style="--bc:${b.color};margin-bottom:18px">${Array.from({ length: b.bays }, (_, i) => `<i class="${i < s.inBay ? 'on' : ''}" title="Bay ${i + 1}"></i>`).join('')}</div>
          <div style="margin-bottom:16px">${bars7(s.week, b.color)}</div>
          <div class="divider" style="margin:0 0 14px"></div>
          <div class="row between" style="font-size:12.5px;margin-bottom:6px"><span class="muted">Manager</span><b>${esc(b.manager)}</b></div>
          <div class="row between" style="font-size:12.5px;margin-bottom:6px"><span class="muted">Team</span><b>${s.staff} people · ${s.techs.length} technicians</b></div>
          <div class="row between" style="font-size:12.5px;margin-bottom:16px"><span class="muted">Phone</span><b>${esc(b.phone)}</b></div>
          <div class="row"><button class="btn btn-primary btn-sm grow" data-action="viewBranch" data-id="${b.id}">View ${esc(b.name)}</button><button class="btn btn-sm" data-action="toast" data-msg="Calling ${esc(b.name)} · ${esc(b.phone)}" data-icon="phone">${BM.icon('phone', 14)}Call</button></div>
        </article>`; }).join('')}</div>
      <div class="grid">
        <div class="card c8 flush"><div class="card-h pad"><div><div class="card-t">Side-by-side</div><div class="card-s">Last 30 days</div></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Branch</th><th class="r">Revenue</th><th class="r">Share</th><th class="r">Active jobs</th><th class="r">Bay use</th><th class="r">Rating</th><th>Top technician</th></tr></thead><tbody>${D.branches.map((b) => { const s = st[b.id], top = s.techs.slice().sort((x, y) => y.jobs - x.jobs)[0], rating = (s.techs.reduce((t, x) => t + x.rating, 0) / s.techs.length).toFixed(2); return `<tr><td><div class="cell"><span class="dot" style="background:${b.color}"></span><b>${esc(b.name)}</b></div></td><td class="r num"><b>${inrC(s.rev30)}</b></td><td class="r num">${Math.round((s.rev30 / total) * 100)}%</td><td class="r num">${s.active}</td><td class="r num">${s.util}%</td><td class="r num">${rating}</td><td><div class="cell">${BM.avatar(top.name, 26)}${esc(top.name)}</div></td></tr>`; }).join('')}</tbody></table></div></div>
        <div class="card c4"><div class="card-h"><div><div class="card-t">The Kerala corridor</div><div class="card-s">Three studios, one standard of care</div></div></div>
          <div class="route-line">${[['kochi', 'Kochi', '97544 04040'], ['ktym', 'Kottayam', '080894 99779'], ['tvm', 'Trivandrum', '062628 58585']].map(([id, n, p], i) => `<div class="route-s" style="--bc:${D.branchById[id].color}"><b>${n}</b><div class="muted" style="font-size:12px">${p}</div>${i < 2 ? `<div class="muted" style="font-size:11.5px;margin-top:6px">↓ ${i === 0 ? '~65 km' : '~150 km'} · pickup &amp; drop available</div>` : ''}</div>`).join('')}</div></div>
      </div>`;
    },
  };
  BM.actions.viewBranch = (el) => { BM.setBranch(el.dataset.id); location.hash = '#/dashboard'; };
})(window.BM);
