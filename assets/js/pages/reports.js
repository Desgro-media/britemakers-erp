/* Reports — analytics */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, num } = BM.util;
  const D = BM.data, ui = BM.ui, C = BM.charts, S = BM.state, $ = BM.$;

  BM.pages.reports = {
    title: 'Reports',
    render() {
      const ids = BM.sel.branchIds(), s = D.series(S.range, ids), nice = BM.rangeInfo(S.range)[3];
      const brTot = ids.map((b) => ({ label: D.branchById[b].name, value: s.byBranch[b].reduce((t, v) => t + v, 0), color: D.branchById[b].color }));
      const svc = Object.entries(D.svcMix).map(([k, w]) => ({ k, label: D.svcCats[k].label, value: (s.total * w) / 100, color: D.svcCats[k].color })).sort((a, b) => b.value - a.value);
      const techs = BM.sel.staff().filter((t) => t.tech).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
      const gm = D.services.slice().sort((a, b) => b.margin - a.margin).slice(0, 7);
      return `${ui.header({ eyebrow: 'Insights', title: 'Reports & Analytics', sub: 'Revenue, profitability, capacity and retention — every number reconciles back to job cards and invoices.', actions: `<button class="btn" data-action="toast" data-msg="Weekly report scheduled" data-sub="Every Monday 8:00 AM · demo" data-icon="calendar">${BM.icon('calendar', 16)}Schedule</button><button class="btn btn-primary" data-action="toast" data-msg="Report PDF generated" data-sub="britemakers-report.pdf" data-icon="download">${BM.icon('download', 16)}Export PDF</button>` })}
      <div class="filters" style="justify-content:space-between"><div><div class="card-t" style="font-size:16px">${esc(S.branch === 'all' ? 'All branches' : D.branchById[S.branch].name)}</div><div class="card-s">${nice}</div></div><div class="seg" role="group" aria-label="Date range">${BM.RANGES.map((r) => `<button class="${S.range === r[0] ? 'on' : ''}" data-action="range" data-r="${r[0]}">${r[1]}</button>`).join('')}</div></div>
      <div class="grid">
        <div class="card c8"><div class="card-h"><div><div class="card-t">Revenue trend by branch</div><div class="card-s">Stacked, billed revenue excl. GST</div></div></div><div id="rBr"></div></div>
        <div class="card c4 w4"><div class="card-h"><div><div class="card-t">Branch share</div><div class="card-s">${nice}</div></div></div>${C.donut(brTot, { size: 146, thick: 18, fmt: inrC, top: inrC(s.total), sub: 'revenue', label: 'Branch share' })}</div>

        <div class="card c6"><div class="card-h"><div><div class="card-t">Revenue by service line</div><div class="card-s">${nice}</div></div></div>${C.hbars(svc.map((x) => ({ label: x.label, value: x.value, color: x.color })), { fmt: inrC })}</div>
        <div class="card c6"><div class="card-h"><div><div class="card-t">Gross margin by service</div><div class="card-s">Best performers — what to push at the front desk</div></div></div>${C.hbars(gm.map((x) => ({ label: x.name, value: x.margin, color: D.svcCats[x.cat].color })), { fmt: (v) => v + '%', max: 100 })}</div>

        <div class="card c7"><div class="card-h"><div><div class="card-t">Bay utilisation heatmap</div><div class="card-s">When the studios are busiest — plan staffing and promotions around it</div></div></div>${C.heat(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], ['9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p'], [1, 2, 3, 4, 5, 6, 0].map((i) => D.heat[i]))}</div>
        <div class="card c5 w4"><div class="card-h"><div><div class="card-t">Customer health</div><div class="card-s">Retention &amp; satisfaction</div></div></div>
          <div class="stack" style="gap:18px">${[['Repeat customers', 43, '12-month repeat rate'], ['Check-up show-up', 78, 'Free 6-month coating visits'], ['Referral share', 27, 'Bookings from referrals'], ['5★ reviews', 91, 'Of Google reviews last 90 days']].map(([l, v, sub]) => `<div class="row" style="gap:16px">${C.ring(v, { size: 62, stroke: 7, color: 'var(--c3)' })}<div><b>${l}</b><div class="muted" style="font-size:12.5px">${sub}</div></div></div>`).join('')}</div></div>

        <div class="card c12 flush"><div class="card-h pad"><div><div class="card-t">Technician productivity</div><div class="card-s">Top earners this month · revenue attributed from completed job cards</div></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Technician</th><th>Branch</th><th class="r">Jobs</th><th class="r">Revenue</th><th style="min-width:160px">Utilisation</th><th class="r">Rework</th><th class="r">Rating</th></tr></thead><tbody>${techs.map((t, i) => `<tr><td><div class="cell">${BM.avatar(t.name, 34)}<div><b>${esc(t.name)}</b><small>${esc(t.role)}</small></div></div></td><td>${ui.branchTag(t.branch)}</td><td class="r num">${t.jobs}</td><td class="r num"><b>${inrC(t.revenue)}</b></td><td><div class="row" style="gap:10px"><div class="bar grow ${t.util >= 85 ? 'ok' : ''}"><i style="width:${t.util}%"></i></div><span class="num" style="font-size:12.5px;width:36px">${t.util}%</span></div></td><td class="r num">${(1 + (i % 4) * 0.6).toFixed(1)}%</td><td class="r num">${t.rating}</td></tr>`).join('')}</tbody></table></div></div>
      </div>`;
    },
    mount() {
      const ids = BM.sel.branchIds(), s = D.series(S.range, ids);
      C.bars($('#rBr'), { labels: s.labels, tipTitle: (i) => s.titles[i], tipSub: (i) => s.subs[i], height: 250, stacked: true, fmt: inrC, axFmt: inrC, label: 'Revenue by branch', series: ids.map((b) => ({ name: D.branchById[b].name, color: D.branchById[b].color, data: s.byBranch[b] })) });
    },
  };
})(window.BM);
