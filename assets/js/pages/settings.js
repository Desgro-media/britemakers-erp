/* Settings — workspace, appearance, notifications, roles, integrations */
(function (BM) {
  'use strict';
  const { esc } = BM.util;
  const D = BM.data, ui = BM.ui, S = BM.state, $ = BM.$;
  let tab = 'workspace';
  const notif = { lowstock: true, checkup: true, lead: true, wa: true, digest: false, invoice: true };
  const integ = { whatsapp: true, instagram: true, razorpay: true, google: true, tally: false, biometric: false };

  const TABS = [['workspace', 'Workspace'], ['appearance', 'Appearance'], ['notifications', 'Notifications'], ['roles', 'Roles & access'], ['integrations', 'Integrations']];
  const sw = (k, on, grp) => `<span class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" tabindex="0" data-action="setToggle" data-g="${grp}" data-k="${k}"></span>`;

  const panels = {
    workspace: () => `<div class="grid"><div class="card c8"><div class="card-h"><div><div class="card-t">Business profile</div><div class="card-s">Shown on invoices, certificates and customer messages</div></div></div>
      <form class="form-grid" autocomplete="off">${ui.field('Business name', '<input class="input" value="Britemakers Auto Detailing"/>')}${ui.field('Tagline', '<input class="input" value="Detailing. Protection. Perfection."/>')}${ui.field('GSTIN (demo)', '<input class="input" value="32AAAAA0000A1Z5"/>')}${ui.field('Invoice prefix', '<input class="input" value="INV-26-"/>')}${ui.field('Currency', '<select class="select"><option>INR · ₹ Indian rupee</option></select>')}${ui.field('Time zone', '<select class="select"><option>Asia/Kolkata · IST</option></select>')}${ui.field('Default GST rate', '<select class="select"><option>18%</option><option>12%</option><option>28%</option></select>')}${ui.field('Warranty check-up interval', '<select class="select"><option>Every 6 months</option><option>Every 3 months</option><option>Every 12 months</option></select>')}</form>
      <div class="row" style="margin-top:18px"><button class="btn btn-primary" data-action="toast" data-msg="Workspace settings saved" data-sub="Demo — changes are not persisted">${BM.icon('check', 16)}Save changes</button></div></div>
      <div class="card c4"><div class="card-h"><div><div class="card-t">Locations</div><div class="card-s">3 studios</div></div></div><div class="stack" style="gap:12px">${D.branches.map((b) => `<div class="row" style="gap:12px"><span class="kpi-ico" style="background:color-mix(in srgb,${b.color} 20%,transparent);color:${b.color}">${BM.icon('pin', 16)}</span><div class="grow"><b>${b.name}</b><div class="muted" style="font-size:12.5px">${b.phone} · ${b.bays} bays</div></div></div>`).join('')}</div></div></div>`,
    appearance: () => `<div class="grid"><div class="card c8"><div class="card-h"><div><div class="card-t">Theme</div><div class="card-s">Applies instantly and is remembered on this device</div></div></div>
      <div class="theme-cards">${[['dark', 'Dark', '#0d0d10'], ['light', 'Light', '#f3f1ee'], ['system', 'System', 'linear-gradient(90deg,#0d0d10 50%,#f3f1ee 50%)']].map(([k, l, bg]) => `<button class="theme-card ${S.theme === k ? 'on' : ''}" data-action="setTheme" data-v="${k}"><div class="pv" style="background:${bg}"><i></i><u></u></div>${l}</button>`).join('')}</div>
      <div class="divider"></div>
      <div class="set-row"><div><b>Accent colour</b><small>Brand orange is the default</small></div><div class="swatches">${[['orange', '#ff6a13'], ['amber', '#ffb020'], ['red', '#ff3b47'], ['blue', '#3b82ff']].map(([k, c]) => `<button class="sw ${S.accent === k ? 'on' : ''}" style="--sw:${c}" data-action="setAccent" data-v="${k}" aria-label="${k} accent" title="${k}">${S.accent === k ? BM.icon('check', 16) : ''}</button>`).join('')}</div></div>
      <div class="set-row"><div><b>Density</b><small>Compact fits more on screen</small></div><div class="seg"><button class="${S.density === 'cozy' ? 'on' : ''}" data-action="setDensity" data-v="cozy">Comfortable</button><button class="${S.density === 'compact' ? 'on' : ''}" data-action="setDensity" data-v="compact">Compact</button></div></div>
      <div class="set-row"><div><b>Collapse sidebar</b><small>Icon-only navigation rail</small></div>${sw('collapsed', S.collapsed, 'ui')}</div></div>
      <div class="card c4 ai-card"><div class="card-t">Brand notes</div><p class="t2" style="margin-top:8px">The interface borrows from Britemakers' world: deep black, Brite orange, condensed italic headlines and the chequered-flag motif from the logo.</p><div class="checker" style="height:26px;margin-top:16px;border-radius:8px;opacity:.9"></div></div></div>`,
    notifications: () => `<div class="card" style="max-width:760px"><div class="card-h"><div><div class="card-t">Alerts &amp; automations</div><div class="card-s">What the ERP tells you — and your customers</div></div></div>${[['lowstock', 'Low stock alerts', 'Notify the branch manager when an item drops below its reorder level'], ['checkup', 'Warranty check-up reminders', 'Auto-send WhatsApp reminders 14 days before each free check-up'], ['lead', 'New lead alerts', 'Ping the service advisor for every Instagram or WhatsApp enquiry'], ['wa', 'Customer status updates', 'Send a WhatsApp message when a job moves to Ready for delivery'], ['invoice', 'Payment receipts', 'Email and WhatsApp a receipt when a payment is recorded'], ['digest', 'Daily owner digest', 'A 8 PM summary of revenue, deliveries and outstanding payments']].map(([k, t, s]) => `<div class="set-row"><div><b>${t}</b><small>${s}</small></div>${sw(k, notif[k], 'notif')}</div>`).join('')}</div>`,
    roles: () => {
      const mods = ['Dashboard', 'Job Cards', 'Customers', 'Invoices', 'Inventory', 'Reports', 'Settings'];
      const roles = [['Owner', [1, 1, 1, 1, 1, 1, 1]], ['Branch Manager', [1, 1, 1, 1, 1, 1, 0]], ['Service Advisor', [1, 1, 1, 1, 0, 0, 0]], ['Technician', [0, 1, 0, 0, 0, 0, 0]], ['Accountant', [1, 0, 0, 1, 0, 1, 0]]];
      return `<div class="card flush"><div class="card-h pad"><div><div class="card-t">Role permissions</div><div class="card-s">Control which modules each role can open</div></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Role</th>${mods.map((m) => `<th style="text-align:center">${m}</th>`).join('')}</tr></thead><tbody>${roles.map(([r, p]) => `<tr><td><b>${r}</b></td>${p.map((v) => `<td style="text-align:center">${v ? `<span style="color:var(--ok-ink)">${BM.icon('check', 18)}</span>` : '<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    },
    integrations: () => `<div class="grid">${[['whatsapp', 'WhatsApp Business', 'chat', 'Status updates, reminders and quotes straight to customers'], ['instagram', 'Instagram', 'insta', 'Pull DMs and comments into Leads & Social'], ['razorpay', 'Razorpay · UPI & cards', 'card', 'Collect payments and auto-reconcile to invoices'], ['google', 'Google Business Profile', 'globe', 'Request and track reviews after every delivery'], ['tally', 'Tally Prime', 'receipt', 'Sync invoices and GST ledgers to accounting'], ['biometric', 'Biometric attendance', 'users', 'Import punch data for technician attendance']].map(([k, t, ic, s]) => `<div class="c4"><div class="card hover"><div class="row between"><span class="kpi-ico" style="width:42px;height:42px;border-radius:12px">${BM.icon(ic, 20)}</span>${ui.badge(integ[k] ? 'Connected' : 'Not connected', integ[k] ? 'ok' : '')}</div><h4 style="margin:14px 0 4px;font-size:15.5px;font-weight:800">${t}</h4><p class="muted" style="font-size:12.5px;min-height:38px">${s}</p><button class="btn btn-sm ${integ[k] ? '' : 'btn-primary'}" style="margin-top:14px" data-action="toggleInteg" data-k="${k}">${integ[k] ? 'Disconnect' : 'Connect'}</button></div></div>`).join('')}</div>`,
  };

  BM.pages.settings = {
    title: 'Settings',
    render() {
      return `${ui.header({ eyebrow: 'System', title: 'Settings', sub: 'Workspace profile, look & feel, alerts, access and integrations.' })}<div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}" data-action="setTab" data-k="${k}">${l}</button>`).join('')}</div>${panels[tab]()}`;
    },
  };
  Object.assign(BM.actions, {
    setTab: (el) => { tab = el.dataset.k; BM.refresh(); },
    setTheme: (el) => { BM.setPref('theme', el.dataset.v); BM.refresh(); },
    setAccent: (el) => { BM.setPref('accent', el.dataset.v); BM.refresh(); },
    setDensity: (el) => { BM.setPref('density', el.dataset.v); BM.refresh(); },
    setToggle: (el) => {
      const g = el.dataset.g, k = el.dataset.k;
      if (g === 'ui') { BM.setPref(k, !S[k]); BM.refresh(); return; }
      notif[k] = !notif[k]; el.classList.toggle('on', notif[k]); el.setAttribute('aria-checked', notif[k]);
      ui.toast(notif[k] ? 'Enabled' : 'Disabled', { icon: notif[k] ? 'check' : 'x' });
    },
    toggleInteg: (el) => { const k = el.dataset.k; integ[k] = !integ[k]; ui.toast(integ[k] ? 'Integration connected' : 'Integration disconnected', { sub: 'Demo — no real service is linked', icon: 'link' }); BM.refresh(); },
  });
})(window.BM);
