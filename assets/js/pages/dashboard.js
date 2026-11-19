/* Dashboard — command centre */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, num, relTime, until, fmtDate, fmtDay, fmtTime } = BM.util;
  const D = BM.data, ui = BM.ui, C = BM.charts, S = BM.state;

  const RANGES = [['7', '7D', 7, 'last 7 days'], ['30', '30D', 30, 'last 30 days'], ['90', '90D', 91, 'last 13 weeks'], ['365', '12M', 365, 'last 12 months']];
  const rangeInfo = (r) => RANGES.find((x) => x[0] === r) || RANGES[1];
  BM.rangeInfo = rangeInfo; BM.RANGES = RANGES;

  /* time series grouped for the selected range (daily / weekly / monthly) + a smooth target line */
  D.series = (range, ids) => {
    ids = ids || BM.sel.branchIds();
    const len = D.daily.length;
    const dayTot = (d) => ids.reduce((t, b) => t + d[b], 0);
    const ma = D.daily.map((_, i) => { const a = D.daily.slice(Math.max(0, i - 27), i + 1); return a.reduce((t, d) => t + dayTot(d), 0) / a.length; });
    /* chart complete days only — today's partial total would draw a misleading cliff */
    const last = len - 1;
    let groups = [];
    if (range === '7' || range === '30') { for (let i = last - (range === '7' ? 7 : 30); i < last; i++) groups.push([i]); }
    else if (range === '90') { for (let i = last - 91; i < last; i += 7) groups.push(Array.from({ length: 7 }, (_, k) => i + k)); }
    else {
      const map = new Map(), curKey = D.TODAY.getFullYear() * 12 + D.TODAY.getMonth();
      D.daily.forEach((d, i) => { const k = d.date.getFullYear() * 12 + d.date.getMonth(); if (k === curKey) return; if (!map.has(k)) map.set(k, []); map.get(k).push(i); });
      groups = [...map.values()].slice(-12);
    }
    const out = { labels: [], titles: [], totals: [], targets: [], byBranch: Object.fromEntries(ids.map((b) => [b, []])), subs: [] };
    groups.forEach((g, gi) => {
      const rows = g.map((i) => D.daily[i]), first = rows[0].date, last = rows[rows.length - 1].date;
      out.totals.push(rows.reduce((t, d) => t + dayTot(d), 0));
      out.targets.push(Math.round(g.reduce((t, i) => t + ma[i] * 1.06, 0)));
      ids.forEach((b) => out.byBranch[b].push(rows.reduce((t, d) => t + d[b], 0)));
      if (range === '7') { out.labels.push(first.toLocaleDateString('en-IN', { weekday: 'short' })); out.titles.push(first.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })); }
      else if (range === '30') { out.labels.push(fmtDate(first)); out.titles.push(first.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })); }
      else if (range === '90') { out.labels.push(fmtDate(first)); out.titles.push(`Week of ${fmtDate(first)} – ${fmtDate(last)}`); }
      else { out.labels.push(first.toLocaleDateString('en-IN', { month: 'short' })); out.titles.push(first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })); }
      out.subs.push('');
    });
    out.total = out.totals.reduce((t, v) => t + v, 0);
    return out;
  };

  const AVG_TICKET = { 7: 14120, 30: 13850, 90: 13410, 365: 12780 };

  function stats() {
    const [, , days, nice] = rangeInfo(S.range), ids = BM.sel.branchIds();
    const cur = D.revenue(days, 0, ids), prev = D.revenue(days, days, ids);
    const ticket = AVG_TICKET[S.range], tPrev = ticket * 0.972;
    const jobsNow = Math.round(cur / ticket), jobsPrev = Math.round(prev / tPrev);
    const jobs = BM.sel.jobs(), inBay = jobs.filter((j) => j.bay).length;
    const bays = ids.reduce((t, b) => t + D.branchById[b].bays, 0);
    return { days, nice, cur, prev, dRev: ((cur - prev) / prev) * 100, ticket, dTicket: ((ticket - tPrev) / tPrev) * 100, jobsNow, dJobs: ((jobsNow - jobsPrev) / jobsPrev) * 100, inBay, bays, util: Math.round((inBay / bays) * 100), jobs };
  }

  function bayBoard(jobs) {
    const single = S.branch !== 'all';
    let tiles = jobs.filter((j) => j.bay).sort((a, b) => (a.branch === b.branch ? a.bay - b.bay : a.branch.localeCompare(b.branch)));
    const total = tiles.length;
    if (!single) tiles = tiles.slice(0, 8);
    const html = tiles.map((j) => {
      const v = D.vehById[j.vehId], b = D.branchById[j.branch], st = D.statusById[j.status], s = D.svcById[j.svcs[0]];
      return `<div class="bay" style="--bc:${D.svcCats[s.cat].color}" data-action="openJob" data-id="${j.id}" tabindex="0">
        <div class="bay-h"><span>Bay ${j.bay} · ${esc(b.name)}</span>${ui.statusBadge(j.status)}</div>
        ${BM.car(v.shape, v.color)}
        <h4>${esc(v.make)} ${esc(v.model)}</h4><div class="plate">${esc(v.plate)}</div>
        <div class="row between" style="margin:10px 0 6px;font-size:12px"><span class="t2 ellipsis" style="max-width:70%">${esc(s.name)}${j.svcs.length > 1 ? ` +${j.svcs.length - 1}` : ''}</span><b class="num">${j.progress}%</b></div>
        <div class="bar thin"><i style="width:${j.progress}%"></i></div>
        <div class="bay-f">${BM.avatars(j.techs.map((t) => D.staffById[t].name), 24)}<span>${until(j.eta)}</span></div></div>`;
    });
    if (single) {
      const used = new Set(tiles.map((j) => j.bay));
      for (let n = 1; n <= D.branchById[S.branch].bays; n++) if (!used.has(n)) html.splice(n - 1, 0, `<div class="bay idle">${BM.icon('plus', 22)}<b style="color:var(--text-2)">Bay ${n} · Available</b><small>Ready for the next vehicle</small><button class="btn btn-sm btn-soft" data-action="newJob" style="margin-top:6px">Assign job</button></div>`);
    }
    return { html: html.join(''), total };
  }

  function insights(st) {
    const out = [];
    const due = BM.sel.warranties().filter((w) => w.status === 'due');
    out.push({ ic: 'shield', t: `${due.length} coating check-ups fall due in the next 30 days`, p: 'Reminded customers return 2.4× more often for care-plan add-ons. Draft WhatsApp messages are ready.', btn: 'Send reminders', msg: `${due.length} WhatsApp reminders queued`, sub: 'Sent via WhatsApp Business · demo' });
    const crit = D.inventory.filter((i) => D.stockStatus(i, S.branch) !== 'ok').sort((a, b) => {
      const wa = S.branch === 'all' ? D.worstBranch(a) : S.branch, wb = S.branch === 'all' ? D.worstBranch(b) : S.branch;
      return a.stock[wa] / a.reorder[wa] - b.stock[wb] / b.reorder[wb];
    })[0];
    if (crit) {
      const wb = S.branch === 'all' ? D.worstBranch(crit) : S.branch, left = crit.stock[wb], perWeek = Math.max(0.3, crit.usage / 3), days = Math.round((left / perWeek) * 7);
      const nm = crit.name.split(' · ')[0];
      out.push({ ic: 'package', t: left === 0 ? `${nm} is out of stock in ${D.branchById[wb].name}` : `${nm} runs out in ~${Math.max(1, days)} days in ${D.branchById[wb].name}`, p: `${D.branchById[wb].name} has ${left} ${crit.unit} left (reorder level ${crit.reorder[wb]}). Supplier lead time is ${crit.lead} days — order now to avoid holding up a bay.`, btn: 'Draft purchase order', msg: 'Purchase order drafted', sub: `${crit.supplier} · ${nm}` });
    }
    const hot = BM.sel.leads().filter((l) => l.temp === 'hot' && ['new', 'contacted', 'quoted'].includes(l.stage));
    out.push({ ic: 'flame', t: `${hot.length} hot leads worth ${inrC(hot.reduce((t, l) => t + l.value, 0))} are waiting`, p: 'Most came from Instagram DMs. Replying inside 15 minutes roughly doubles conversion.', btn: 'Open leads', go: '#/leads' });
    return out.slice(0, 3);
  }

  BM.pages.dashboard = {
    title: 'Dashboard',
    render() {
      const st = stats(), jobs = st.jobs, ids = BM.sel.branchIds();
      const ready = jobs.filter((j) => j.status === 'ready').length, deliveredToday = jobs.filter((j) => j.status === 'delivered').length;
      const todayRev = D.daily[D.daily.length - 1];
      const todayTot = ids.reduce((t, b) => t + todayRev[b], 0);
      const bb = bayBoard(jobs);
      const series = D.series(S.range);
      const mix = Object.entries(D.svcMix).map(([k, w]) => ({ label: D.svcCats[k].label, value: Math.round((series.total * w) / 100 / 100) * 100, color: D.svcCats[k].color }));
      const due = jobs.filter((j) => ['qc', 'ready', 'progress'].includes(j.status)).sort((a, b) => a.eta - b.eta).slice(0, 6);
      const delivered = jobs.filter((j) => j.status === 'delivered').sort((a, b) => b.deliveredAt - a.deliveredAt).slice(0, 3);
      const techs = BM.sel.staff().filter((s) => s.tech).sort((a, b) => b.jobs - a.jobs).slice(0, 5);
      const low = D.inventory.filter((i) => D.stockStatus(i, S.branch) !== 'ok').slice(0, 4);
      const ins = insights(st);
      const sparkVals = D.daily.slice(-14).map((d) => ids.reduce((t, b) => t + d[b], 0));
      const now = new Date();
      const hello = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
      const scope = ids.length === 1 ? D.branchById[ids[0]].name : `${ids.length} branches`, where = ids.length === 1 ? `at ${scope}` : `across ${scope}`;

      return `
      <section class="hero" aria-label="Today at a glance">
        <div class="hero-top">
          <div class="hero-txt">
            <div class="hero-eyebrow"><span class="live-pill"><span class="dot live"></span>Live</span><span>${fmtDay(now)}</span></div>
            <h1>${hello}, ${esc(BM.auth.user().first)}</h1>
            <p>${st.inBay} ${st.inBay === 1 ? 'vehicle' : 'vehicles'} on the bays ${where} &nbsp;·&nbsp; ${ready} ready for delivery &nbsp;·&nbsp; ${deliveredToday} delivered today</p>
          </div>
          <div class="hero-actions"><button class="btn btn-primary" data-action="newJob">${BM.icon('plus', 17)}New job card</button><button class="btn" data-action="newAppt">${BM.icon('calendar', 17)}Book appointment</button><button class="btn" data-action="go" data-href="#/jobs">${BM.icon('jobs', 17)}Open work board</button></div>
        </div>
        <div class="hero-stats">
          <div class="hstat"><span class="hs-l">${BM.icon('rupee', 15)}Billed today</span><b data-count="${todayTot}" data-fmt="inrC">0</b><small>${esc(scope)}</small></div>
          <div class="hstat"><span class="hs-l">${BM.icon('wrench', 15)}On the bays</span><b><span data-count="${st.inBay}" data-fmt="int">0</span><small>of ${st.bays}</small></b><div class="bar thin" role="img" aria-label="${st.util}% of bays in use"><i style="width:${st.util}%"></i></div></div>
          <div class="hstat"><span class="hs-l">${BM.icon('truck', 15)}Ready to deliver</span><b data-count="${ready}" data-fmt="int">0</b><small>Awaiting pickup</small></div>
          <div class="hstat"><span class="hs-l">${BM.icon('star', 15)}Avg. rating</span><b data-count="4.8" data-fmt="d1">0</b><small>Customer feedback</small></div>
        </div>
      </section>

      <div class="filters" style="margin:26px 0 16px;justify-content:space-between">
        <div><div class="card-t" style="font-size:16px">Performance</div><div class="card-s">${esc(S.branch === 'all' ? 'All branches' : D.branchById[S.branch].name)} · ${st.nice}</div></div>
        <div class="seg" role="group" aria-label="Date range">${RANGES.map((r) => `<button class="${S.range === r[0] ? 'on' : ''}" data-action="range" data-r="${r[0]}">${r[1]}</button>`).join('')}</div>
      </div>

      <div class="grid">
        <div class="c3">${ui.kpi({ icon: 'rupee', label: 'Revenue', count: st.cur, fmt: 'inrC', delta: st.dRev, cap: `vs previous ${st.nice.replace('last ', '')}`, spark: C.spark(sparkVals) })}</div>
        <div class="c3">${ui.kpi({ icon: 'jobs', label: 'Jobs completed', count: st.jobsNow, fmt: 'num', delta: st.dJobs, cap: `across ${ids.length} branch${ids.length > 1 ? 'es' : ''}`, spark: C.spark(sparkVals.map((v, i) => v * (0.9 + (i % 4) * 0.04)), { color: 'var(--c2)' }) })}</div>
        <div class="c3">${ui.kpi({ icon: 'receipt', label: 'Average ticket', count: st.ticket, fmt: 'inr', delta: st.dTicket, cap: 'incl. add-ons, excl. GST', spark: C.spark(sparkVals.map((v, i) => 1 + Math.sin(i / 2) * 0.06 + i * 0.008), { color: 'var(--c3)' }) })}</div>
        <div class="c3">${ui.kpi({ icon: 'gauge', label: 'Bay utilisation', html: `<span data-count="${st.util}" data-fmt="int">0</span><small>%</small>`, cap: `${st.inBay} of ${st.bays} bays occupied`, ring: C.ring(st.util, { size: 50, stroke: 6 }) })}</div>

        <div class="card c8"><div class="card-h"><div><div class="card-t">Revenue vs target</div><div class="card-s">Completed periods only, ${st.nice} · target = smoothed run-rate +6%</div></div></div><div id="revChart"></div></div>
        <div class="card c4 w4"><div class="card-h"><div><div class="card-t">Where the money comes from</div><div class="card-s">Revenue by service line</div></div></div>${C.donut(mix, { size: 146, thick: 18, fmt: inrC, top: inrC(series.total), sub: 'total revenue', label: 'Revenue by service line' })}</div>

        <div class="card c8"><div class="card-h"><div><div class="card-t">Live bay board</div><div class="card-s">${bb.total} vehicles being worked on right now${S.branch === 'all' && bb.total > 8 ? ' · showing 8' : ''}</div></div><a class="link" href="#/jobs">Open work board ${BM.icon('arrowR', 14)}</a></div><div class="bays">${bb.html || ui.empty('car', 'No vehicles on the bays')}</div></div>
        <div class="card c4 w4"><div class="card-h"><div><div class="card-t">Deliveries &amp; handovers</div><div class="card-s">Next out of the door</div></div></div>
          <div class="feed">${due.map((j) => { const v = D.vehById[j.vehId]; return `<div class="feed-i" style="align-items:center"><span class="vtile" style="width:54px;height:38px">${BM.car(v.shape, v.color)}</span><div class="grow" style="min-width:0"><b class="ellipsis" style="display:block">${esc(v.make)} ${esc(v.model)}</b><small>${esc(D.custById[j.custId].name)} · ${until(j.eta)}</small></div>${ui.statusBadge(j.status)}</div>`; }).join('') || ui.empty('truck', 'Nothing queued')}</div>
          ${delivered.length ? `<div class="sec-t" style="margin-top:20px">Delivered today · ${deliveredToday}</div><div class="feed">${delivered.map((j) => { const v = D.vehById[j.vehId]; return `<div class="feed-i" style="align-items:center"><span class="vtile" style="width:54px;height:38px">${BM.car(v.shape, v.color)}</span><div class="grow" style="min-width:0"><b class="ellipsis" style="display:block">${esc(v.make)} ${esc(v.model)}</b><small>${esc(D.custById[j.custId].name)} · ${fmtTime(j.deliveredAt)}</small></div>${BM.icon('check', 16)}</div>`; }).join('')}</div>` : ''}</div>

        <div class="card c4"><div class="card-h"><div><div class="card-t">Top technicians</div><div class="card-s">Jobs completed this month</div></div><a class="link" href="#/team">Team</a></div>
          ${techs.map((t, i) => `<div class="lb-i"><span class="lb-rank">${i + 1}</span>${BM.avatar(t.name, 34)}<div class="grow"><b class="ellipsis" style="display:block;font-size:13.5px">${esc(t.name)}</b><small class="muted">${esc(t.role)} · ${esc(D.branchById[t.branch].name)}</small></div><div style="text-align:right"><b class="num">${t.jobs}</b><small class="muted" style="display:block">${BM.icon('star', 11)} ${t.rating}</small></div></div>`).join('')}</div>
        <div class="card c4"><div class="card-h"><div><div class="card-t">Stock alerts</div><div class="card-s">${low.length ? 'Needs attention' : 'All stock healthy'}</div></div><a class="link" href="#/inventory">Inventory</a></div>
          ${low.map((i) => { const wb = S.branch === 'all' ? D.worstBranch(i) : S.branch, s = i.stock[wb], r = i.reorder[wb], crit = D.stockStatus(i, wb) === 'critical', nm = i.name.split(' · ')[0]; return `<div style="margin-bottom:16px"><div class="row between" style="margin-bottom:7px"><b class="ellipsis" style="font-size:13px;max-width:70%">${esc(nm)}</b>${ui.badge(crit ? 'Critical' : 'Low', crit ? 'bad' : 'warn')}</div><div class="stock-bar"><i style="width:${Math.min(100, (s / (r * 2)) * 100)}%;background:${crit ? 'var(--bad)' : 'var(--warn)'}"></i><u style="left:50%"></u></div><div class="row between" style="margin-top:6px;font-size:11.5px"><span class="muted">${s} ${i.unit} left${S.branch === 'all' ? ' at ' + esc(D.branchById[wb].name) : ''} · reorder at ${r}</span><button class="link" data-action="toast" data-msg="PO drafted for ${esc(nm)}" data-sub="${esc(i.supplier)}">Reorder</button></div></div>`; }).join('') || ui.empty('package', 'Nothing to reorder')}</div>
        <div class="card c4 ai-card"><div class="card-h"><div><span class="pill-spark">${BM.icon('sparkles', 14)} Brite Assistant</span><div class="card-s" style="margin-top:4px">Suggested next actions</div></div></div>
          ${ins.map((a) => `<div class="ai-i"><div class="row" style="align-items:flex-start;gap:10px"><span class="kpi-ico" style="flex:none">${BM.icon(a.ic, 16)}</span><b>${esc(a.t)}</b></div><p>${esc(a.p)}</p>${a.go ? `<button class="btn btn-sm btn-soft" data-action="go" data-href="${a.go}">${esc(a.btn)}</button>` : `<button class="btn btn-sm btn-soft" data-action="toast" data-msg="${esc(a.msg)}" data-sub="${esc(a.sub)}">${esc(a.btn)}</button>`}</div>`).join('')}</div>

        <div class="card c6"><div class="card-h"><div><div class="card-t">Revenue by branch</div><div class="card-s">${st.nice}</div></div></div><div id="brChart"></div></div>
        <div class="card c6"><div class="card-h"><div><div class="card-t">Recent activity</div><div class="card-s">Across the network</div></div></div>
          <div class="feed">${D.activity.slice(0, 7).map((a) => `<div class="feed-i"><span class="t-ic">${BM.icon(a.icon, 16)}</span><div class="grow"><span><b>${esc(a.who)}</b> ${esc(a.what)}</span><small>${relTime(a.at)}</small></div></div>`).join('')}</div></div>
      </div>`;
    },
    mount() {
      const s = D.series(S.range), ids = BM.sel.branchIds();
      C.line($('#revChart'), { labels: s.labels, tipTitle: (i) => s.titles[i], tipSub: (i) => s.subs[i], height: 290, fmt: inrC, axFmt: inrC, label: 'Revenue versus target', series: [{ name: 'Revenue', color: 'var(--c1)', data: s.totals, area: true }, { name: 'Target', color: 'var(--muted)', data: s.targets, dash: true }] });
      C.bars($('#brChart'), { labels: s.labels, tipTitle: (i) => s.titles[i], height: 220, stacked: true, fmt: inrC, axFmt: inrC, label: 'Revenue by branch', series: ids.map((b) => ({ name: D.branchById[b].name, color: D.branchById[b].color, data: s.byBranch[b] })) });
    },
  };
  const $ = BM.$;
  BM.actions.range = (el) => { S.range = el.dataset.r; BM.refresh(); };
})(window.BM);
