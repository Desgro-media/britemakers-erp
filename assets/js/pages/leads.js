/* Leads & Social — enquiry pipeline, sources, Instagram presence */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, relTime } = BM.util;
  const D = BM.data, ui = BM.ui, C = BM.charts, S = BM.state, $ = BM.$, $$ = BM.$$;
  const TEMP = { hot: ['Hot', 'bad'], warm: ['Warm', 'warn'], cold: ['Cold', 'info'] };

  const lcard = (l) => `<article class="kcard" draggable="true" data-id="${l.id}" data-action="openLead" tabindex="0">
    <div class="kcard-top"><span class="row" style="gap:6px">${BM.icon(D.leadSources[l.source], 13)}${esc(l.source)}</span>${ui.badge(TEMP[l.temp][0], TEMP[l.temp][1])}</div>
    <h4 style="margin-top:10px">${esc(l.name)}</h4><div class="sub">${esc(l.vehicle)}</div>
    <div class="tags">${l.svcs.slice(0, 2).map(ui.svcTag).join('')}</div>
    <div class="kcard-f">${BM.avatar(l.owner, 24)}<span class="muted" style="font-weight:600">${relTime(l.at)}</span><b class="num">${inrC(l.value)}</b></div>${S.branch === 'all' ? `<div style="margin-top:10px">${ui.branchTag(l.branch)}</div>` : ''}</article>`;

  BM.pages.leads = {
    title: 'Leads & Social',
    render() {
      const all = BM.sel.leads(), open = all.filter((l) => !['booked', 'lost'].includes(l.stage)), booked = all.filter((l) => l.stage === 'booked');
      const pipe = open.reduce((t, l) => t + l.value, 0), conv = Math.round((booked.length / Math.max(1, all.filter((l) => l.stage !== 'new').length)) * 100);
      const src = Object.keys(D.leadSources).map((k) => ({ label: k, value: all.filter((l) => l.source === k).length, sub: inrC(all.filter((l) => l.source === k).reduce((t, l) => t + l.value, 0)), color: 'var(--c1)' })).sort((a, b) => b.value - a.value);
      const funnel = [['Enquiries', all.length], ['Contacted', all.filter((l) => l.stage !== 'new').length], ['Quote sent', all.filter((l) => ['quoted', 'booked'].includes(l.stage)).length], ['Booked', booked.length]];
      return `${ui.header({ eyebrow: 'Customers', title: 'Leads & Social', sub: 'Every Instagram DM, WhatsApp enquiry and walk-in in one pipeline — so no hot lead goes cold.', actions: `<button class="btn" data-action="toast" data-msg="Instagram inbox synced" data-sub="3 new conversations · demo" data-icon="insta">${BM.icon('refresh', 16)}Sync inbox</button><button class="btn btn-primary" data-action="newLead">${BM.icon('plus', 17)}Add lead</button>` })}
      <div class="stat-row">
        <div class="card stat"><small>Open pipeline value</small><b>${inrC(pipe)}</b><span>${open.length} live leads</span></div>
        <div class="card stat"><small>Booked this month</small><b>${booked.length}</b><span>${inrC(booked.reduce((t, l) => t + l.value, 0))} confirmed</span></div>
        <div class="card stat"><small>Enquiry → booking</small><b>${conv}%</b><span style="color:var(--ok-ink)">industry avg. ~18%</span></div>
        <div class="card stat"><small>Avg. first response</small><b>11 min</b><span>target under 15 min</span></div>
      </div>
      <div class="grid" style="margin-bottom:18px">
        <div class="card c4"><div class="card-h"><div><div class="card-t">Lead sources</div><div class="card-s">Enquiries by channel</div></div></div>${C.hbars(src.map((s, i) => ({ ...s, color: C.cat(i), sub: s.sub })), { fmt: (v) => v + (v === 1 ? ' lead' : ' leads') })}</div>
        <div class="card c4"><div class="card-h"><div><div class="card-t">Conversion funnel</div><div class="card-s">Enquiry to booked job</div></div></div>${C.hbars(funnel.map((f, i) => ({ label: f[0], value: f[1], color: `color-mix(in srgb, var(--c1) ${100 - i * 22}%, var(--surface-3))`, sub: Math.round((f[1] / funnel[0][1]) * 100) + '%' })), { fmt: (v) => String(v), max: funnel[0][1] })}</div>
        <div class="card c4 ai-card"><div class="card-h"><div><span class="pill-spark">${BM.icon('insta', 14)} Instagram</span><div class="card-s" style="margin-top:4px">@britemakers_official · connected</div></div>${ui.badge('Live', 'ok')}</div>
          <div class="mini-kpis" style="margin-top:0"><div><small>Followers</small><b>5,126</b></div><div><small>Posts</small><b>398</b></div><div><small>Following</small><b>108</b></div></div>
          <div class="ai-i"><b>“Ride. Made Bright.” campaign</b><p>Celebrity-delivery reels drove 41 DMs and 9 bookings in the last 14 days.</p><button class="btn btn-sm btn-soft" data-action="toast" data-msg="Opening Instagram insights" data-icon="insta">View insights</button></div></div>
      </div>
      <div class="board" id="leadBoard" style="grid-auto-columns:minmax(260px,1fr)"></div>`;
    },
    mount() {
      const paint = () => {
        const all = BM.sel.leads();
        $('#leadBoard').innerHTML = D.leadStages.map((s) => { const items = all.filter((l) => l.stage === s.id).sort((a, b) => b.at - a.at); return `<section class="kcol" data-stage="${s.id}"><div class="kcol-h"><b>${s.label}</b><span class="cnt">${items.length}</span><span class="sum">${inrC(items.reduce((t, l) => t + l.value, 0))}</span></div><div class="kcol-body">${items.map(lcard).join('') || '<div class="muted" style="text-align:center;padding:22px 0;font-size:12.5px">No leads</div>'}</div></section>`; }).join('');
      };
      paint();
      const b = $('#leadBoard'); let drag = null;
      b.addEventListener('dragstart', (e) => { const c = e.target.closest('.kcard'); if (c) { drag = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.setData('text/plain', drag); } });
      b.addEventListener('dragend', (e) => { const c = e.target.closest('.kcard'); if (c) c.classList.remove('dragging'); $$('.kcol.over', b).forEach((k) => k.classList.remove('over')); });
      b.addEventListener('dragover', (e) => { const c = e.target.closest('.kcol'); if (c) { e.preventDefault(); $$('.kcol.over', b).forEach((k) => { if (k !== c) k.classList.remove('over'); }); c.classList.add('over'); } });
      b.addEventListener('drop', (e) => {
        const c = e.target.closest('.kcol'); if (!c || !drag) return; e.preventDefault();
        const l = D.leads.find((x) => x.id === drag); drag = null; if (!l || l.stage === c.dataset.stage) { paint(); return; }
        l.stage = c.dataset.stage; ui.toast(`${l.name} → ${D.leadStages.find((s) => s.id === l.stage).label}`, { sub: l.stage === 'booked' ? 'Convert to a job card from the customer profile' : '', icon: 'target' }); BM.refresh();
      });
    },
  };

  Object.assign(BM.actions, {
    openLead: (el) => {
      const l = D.leads.find((x) => x.id === el.dataset.id); if (!l) return;
      ui.drawer.open({
        title: l.name, lead: BM.avatar(l.name, 48), sub: `${esc(l.vehicle)} · via ${esc(l.source)}`,
        body: `<div class="row wrap" style="gap:8px;margin-bottom:18px">${ui.badge(TEMP[l.temp][0] + ' lead', TEMP[l.temp][1])}${ui.branchTag(l.branch)}${D.leadStages.filter((s) => s.id === l.stage).map((s) => ui.badge(s.label, s.kind)).join('')}</div>
        <div class="kv"><div><small>Estimated value</small><b>${inr(l.value)}</b></div><div><small>Owner</small><b>${esc(l.owner)}</b></div><div><small>Enquired</small><b>${relTime(l.at)}</b></div><div><small>Source</small><b>${esc(l.source)}</b></div></div>
        <div class="sec-t">Interested in</div><div class="stack" style="gap:8px">${l.svcs.map((s) => `<div class="row between">${ui.svcTag(s)}<span class="muted" style="font-size:12px">from ${inr(D.svcById[s].tiers[0])}</span></div>`).join('')}</div>
        <div class="sec-t">Suggested reply</div><div class="card" style="background:var(--surface-2);box-shadow:none"><div class="wa"><span class="kpi-ico">${BM.icon('sparkles', 15)}</span><p class="t2">“Hi ${esc(l.name.split(' ')[0])}! Thanks for reaching out to Britemakers. For your ${esc(l.vehicle)}, ${esc(D.svcById[l.svcs[0]].name)} would be a great fit — can we book a free inspection this week?”</p></div></div>`,
        footer: `<button class="btn btn-primary" data-action="toast" data-msg="Reply sent to ${esc(l.name)}" data-sub="${esc(l.source)} · demo" data-icon="send">${BM.icon('send', 16)}Send reply</button><button class="btn" data-action="toast" data-msg="Quote PDF sent" data-sub="${inr(l.value)} + GST" data-icon="receipt">${BM.icon('receipt', 16)}Send quote</button><button class="btn" data-action="newAppt">${BM.icon('calendar', 16)}Book visit</button>`,
      });
    },
    newLead: () => {
      ui.modal.open({
        title: 'Add lead', sub: 'Log a new enquiry', size: 'lg',
        body: `<form class="form-grid" autocomplete="off">${ui.field('Name', '<input class="input" id="nlN" placeholder="Prospect name" autofocus/>')}${ui.field('Vehicle', '<input class="input" id="nlV" placeholder="e.g. BMW X5"/>')}
        ${ui.field('Source', `<select class="select" id="nlS">${ui.opts(Object.keys(D.leadSources))}</select>`)}${ui.field('Branch', `<select class="select" id="nlB">${D.branches.map((b) => `<option value="${b.id}" ${b.id === (S.branch === 'all' ? 'kochi' : S.branch) ? 'selected' : ''}>${b.name}</option>`).join('')}</select>`)}
        ${ui.field('Interested in', `<select class="select" id="nlI">${D.services.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>`)}${ui.field('Temperature', `<select class="select" id="nlT">${ui.opts([['warm', 'Warm'], ['hot', 'Hot'], ['cold', 'Cold']])}</select>`)}</form>`,
        footer: `<button class="btn btn-primary" data-action="nlSave">${BM.icon('check', 16)}Add to pipeline</button><button class="btn btn-ghost" data-action="closePanel">Cancel</button>`,
      });
    },
    nlSave: () => {
      const m = ui.modal.el, v = (s) => m.querySelector(s).value.trim();
      if (!v('#nlN')) { ui.toast('Please enter a name', { kind: 'bad', icon: 'alert' }); return; }
      const svc = D.svcById[v('#nlI')], l = { id: 'L-' + (900 + D.leads.length), name: v('#nlN'), vehicle: v('#nlV') || 'Vehicle TBC', svcs: [svc.id], source: v('#nlS'), stage: 'new', branch: v('#nlB'), at: new Date(), temp: v('#nlT'), value: svc.tiers[2], owner: 'Devika Suresh' };
      D.leads.unshift(l); ui.modal.close(); ui.toast('Lead added', { sub: `${l.name} · ${l.source}`, icon: 'target' });
      if (location.hash === '#/leads') BM.refresh(); else location.hash = '#/leads';
    },
  });
})(window.BM);
