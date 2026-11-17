/* Schedule — bay planner timeline + bookings */
(function (BM) {
  'use strict';
  const { esc, inr, fmtDate, fmtTime, fmtDay } = BM.util;
  const D = BM.data, ui = BM.ui, S = BM.state, $ = BM.$;
  let sel = new Date(D.TODAY), sb = null;
  D.extraAppts = [];

  const hh = (h) => { const H = Math.floor(h), m = Math.round((h - H) * 60); const ap = H >= 12 ? 'PM' : 'AM'; return `${((H + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''} ${ap}`; };
  const branchId = () => (S.branch !== 'all' ? S.branch : sb || 'kochi');
  const sameDay = (a, b) => D.iso(a) === D.iso(b);
  const apptsFor = (b, d) => D.appointments(b, d).concat(D.extraAppts.filter((a) => a.branch === b && a.date === D.iso(d)));
  const monday = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };

  BM.pages.schedule = {
    title: 'Schedule',
    render() {
      const b = branchId(), br = D.branchById[b], list = apptsFor(b, sel), wk = monday(sel);
      const isToday = sameDay(sel, D.TODAY), nowH = D.NOW.getHours() + D.NOW.getMinutes() / 60;
      const booked = list.reduce((t, a) => t + (a.end - a.start), 0), cap = br.bays * 10, util = Math.round((booked / cap) * 100);
      const est = list.reduce((t, a) => { const s = D.services.find((x) => x.name === a.sub) || D.services[0]; return t + s.tiers[2]; }, 0);
      const upcoming = list.filter((a) => a.state === 'booked' || a.state === 'live').sort((a, c) => a.start - c.start).slice(0, 6);
      const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(wk); d.setDate(d.getDate() + i); return d; });
      const lanes = Array.from({ length: br.bays }, (_, i) => {
        const bay = i + 1, blocks = list.filter((a) => a.bay === bay);
        const now = isToday && nowH >= 9 && nowH <= 19 ? `<div class="tl-now ${i === br.bays - 1 ? 'last' : ''}" style="left:${((nowH - 9) / 10) * 100}%"></div>` : '';
        return `<div class="tl-rowl">Bay ${bay}</div><div class="tl-lane">${now}${blocks.map((a, k) => `<div class="blk ${a.state === 'done' ? 'done' : ''}" style="--bc:${D.svcCats[a.cat].color};left:calc(${((a.start - 9) / 10) * 100}% + 2px);width:calc(${((a.end - a.start) / 10) * 100}% - 4px)" data-action="openAppt" data-bay="${bay}" data-k="${list.indexOf(a)}" tabindex="0" title="${esc(a.title)} — ${esc(a.sub)}"><b>${esc(a.title)}</b><span>${esc(a.sub)}</span><span>${hh(a.start)} – ${hh(a.end)}</span></div>`).join('')}</div>`;
      }).join('');
      return `${ui.header({
        eyebrow: 'Operations', title: 'Schedule', sub: `Bay planner for ${br.name} · ${br.hours}. Click any booking for details.`,
        actions: `${S.branch === 'all' ? `<div class="seg" role="group" aria-label="Branch">${D.branches.map((x) => `<button class="${x.id === b ? 'on' : ''}" data-action="schedBranch" data-id="${x.id}">${x.name}</button>`).join('')}</div>` : ''}<button class="btn btn-primary" data-action="newAppt">${BM.icon('plus', 17)}Book appointment</button>`,
      })}
      <div class="row between" style="margin-bottom:12px;flex-wrap:wrap"><div class="row"><button class="btn btn-icon btn-sm" data-action="schedWeek" data-d="-7" aria-label="Previous week">${BM.icon('left', 16)}</button><b style="min-width:140px;text-align:center">${fmtDate(days[0])} – ${fmtDate(days[6])}</b><button class="btn btn-icon btn-sm" data-action="schedWeek" data-d="7" aria-label="Next week">${BM.icon('right', 16)}</button></div><button class="btn btn-sm" data-action="schedToday">Today</button></div>
      <div class="dstrip" style="margin-bottom:18px">${days.map((d) => `<button class="dday ${sameDay(d, sel) ? 'on' : ''}" data-action="schedDay" data-d="${D.iso(d)}"><small>${d.toLocaleDateString('en-IN', { weekday: 'short' })}</small><b>${d.getDate()}</b><span>${apptsFor(b, d).length} bookings</span></button>`).join('')}</div>
      <div class="stat-row">
        <div class="card stat"><small>Bookings · ${fmtDate(sel)}</small><b>${list.length}</b><span>${list.filter((a) => a.state === 'live').length} in progress now</span></div>
        <div class="card stat"><small>Bay utilisation</small><b>${util}%</b><span>${booked.toFixed(0)} of ${cap} bay-hours booked</span></div>
        <div class="card stat"><small>Expected billing</small><b>${BM.util.inrC(est)}</b><span>before GST</span></div>
        <div class="card stat"><small>Open slots</small><b>${Math.max(0, cap - Math.round(booked))}</b><span>bay-hours still available</span></div>
      </div>
      <div class="grid">
        <div class="card c9 flush"><div class="card-h pad"><div><div class="card-t">${esc(fmtDay(sel))}</div><div class="card-s">${br.name} · ${br.bays} bays · multi-day jobs hold a bay from opening</div></div><div class="legend" style="margin:0">${Object.entries(D.svcCats).map(([k, c]) => `<span class="lg"><i style="background:${c.color}"></i>${c.label}</span>`).join('')}</div></div>
          <div class="table-wrap" style="padding:0 var(--pad) var(--pad)"><div class="tl-grid" style="--hrs:10"><div class="tl-hdr"></div>${Array.from({ length: 10 }, (_, i) => `<div class="tl-hdr">${hh(9 + i)}</div>`).join('')}${lanes}</div></div></div>
        <div class="card c3 w4"><div class="card-h"><div><div class="card-t">Up next</div><div class="card-s">${esc(br.name)}</div></div></div><div class="feed">${upcoming.map((a) => `<div class="feed-i"><span class="t-ic" style="background:color-mix(in srgb,${D.svcCats[a.cat].color} 20%,transparent);color:${D.svcCats[a.cat].color}">${BM.icon(D.svcCats[a.cat].icon, 16)}</span><div class="grow"><b>${esc(a.title)}</b><small>${esc(a.sub)}</small><small>${hh(a.start)} · Bay ${a.bay}${a.state === 'live' ? ' · <span style="color:var(--ok-ink)">in progress</span>' : ''}</small></div></div>`).join('') || ui.empty('calendar', 'No more bookings today')}</div></div>
      </div>`;
    },
  };

  const SHIFT = { schedBranch: (el) => { sb = el.dataset.id; BM.refresh(); } };
  Object.assign(BM.actions, SHIFT, {
    schedDay: (el) => { sel = new Date(el.dataset.d + 'T00:00:00'); BM.refresh(); },
    schedWeek: (el) => { sel = new Date(sel); sel.setDate(sel.getDate() + +el.dataset.d); BM.refresh(); },
    schedToday: () => { sel = new Date(D.TODAY); BM.refresh(); },
    openAppt: (el) => {
      const b = branchId(), a = apptsFor(b, sel)[+el.dataset.k]; if (!a) return;
      const st = { live: ['In progress', 'accent'], booked: ['Confirmed', 'info'], done: ['Completed', 'ok'] }[a.state];
      ui.modal.open({
        title: `${a.title}`, sub: `${esc(a.sub)} · Bay ${a.bay}`, size: 'sm',
        body: `<div style="width:60%;margin:0 auto 18px">${BM.car(((D.services.find((s) => s.name === a.sub) || {}).cat === 'bike') ? 'bike' : 'suv', '#8a8f98')}</div><div class="kv"><div><small>Customer</small><b>${esc(a.cust || '—')}</b></div><div><small>Status</small>${ui.badge(st[0], st[1])}</div><div><small>Time</small><b>${hh(a.start)} – ${hh(a.end)}</b></div><div><small>Date</small><b>${fmtDate(sel)}</b></div><div><small>Technician</small><b>${esc(a.tech)}</b></div><div><small>Branch</small><b>${esc(D.branchById[b].name)}</b></div></div>`,
        footer: `${a.jobId ? `<button class="btn btn-primary" data-action="openJobFromAppt" data-id="${a.jobId}">Open job card</button>` : `<button class="btn btn-primary" data-action="toast" data-msg="Reminder sent to ${esc(a.cust || 'customer')}" data-sub="WhatsApp · demo" data-icon="chat">${BM.icon('chat', 16)}Send reminder</button>`}<button class="btn" data-action="toast" data-msg="Reschedule link sent" data-icon="calendar">Reschedule</button>`,
      });
    },
    openJobFromAppt: (el) => { ui.modal.close(true); BM.actions.openJob({ dataset: { id: el.dataset.id }, closest: () => null }); },
    newAppt: () => {
      const b = branchId();
      const custs = D.customers.slice().sort((x, y) => x.name.localeCompare(y.name));
      ui.modal.open({
        title: 'Book appointment', sub: 'Reserve a bay for an upcoming visit', size: 'lg',
        body: `<form class="form-grid" autocomplete="off">
          ${ui.field('Customer', `<select class="select" id="apC">${custs.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>`)}
          ${ui.field('Vehicle', '<select class="select" id="apV"></select>')}
          ${ui.field('Service', '<select class="select" id="apS"></select>')}
          ${ui.field('Branch', `<select class="select" id="apB">${D.branches.map((x) => `<option value="${x.id}" ${x.id === b ? 'selected' : ''}>${x.name}</option>`).join('')}</select>`)}
          ${ui.field('Date', `<input class="input" type="date" id="apD" value="${D.iso(sel)}"/>`)}
          ${ui.field('Start time', `<select class="select" id="apT">${Array.from({ length: 9 }, (_, i) => `<option value="${9 + i}">${hh(9 + i)}</option>`).join('')}</select>`)}
        </form>`,
        footer: `<button class="btn btn-primary" data-action="apSave">${BM.icon('check', 16)}Confirm booking</button><button class="btn btn-ghost" data-action="closePanel">Cancel</button>`,
        onMount: (m) => {
          const q = (s) => m.querySelector(s);
          const fillV = () => { const c = D.custById[q('#apC').value]; q('#apV').innerHTML = c.vehicles.map((v) => `<option value="${v.id}">${esc(v.make)} ${esc(v.model)}</option>`).join(''); q('#apB').value = c.branch; fillS(); };
          const fillS = () => { const v = D.vehById[q('#apV').value]; q('#apS').innerHTML = D.services.filter((s) => (s.cat === 'bike') === v.bike).map((s) => `<option value="${s.id}">${esc(s.name)} · ${inr(s.tiers[v.tier])}</option>`).join(''); };
          q('#apC').addEventListener('change', fillV); q('#apV').addEventListener('change', fillS); fillV();
        },
      });
    },
    apSave: () => {
      const m = ui.modal.el, q = (s) => m.querySelector(s);
      const v = D.vehById[q('#apV').value], s = D.svcById[q('#apS').value], branch = q('#apB').value, start = +q('#apT').value, date = q('#apD').value;
      const dur = Math.min(8, Math.max(1.5, s.dur > 8 ? 7 : s.dur)), end = Math.min(19, start + dur);
      const cur = apptsFor(branch, new Date(date + 'T00:00:00'));
      let bay = 1; for (; bay <= D.branchById[branch].bays; bay++) if (!cur.some((a) => a.bay === bay && a.start < end && a.end > start)) break;
      if (bay > D.branchById[branch].bays) { ui.toast('No bay free at that time', { kind: 'bad', sub: 'Try another start time or branch.' }); return; }
      D.extraAppts.push({ branch, date, bay, start, end, title: `${v.make} ${v.model}`, sub: s.name, tech: D.techs.find((t) => t.branch === branch).name, cat: s.cat, state: 'booked', cust: D.custById[v.custId].name });
      ui.modal.close(); sel = new Date(date + 'T00:00:00'); sb = branch;
      ui.toast('Appointment booked', { sub: `${v.make} ${v.model} · Bay ${bay} · ${hh(start)}`, icon: 'calendar' });
      if (location.hash === '#/schedule') BM.refresh(); else location.hash = '#/schedule';
    },
  });
})(window.BM);
