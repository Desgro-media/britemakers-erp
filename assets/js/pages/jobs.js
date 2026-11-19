/* Job Cards — kanban board, list, detail drawer, new job */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, until, relTime, fmtTime, fmtDate, fmtDateY } = BM.util;
  const D = BM.data, ui = BM.ui, S = BM.state, $ = BM.$, $$ = BM.$$;
  let view = 'board', q = '', prio = 'all', cat = 'all';

  const PRIO = { high: 'High', med: 'Medium', low: 'Low' };
  const veh = (j) => D.vehById[j.vehId], cust = (j) => D.custById[j.custId];
  const filtered = () => BM.sel.jobs().filter((j) => {
    const v = veh(j), c = cust(j);
    if (prio !== 'all' && j.priority !== prio) return false;
    if (cat !== 'all' && !j.svcs.some((s) => D.svcById[s].cat === cat)) return false;
    if (q && !(j.id + v.plate + v.make + v.model + c.name).toLowerCase().includes(q)) return false;
    return true;
  });
  const nextStatus = (id) => { const i = D.STATUS.findIndex((s) => s.id === id); return D.STATUS[i + 1] || null; };

  function card(j) {
    const v = veh(j), c = cust(j);
    return `<article class="kcard" draggable="true" data-id="${j.id}" data-action="openJob" tabindex="0" aria-label="${esc(j.id)} ${esc(v.make)} ${esc(v.model)}">
      <div class="kcard-top"><span>${j.id}</span><span class="prio ${j.priority}">${BM.icon('flag', 12)}${PRIO[j.priority]}</span></div>
      ${BM.car(v.shape, v.color)}
      <h4>${esc(v.make)} ${esc(v.model)}</h4><div class="sub">${esc(c.name)} · ${esc(v.plate)}</div>
      <div class="tags">${j.svcs.slice(0, 2).map(ui.svcTag).join('')}${j.svcs.length > 2 ? `<span class="tag">+${j.svcs.length - 2}</span>` : ''}</div>
      ${j.status !== 'checkin' ? `<div class="bar thin ${j.status === 'ready' || j.status === 'delivered' ? 'ok' : ''}"><i style="width:${j.progress}%"></i></div>` : ''}
      <div class="kcard-f">${BM.avatars(j.techs.map((t) => D.staffById[t].name), 24)}<span class="muted" style="font-weight:600">${j.status === 'delivered' ? 'Delivered ' + fmtTime(j.deliveredAt) : until(j.eta)}</span><b class="num">${inrC(j.amount)}</b></div>
      ${S.branch === 'all' ? `<div style="margin-top:10px">${ui.branchTag(j.branch)}${j.bay ? ` <span class="tag">Bay ${j.bay}</span>` : ''}</div>` : j.bay ? `<div style="margin-top:10px"><span class="tag">Bay ${j.bay}</span></div>` : ''}
    </article>`;
  }
  function board(list) {
    return `<div class="board" id="board">${D.STATUS.map((s) => {
      const items = list.filter((j) => j.status === s.id);
      return `<section class="kcol" data-status="${s.id}" aria-label="${s.label}"><div class="kcol-h"><span class="dot" style="background:${s.id === 'progress' ? 'var(--accent)' : s.id === 'ready' ? 'var(--ok-ink)' : s.id === 'qc' ? 'var(--warn-ink)' : s.id === 'checkin' ? 'var(--info-ink)' : s.id === 'inspection' ? 'var(--violet-ink)' : 'var(--muted)'}"></span><b>${s.label}</b><span class="cnt">${items.length}</span><span class="sum">${inrC(items.reduce((t, j) => t + j.amount, 0))}</span></div><div class="kcol-body">${items.map(card).join('') || '<div class="muted" style="text-align:center;padding:22px 0;font-size:12.5px">Drop a job here</div>'}</div></section>`;
    }).join('')}</div>`;
  }
  function table(list) {
    return `<div class="card flush"><div class="table-wrap"><table class="tbl"><thead><tr><th>Job</th><th>Vehicle</th><th>Customer</th><th>Services</th><th>Technician</th><th>Status</th><th>ETA</th><th class="r">Amount</th></tr></thead><tbody>${list.map((j) => {
      const v = veh(j), c = cust(j);
      return `<tr class="click" data-action="openJob" data-id="${j.id}"><td><b>${j.id}</b><small class="muted" style="display:block">${esc(D.branchById[j.branch].name)}${j.bay ? ' · Bay ' + j.bay : ''}</small></td><td><div class="cell">${ui.vehTile(v)}<div><b>${esc(v.make)} ${esc(v.model)}</b><small>${esc(v.plate)}</small></div></div></td><td>${esc(c.name)}</td><td><div class="cell" style="flex-wrap:wrap;gap:4px">${j.svcs.slice(0, 2).map(ui.svcTag).join('')}</div></td><td>${BM.avatars(j.techs.map((t) => D.staffById[t].name), 26)}</td><td>${ui.statusBadge(j.status)}</td><td class="nowrap">${j.status === 'delivered' ? fmtTime(j.deliveredAt) : until(j.eta)}</td><td class="r num"><b>${inr(j.amount)}</b></td></tr>`;
    }).join('') || `<tr><td colspan="8">${ui.empty('jobs', 'No job cards match these filters')}</td></tr>`}</tbody></table></div><div class="tbl-foot"><span>${list.length} job cards</span><span>Total ${inr(list.reduce((t, j) => t + j.amount, 0))}</span></div></div>`;
  }

  BM.pages.jobs = {
    title: 'Job Cards',
    render() {
      const all = BM.sel.jobs(), active = all.filter((j) => j.status !== 'delivered');
      return `${ui.header({
        eyebrow: 'Operations', title: 'Job Cards',
        sub: `${active.length} active · ${all.filter((j) => j.status === 'ready').length} ready for handover · ${inrC(active.reduce((t, j) => t + j.amount, 0))} of work in progress. Drag cards between stages to update them.`,
        actions: `<div class="seg" role="group" aria-label="View"><button data-action="jobView" data-v="board" class="${view === 'board' ? 'on' : ''}">${BM.icon('grid', 15)}Board</button><button data-action="jobView" data-v="list" class="${view === 'list' ? 'on' : ''}">${BM.icon('list', 15)}List</button></div><button class="btn btn-primary" data-action="newJob">${BM.icon('plus', 17)}New job card</button>`,
      })}
      <div class="filters"><div class="search">${BM.icon('search', 17)}<input class="input" id="jq" type="search" placeholder="Search job, plate, customer…" value="${esc(q)}" aria-label="Search job cards"/></div>
        <select class="select" id="jp" aria-label="Priority">${ui.opts([['all', 'All priorities'], ['high', 'High priority'], ['med', 'Medium'], ['low', 'Low']], prio)}</select>
        <select class="select" id="jc" aria-label="Service type">${ui.opts([['all', 'All service types'], ...Object.entries(D.svcCats).map(([k, v]) => [k, v.label])], cat)}</select></div>
      <div id="jobsBody"></div>`;
    },
    mount(root) {
      const paint = () => { const l = filtered(); $('#jobsBody').innerHTML = view === 'board' ? board(l) : table(l); };
      paint();
      $('#jq').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); paint(); });
      $('#jp').addEventListener('change', (e) => { prio = e.target.value; paint(); });
      $('#jc').addEventListener('change', (e) => { cat = e.target.value; paint(); });
      const body = $('#jobsBody');
      let dragId = null;
      body.addEventListener('dragstart', (e) => { const c = e.target.closest('.kcard'); if (!c) return; dragId = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
      body.addEventListener('dragend', (e) => { const c = e.target.closest('.kcard'); if (c) c.classList.remove('dragging'); $$('.kcol.over').forEach((k) => k.classList.remove('over')); });
      body.addEventListener('dragover', (e) => { const col = e.target.closest('.kcol'); if (!col) return; e.preventDefault(); $$('.kcol.over').forEach((k) => { if (k !== col) k.classList.remove('over'); }); col.classList.add('over'); });
      body.addEventListener('drop', (e) => { const col = e.target.closest('.kcol'); if (!col) return; e.preventDefault(); col.classList.remove('over'); if (dragId) { BM.moveJob(dragId, col.dataset.status, true); dragId = null; BM.refresh(); } });
    },
  };

  /* ---------- state transitions ---------- */
  const BAY_STATES = ['inspection', 'progress', 'qc'];
  BM.moveJob = (id, status, quiet) => {
    const j = D.jobById[id]; if (!j || j.status === status) return;
    const from = D.statusById[j.status].label;
    j.status = status;
    if (status === 'checkin') j.progress = 0;
    else if (status === 'inspection') j.progress = Math.max(j.progress, 6);
    else if (status === 'progress') j.progress = Math.max(j.progress, 25);
    else if (status === 'qc') j.progress = Math.max(j.progress, 92);
    else { j.progress = 100; }
    if (status === 'delivered') { j.deliveredAt = new Date(); j.advance = j.amount; }
    if (BAY_STATES.includes(status)) {
      if (!j.bay) {
        const used = new Set(D.jobs.filter((x) => x.branch === j.branch && x.bay && x.id !== j.id).map((x) => x.bay));
        for (let n = 1; n <= D.branchById[j.branch].bays; n++) if (!used.has(n)) { j.bay = n; break; }
        if (!j.bay) ui.toast('All bays are occupied', { kind: 'bad', sub: `${D.branchById[j.branch].name} has no free bay — job staged without a bay.` });
      }
    } else j.bay = null;
    const chk = ensureChecks(j); if (['ready', 'delivered'].includes(status)) chk.fill(true);
    D.activity.unshift({ icon: 'check', who: D.me.name, what: `moved ${j.id} from ${from} to ${D.statusById[status].label}`, at: new Date() });
    if (!quiet) ui.toast(`${j.id} → ${D.statusById[status].label}`, { icon: 'check' });
    else ui.toast(`${j.id} moved to ${D.statusById[status].label}`, { sub: `${veh(j).make} ${veh(j).model}`, icon: 'check' });
  };
  const ensureChecks = (j) => { if (!j.checked) { const n = D.checklistFor(j).length; j.checked = Array.from({ length: n }, (_, i) => i < j.doneChecks); } return j.checked; };
  BM.jobChecks = ensureChecks;   // shared with the client portal so both show the same work steps

  /* what happened on a job, oldest first — used by the job drawer and the client portal */
  BM.jobEvents = (j) => {
    const idx = D.STATUS.findIndex((s) => s.id === j.status), created = j.created;
    return [['Vehicle checked in', created],
      ...(idx >= 1 ? [['Pre-work inspection completed', new Date(+created + 45 * 60000)]] : []),
      ...(idx >= 2 ? [[j.bay ? 'Work started on Bay ' + j.bay : 'Work started', new Date(+created + 110 * 60000)]] : []),
      ...(idx >= 3 ? [['Moved to quality check', new Date(Date.now() - 40 * 60000)]] : []),
      ...(idx >= 4 ? [['Marked ready for delivery', new Date(Date.now() - 18 * 60000)]] : []),
      ...(idx >= 5 ? [['Delivered to customer', j.deliveredAt]] : [])];
  };

  /* ---------- job drawer ---------- */
  function drawerBody(j) {
    const v = veh(j), c = cust(j), b = D.branchById[j.branch], idx = D.STATUS.findIndex((s) => s.id === j.status);
    const items = D.checklistFor(j), chk = ensureChecks(j);
    const sub = D.jobTotal(j), gst = Math.round(sub * 0.18), total = sub + gst, due = Math.max(0, total - Math.round(j.advance * 1.18));
    const created = j.created;
    const events = BM.jobEvents(j);
    const photosAfter = j.progress >= 95;
    return `
      <div class="card" style="background:var(--surface-2);box-shadow:none;margin-bottom:20px"><div class="row" style="gap:16px;align-items:center"><div style="width:150px;flex:none">${BM.car(v.shape, v.color)}</div><div class="grow"><div class="row between" style="margin-bottom:4px"><h3 style="font-size:18px;font-weight:800;letter-spacing:-.02em">${esc(v.make)} ${esc(v.model)}</h3>${ui.statusBadge(j.status)}</div><div class="row wrap" style="gap:8px">${ui.plate(v.plate)}<span class="tag"><i style="background:${v.color};border:1px solid var(--line-2)"></i>${esc(v.colorName)} · ${v.year}</span>${ui.branchTag(j.branch)}${j.bay ? `<span class="tag">Bay ${j.bay}</span>` : ''}</div></div></div></div>
      <div class="sec-t">Progress</div>
      <div class="stepper" aria-label="Job stages">${D.STATUS.map((s, i) => `<div class="step ${i < idx ? 'done' : i === idx ? 'now' : ''}"><i>${i < idx ? BM.icon('check', 12) : i + 1}</i><span>${s.label}</span></div>`).join('')}</div>
      <div class="row between" style="margin:14px 0 6px;font-weight:700"><span>${j.progress}% complete</span><span class="muted" style="font-weight:600">${j.status === 'delivered' ? 'Delivered ' + fmtTime(j.deliveredAt) : 'ETA ' + until(j.eta)}</span></div>
      <div class="bar ${j.status === 'ready' || j.status === 'delivered' ? 'ok' : ''}"><i style="width:${j.progress}%"></i></div>
      <div class="sec-t">Customer &amp; assignment</div>
      <div class="kv">
        <div><small>Customer</small><b>${esc(c.name)}</b></div><div><small>Tier</small>${ui.tier(c.tier)}</div>
        <div><small>Phone</small><b>${esc(c.phone)}</b></div><div><small>Priority</small><b class="prio ${j.priority}">${PRIO[j.priority]}</b></div>
        <div><small>Technicians</small><div class="row" style="gap:6px">${BM.avatars(j.techs.map((t) => D.staffById[t].name), 26)}<b style="font-size:12.5px">${j.techs.map((t) => D.staffById[t].name.split(' ')[0]).join(' & ')}</b></div></div>
        <div><small>Checked in</small><b>${fmtDate(created)}, ${fmtTime(created)}</b></div>
      </div>
      <div class="sec-t">Services &amp; billing</div>
      <div class="stack" style="gap:8px">${j.svcs.map((s) => `<div class="row between">${ui.svcTag(s)}<b class="num">${inr(D.priceLine(s, j.vehId))}</b></div>`).join('')}</div>
      <div class="divider"></div>
      <div class="stack" style="gap:6px;font-size:13px"><div class="row between"><span class="muted">Subtotal</span><span class="num">${inr(sub)}</span></div><div class="row between"><span class="muted">GST 18%</span><span class="num">${inr(gst)}</span></div><div class="row between" style="font-size:15px"><b>Total</b><b class="num">${inr(total)}</b></div><div class="row between"><span class="muted">Advance received</span><span class="num">${inr(Math.round(j.advance * 1.18))}</span></div><div class="row between"><b>Balance due</b>${due ? `<b class="num" style="color:var(--warn-ink)">${inr(due)}</b>` : ui.badge('Settled', 'ok')}</div></div>
      <div class="sec-t">Work checklist · ${chk.filter(Boolean).length}/${items.length}</div>
      <div class="checklist" id="chkList">${items.map((t, i) => `<div class="ck ${chk[i] ? 'on' : ''}" data-action="toggleCheck" data-id="${j.id}" data-i="${i}" role="checkbox" aria-checked="${!!chk[i]}" tabindex="0"><i>${BM.icon('check', 13)}</i><span>${esc(t)}</span></div>`).join('')}</div>
      <div class="sec-t">Photo log</div>
      <div class="photos"><div class="photo b" data-l="Before">${BM.icon('camera', 22)}</div><div class="photo b" data-l="Before">${BM.icon('camera', 22)}</div>${photosAfter ? `<div class="photo a" data-l="After">${BM.icon('sparkles', 22)}</div>` : `<button class="photo" data-action="toast" data-msg="Photo uploaded to ${j.id}" data-icon="camera" style="border-style:dashed">${BM.icon('plus', 18)}&nbsp;Add photo</button>`}</div>
      <div class="sec-t">Timeline</div>
      <div class="tl">${events.map((e, i) => `<div class="tl-i ${i === events.length - 1 ? '' : 'mute'}">${e[0]}<small>${fmtDate(e[1])}, ${fmtTime(e[1])}</small></div>`).join('')}</div>
      <div class="sec-t">Notes</div><p class="t2">${esc(j.notes)}</p>`;
  }
  function openJob(id) {
    const j = D.jobById[id]; if (!j) return;
    const v = veh(j), nx = nextStatus(j.status);
    ui.drawer.open({
      title: j.id, sub: `${esc(cust(j).name)} · ${esc(D.branchById[j.branch].name)}`, size: '', body: drawerBody(j),
      footer: `${nx ? `<button class="btn btn-primary" data-action="advanceJob" data-id="${j.id}">${BM.icon('arrowR', 16)}Move to ${nx.label}</button>` : `<button class="btn btn-primary" data-action="jobInvoice" data-id="${j.id}">${BM.icon('receipt', 16)}View invoice</button>`}<button class="btn" data-action="toast" data-msg="WhatsApp update sent to ${esc(cust(j).name)}" data-sub="“Your ${esc(v.make)} ${esc(v.model)} is ${esc(D.statusById[j.status].label.toLowerCase())}.”" data-icon="chat">${BM.icon('chat', 16)}WhatsApp</button>${nx ? `<button class="btn btn-icon" data-action="jobInvoice" data-id="${j.id}" title="Invoice" aria-label="Invoice">${BM.icon('receipt', 16)}</button>` : ''}<button class="btn btn-icon btn-ghost" onclick="window.print()" title="Print" aria-label="Print">${BM.icon('printer', 16)}</button>`,
    });
    ui.drawer.el.classList.add('print-area');
  }
  Object.assign(BM.actions, {
    openJob: (el) => { if (el.closest('.kcard.dragging')) return; openJob(el.dataset.id); },
    jobView: (el) => { view = el.dataset.v; BM.refresh(); },
    advanceJob: (el) => { const j = D.jobById[el.dataset.id], nx = nextStatus(j.status); if (!nx) return; BM.moveJob(j.id, nx.id, true); BM.refresh(); openJob(j.id); },
    toggleCheck: (el) => {
      const j = D.jobById[el.dataset.id], chk = ensureChecks(j), i = +el.dataset.i; chk[i] = !chk[i];
      if (['inspection', 'progress', 'qc'].includes(j.status)) j.progress = Math.min(97, Math.max(4, Math.round((chk.filter(Boolean).length / chk.length) * 100)));
      const y = ui.drawer.el.querySelector('.drawer-b').scrollTop;
      ui.drawer.el.querySelector('.drawer-b').innerHTML = drawerBody(j); ui.drawer.el.querySelector('.drawer-b').scrollTop = y;
    },
    jobInvoice: (el) => { const j = D.jobById[el.dataset.id]; ui.drawer.close(true); BM.createInvoiceFromJob(j); },
  });

  /* ---------- new job modal ---------- */
  BM.actions.newJob = (preset) => {
    const pre = preset && preset.custId ? preset : {};
    const custs = D.customers.slice().sort((a, b) => a.name.localeCompare(b.name));
    const defBranch = S.branch === 'all' ? 'kochi' : S.branch;
    const body = `<form id="njForm" class="form-grid" autocomplete="off">
      ${ui.field('Customer', `<select class="select" id="njC">${custs.map((c) => `<option value="${c.id}" ${c.id === pre.custId ? 'selected' : ''}>${esc(c.name)} · ${esc(c.city)}</option>`).join('')}</select>`)}
      ${ui.field('Vehicle', '<select class="select" id="njV"></select>')}
      ${ui.field('Branch', `<select class="select" id="njB">${D.branches.map((b) => `<option value="${b.id}" ${b.id === defBranch ? 'selected' : ''}>${b.name}</option>`).join('')}</select>`)}
      ${ui.field('Priority', `<select class="select" id="njP">${ui.opts([['med', 'Medium'], ['high', 'High'], ['low', 'Low']])}</select>`)}
      ${ui.field('Services', '<div id="njS" class="stack" style="gap:6px;max-height:210px;overflow:auto;padding-right:4px"></div>', true)}
      ${ui.field('Technician', '<select class="select" id="njT"></select>')}
      ${ui.field('Promised by', `<select class="select" id="njE">${ui.opts([['0', 'Today, 6:00 PM'], ['1', 'Tomorrow'], ['2', 'In 2 days'], ['4', 'In 4 days'], ['7', 'In a week']], '1')}</select>`)}
      ${ui.field('Notes', '<textarea class="input" id="njN" placeholder="Pre-existing damage, customer requests, pickup details…"></textarea>', true)}
      <div class="full card" style="background:var(--surface-2);box-shadow:none;padding:14px 16px"><div class="row between"><span class="muted">Estimated total (before GST)</span><b class="num" id="njTot" style="font-size:20px">₹0</b></div></div></form>`;
    ui.modal.open({
      title: 'New job card', sub: 'Check a vehicle in and put it on the board', size: 'lg', body,
      footer: `<button class="btn btn-primary" data-action="njSave">${BM.icon('check', 16)}Create job card</button><button class="btn btn-ghost" data-action="closePanel">Cancel</button>`,
      onMount: (m) => {
        const $m = (s) => m.querySelector(s);
        const vehOf = () => D.vehById[$m('#njV').value];
        const fillVeh = () => { const c = D.custById[$m('#njC').value]; $m('#njV').innerHTML = c.vehicles.map((v) => `<option value="${v.id}">${esc(v.make)} ${esc(v.model)} · ${esc(v.plate)}</option>`).join(''); $m('#njB').value = c.branch; fillSvc(); fillTech(); };
        const fillSvc = () => {
          const v = vehOf(); const list = D.services.filter((s) => (s.cat === 'bike') === v.bike);
          $m('#njS').innerHTML = list.map((s) => `<label class="ck" style="padding:8px 10px"><input type="checkbox" value="${s.id}" style="accent-color:var(--accent);width:16px;height:16px"/><span style="text-decoration:none;color:var(--text);flex:1">${esc(s.name)}</span><b class="num">${inr(s.tiers[v.tier])}</b></label>`).join('');
          tot();
        };
        const fillTech = () => { $m('#njT').innerHTML = D.techs.filter((t) => t.branch === $m('#njB').value).map((t) => `<option value="${t.id}">${esc(t.name)} · ${esc(t.role)}</option>`).join(''); };
        const tot = () => { const v = vehOf(); $m('#njTot').textContent = inr([...m.querySelectorAll('#njS input:checked')].reduce((t, i) => t + D.svcById[i.value].tiers[v.tier], 0)); };
        $m('#njC').addEventListener('change', fillVeh); $m('#njV').addEventListener('change', fillSvc); $m('#njB').addEventListener('change', fillTech); $m('#njS').addEventListener('change', tot);
        fillVeh();
        if (pre.vehId) { $m('#njV').value = pre.vehId; fillSvc(); }
      },
    });
  };
  BM.actions.njSave = () => {
    const m = ui.modal.el; if (!m) return;
    const svcs = [...m.querySelectorAll('#njS input:checked')].map((i) => i.value);
    if (!svcs.length) { ui.toast('Pick at least one service', { kind: 'bad', icon: 'alert' }); return; }
    const v = D.vehById[m.querySelector('#njV').value], branch = m.querySelector('#njB').value, techId = m.querySelector('#njT').value;
    const helpers = D.techs.filter((t) => t.branch === branch && t.id !== techId);
    const eta = new Date(); eta.setDate(eta.getDate() + +m.querySelector('#njE').value); eta.setHours(18, 0, 0, 0);
    const id = 'JC-' + (Math.max(...D.jobs.map((j) => +j.id.slice(3))) + 1);
    const amount = svcs.reduce((t, s) => t + D.priceFor(s, v.tier), 0);
    const job = { id, status: 'checkin', custId: v.custId, vehId: v.id, branch, svcs, techs: [techId, helpers[0].id], bay: null, progress: 0, created: new Date(), eta, amount, priority: m.querySelector('#njP').value, advance: Math.round(amount * 0.3 / 100) * 100, notes: m.querySelector('#njN').value || 'Created from the ERP.', doneChecks: 0 };
    D.jobs.unshift(job); D.jobById[id] = job;
    D.activity.unshift({ icon: 'plus', who: D.me.name, what: `checked in ${v.make} ${v.model} as ${id}`, at: new Date() });
    ui.modal.close(); ui.toast(`${id} created`, { sub: `${v.make} ${v.model} added to Check-in`, icon: 'jobs' });
    if (location.hash === '#/jobs') BM.refresh(); else location.hash = '#/jobs';
  };
})(window.BM);
