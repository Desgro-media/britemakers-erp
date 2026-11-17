/* Team — technicians, attendance, performance */
(function (BM) {
  'use strict';
  const { esc, inr, inrC, fmtDate, fmtDateY, until } = BM.util;
  const D = BM.data, ui = BM.ui, C = BM.charts, S = BM.state, $ = BM.$;
  let q = '', role = 'all', view = 'cards';
  const ATT = { present: ['Present', 'ok'], late: ['Late · 9:42', 'warn'], leave: ['On leave', ''] };
  const list = () => BM.sel.staff().filter((s) => (role === 'all' || s.role === role) && (!q || (s.name + s.role).toLowerCase().includes(q)));

  const card = (s) => `<article class="card hover" data-action="openStaff" data-id="${s.id}" tabindex="0" style="cursor:pointer">
    <div class="row" style="align-items:flex-start;gap:14px">${BM.avatar(s.name, 54)}<div class="grow" style="min-width:0"><b class="ellipsis" style="display:block;font-size:15px">${esc(s.name)}</b><div class="muted" style="font-size:12.5px">${esc(s.role)}</div><div style="margin-top:6px">${s.branch === 'all' ? '<span class="tag">Head office</span>' : ui.branchTag(s.branch)}</div></div>${ui.badge(ATT[s.attendance][0], ATT[s.attendance][1])}</div>
    ${s.tech ? `<div class="row wrap" style="gap:6px;margin:14px 0">${s.skills.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>
    <div class="mini-kpis" style="margin:0"><div><small>Jobs · month</small><b>${s.jobs}</b></div><div><small>Rating</small><b>${s.rating}</b></div><div><small>Utilisation</small><b>${s.util}%</b></div></div>` : `<div class="muted" style="margin-top:14px;font-size:12.5px">${BM.icon('phone', 13)} ${esc(s.phone)}</div>`}
  </article>`;
  const table = (l) => `<div class="card flush"><div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Attendance</th><th class="r">Jobs</th><th class="r">Rating</th><th class="r">Utilisation</th><th class="r">Revenue</th></tr></thead><tbody>${l.map((s) => `<tr class="click" data-action="openStaff" data-id="${s.id}"><td><div class="cell">${BM.avatar(s.name, 34)}<b>${esc(s.name)}</b></div></td><td>${esc(s.role)}</td><td>${s.branch === 'all' ? 'Head office' : esc(D.branchById[s.branch].name)}</td><td>${ui.badge(ATT[s.attendance][0], ATT[s.attendance][1])}</td><td class="r num">${s.tech ? s.jobs : '—'}</td><td class="r num">${s.tech ? s.rating : '—'}</td><td class="r num">${s.tech ? s.util + '%' : '—'}</td><td class="r num">${s.tech ? inrC(s.revenue) : '—'}</td></tr>`).join('')}</tbody></table></div></div>`;

  BM.pages.team = {
    title: 'Team',
    render() {
      const all = BM.sel.staff(), techs = all.filter((s) => s.tech), l = list();
      const cnt = (k) => all.filter((s) => s.attendance === k).length;
      const roles = [...new Set(all.map((s) => s.role))];
      const top = techs.slice().sort((a, b) => b.util - a.util).slice(0, 7);
      return `${ui.header({ eyebrow: 'Organisation', title: 'Team', sub: 'Certified detailers, installers and front-of-house across the network — with live attendance and performance.', actions: `<button class="btn" data-action="toast" data-msg="Roster exported" data-sub="team-roster.xlsx" data-icon="download">${BM.icon('download', 16)}Export</button><button class="btn btn-primary" data-action="toast" data-msg="Invite link copied" data-sub="Demo — no email is sent" data-icon="userPlus">${BM.icon('userPlus', 17)}Add member</button>` })}
      <div class="grid" style="margin-bottom:18px">
        <div class="card c4"><div class="card-h"><div><div class="card-t">Attendance today</div><div class="card-s">${all.length} team members</div></div></div>${C.donut([{ label: 'Present', value: cnt('present'), color: 'var(--ok)' }, { label: 'Late', value: cnt('late'), color: 'var(--warn)' }, { label: 'On leave', value: cnt('leave'), color: 'var(--muted)' }], { size: 150, thick: 18, top: Math.round(((cnt('present') + cnt('late')) / all.length) * 100) + '%', sub: 'at work', label: 'Attendance' })}</div>
        <div class="card c8"><div class="card-h"><div><div class="card-t">Technician utilisation</div><div class="card-s">Share of working hours on billable jobs this month</div></div></div>${C.hbars(top.map((t) => ({ label: t.name, sub: t.role, value: t.util, color: 'var(--c1)' })), { fmt: (v) => v + '%', max: 100 })}</div>
      </div>
      <div class="filters"><div class="search">${BM.icon('search', 17)}<input class="input" id="tq" type="search" placeholder="Search team…" value="${esc(q)}" aria-label="Search team"/></div><select class="select" id="tr" aria-label="Role">${ui.opts([['all', 'All roles'], ...roles.map((r) => [r, r])], role)}</select>
        <div class="seg" style="margin-left:auto" role="group" aria-label="View"><button data-action="teamView" data-v="cards" class="${view === 'cards' ? 'on' : ''}">${BM.icon('grid', 15)}Cards</button><button data-action="teamView" data-v="table" class="${view === 'table' ? 'on' : ''}">${BM.icon('list', 15)}Table</button></div></div>
      <div id="tBody"></div>`;
    },
    mount() {
      const paint = () => { const l = list(); $('#tBody').innerHTML = view === 'cards' ? `<div class="grid">${l.map((s) => `<div class="c4">${card(s)}</div>`).join('')}</div>` : table(l); };
      paint();
      $('#tq').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); paint(); });
      $('#tr').addEventListener('change', (e) => { role = e.target.value; paint(); });
    },
  };
  Object.assign(BM.actions, {
    teamView: (el) => { view = el.dataset.v; BM.refresh(); },
    openStaff: (el) => {
      const s = D.staffById[el.dataset.id]; if (!s) return;
      const jobs = D.jobs.filter((j) => j.techs.includes(s.id)).slice(0, 4);
      ui.drawer.open({
        title: s.name, lead: BM.avatar(s.name, 52), sub: `${esc(s.role)} · ${s.branch === 'all' ? 'Head office' : esc(D.branchById[s.branch].name)}`,
        body: `<div class="row wrap" style="gap:8px;margin-bottom:18px">${ui.badge(ATT[s.attendance][0], ATT[s.attendance][1])}${s.cert ? `<span class="tag">${BM.icon('shield', 12)} ${esc(s.cert)}</span>` : ''}</div>
        ${s.tech ? `<div class="mini-kpis"><div><small>Jobs · month</small><b>${s.jobs}</b></div><div><small>Revenue</small><b>${inrC(s.revenue)}</b></div><div><small>Rating</small><b>${s.rating} ★</b></div></div>
        <div class="sec-t">Performance vs target</div><div class="stack" style="gap:14px"><div><div class="row between" style="font-size:12.5px;margin-bottom:6px"><b>Utilisation</b><span class="num">${s.util}% / 85% target</span></div><div class="bar ${s.util >= 85 ? 'ok' : ''}"><i style="width:${s.util}%"></i></div></div><div><div class="row between" style="font-size:12.5px;margin-bottom:6px"><b>Jobs completed</b><span class="num">${s.jobs} / 32 target</span></div><div class="bar ${s.jobs >= 32 ? 'ok' : ''}"><i style="width:${Math.min(100, (s.jobs / 32) * 100)}%"></i></div></div><div><div class="row between" style="font-size:12.5px;margin-bottom:6px"><b>Customer rating</b><span class="num">${s.rating} / 5</span></div><div class="bar ok"><i style="width:${(s.rating / 5) * 100}%"></i></div></div></div>
        <div class="sec-t">Skills</div><div class="row wrap" style="gap:6px">${s.skills.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>
        <div class="sec-t">Current assignments</div><div class="stack" style="gap:10px">${jobs.map((j) => { const v = D.vehById[j.vehId]; return `<div class="row" style="gap:12px">${ui.vehTile(v)}<div class="grow"><b>${esc(v.make)} ${esc(v.model)}</b><small class="muted" style="display:block">${j.id} · ${until(j.eta)}</small></div>${ui.statusBadge(j.status)}</div>`; }).join('') || '<span class="muted">No active jobs</span>'}</div>` : ''}
        <div class="sec-t">Details</div><div class="kv"><div><small>Phone</small><b>${esc(s.phone)}</b></div><div><small>Joined</small><b>${fmtDateY(s.joined)}</b></div></div>`,
        footer: `<button class="btn btn-primary" data-action="toast" data-msg="Message sent to ${esc(s.name.split(' ')[0])}" data-icon="chat">${BM.icon('chat', 16)}Message</button><button class="btn" data-action="toast" data-msg="Shift roster opened" data-icon="calendar">${BM.icon('calendar', 16)}View roster</button>`,
      });
    },
  });
})(window.BM);
