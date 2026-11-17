/* Services — catalogue & pricing */
(function (BM) {
  'use strict';
  const { esc, inr, inrC } = BM.util;
  const D = BM.data, ui = BM.ui, S = BM.state, $ = BM.$;
  let cat = 'all', view = 'cards';

  const card = (s) => {
    const c = D.svcCats[s.cat], labels = s.cat === 'bike' ? ['Commuter', 'Mid', 'Premium', 'Super'] : ['Hatch', 'Sedan', 'SUV', 'Luxury'];
    return `<article class="card hover svc-card" style="--sc:${c.color}" data-action="openService" data-id="${s.id}" tabindex="0">
      <div class="row between"><span class="svc-ic">${BM.icon(c.icon, 22)}</span><span class="tag"><i style="background:${c.color}"></i>${c.label}</span></div>
      <div><h4>${esc(s.name)}</h4><p style="margin-top:6px">${esc(s.blurb)}</p></div>
      <div class="price-tbl">${s.tiers.map((p, i) => `<div><small>${labels[i]}</small><b>${inrC(p)}</b></div>`).join('')}</div>
      <div class="row between" style="font-size:12.5px"><span class="muted">${BM.icon('clock', 13)} ${s.dur >= 8 ? Math.round(s.dur / 8 * 10) / 10 + ' days' : s.dur + ' h'}</span><span class="muted">${s.warranty ? BM.icon('shield', 13) + ' ' + s.warranty + '-yr warranty' : 'No warranty'}</span><b style="color:var(--ok-ink)">${s.margin}% margin</b></div></article>`;
  };
  const table = (l) => `<div class="card flush"><div class="table-wrap"><table class="tbl"><thead><tr><th>Service</th><th>Category</th><th class="r">Hatch</th><th class="r">Sedan</th><th class="r">SUV</th><th class="r">Luxury</th><th>Duration</th><th>Warranty</th><th class="r">Margin</th></tr></thead><tbody>${l.map((s) => `<tr class="click" data-action="openService" data-id="${s.id}"><td><b>${esc(s.name)}</b></td><td>${`<span class="tag"><i style="background:${D.svcCats[s.cat].color}"></i>${D.svcCats[s.cat].label}</span>`}</td>${s.tiers.map((p) => `<td class="r num">${inr(p)}</td>`).join('')}<td>${s.dur >= 8 ? Math.round(s.dur / 8 * 10) / 10 + ' d' : s.dur + ' h'}</td><td>${s.warranty ? s.warranty + ' yr' : '—'}</td><td class="r"><b style="color:var(--ok-ink)">${s.margin}%</b></td></tr>`).join('')}</tbody></table></div></div>`;

  BM.pages.services = {
    title: 'Services',
    render() {
      const l = D.services.filter((s) => cat === 'all' || s.cat === cat);
      return `${ui.header({ eyebrow: 'Commerce', title: 'Services & Pricing', sub: 'Detailing. Protection. Perfection. — the full package catalogue with class-based pricing, duration, warranty and margin.', actions: `<div class="seg" role="group" aria-label="View"><button data-action="svcView" data-v="cards" class="${view === 'cards' ? 'on' : ''}">${BM.icon('grid', 15)}Cards</button><button data-action="svcView" data-v="table" class="${view === 'table' ? 'on' : ''}">${BM.icon('list', 15)}Price list</button></div><button class="btn btn-primary" data-action="toast" data-msg="Package editor opens here" data-sub="Demo UI — pricing is read-only" data-icon="edit">${BM.icon('plus', 17)}New package</button>` })}
      <div class="filters"><div class="chips">${[['all', 'All services', D.services.length], ...Object.entries(D.svcCats).map(([k, v]) => [k, v.label, D.services.filter((s) => s.cat === k).length])].map(([k, l, n]) => `<button class="chip-btn ${cat === k ? 'on' : ''}" data-action="svcCat" data-c="${k}">${l} <small>${n}</small></button>`).join('')}</div></div>
      ${view === 'cards' ? `<div class="grid">${l.map((s) => `<div class="c4">${card(s)}</div>`).join('')}</div>` : table(l)}`;
    },
  };
  Object.assign(BM.actions, {
    svcCat: (el) => { cat = el.dataset.c; BM.refresh(); },
    svcView: (el) => { view = el.dataset.v; BM.refresh(); },
    openService: (el) => {
      const s = D.svcById[el.dataset.id], c = D.svcCats[s.cat];
      const labels = s.cat === 'bike' ? D.bikeClasses : D.classes;
      const used = D.inventory.filter((i) => (s.cat === 'coating' && i.cat === 'Coatings') || (s.cat === 'ppf' && i.cat === 'Film' && /PPF|Colour/.test(i.name)) || (s.cat === 'film' && /Sun Film/.test(i.name)) || (s.cat === 'interior' && ['Interior', 'Chemicals'].includes(i.cat)) || (s.cat === 'exterior' && ['Polish', 'Chemicals'].includes(i.cat)) || (s.cat === 'bike' && i.cat === 'Coatings')).slice(0, 4);
      ui.drawer.open({
        title: s.name, lead: `<span class="svc-ic" style="--sc:${c.color}">${BM.icon(c.icon, 22)}</span>`, sub: c.label,
        body: `<p class="t2" style="margin-bottom:18px">${esc(s.blurb)}</p>
        <div class="sec-t">Pricing by vehicle class</div><div class="stack" style="gap:8px">${s.tiers.map((p, i) => `<div class="row between" style="padding:10px 14px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line)"><b>${labels[i]}</b><b class="num">${inr(p)}</b></div>`).join('')}</div>
        <div class="sec-t">Details</div><div class="kv"><div><small>Typical duration</small><b>${s.dur >= 8 ? (s.dur / 8).toFixed(1) + ' working days' : s.dur + ' hours'}</b></div><div><small>Warranty</small><b>${s.warranty ? s.warranty + ' years' : 'Not applicable'}</b></div><div><small>Gross margin</small><b style="color:var(--ok-ink)">${s.margin}%</b></div><div><small>GST</small><b>18%</b></div></div>
        <div class="sec-t">Materials consumed</div><div class="stack" style="gap:8px">${used.map((i) => `<div class="row between"><span>${esc(i.name)}</span>${ui.badge(D.stockStatus(i, S.branch) === 'ok' ? 'In stock' : 'Low', D.stockStatus(i, S.branch) === 'ok' ? 'ok' : 'warn')}</div>`).join('') || '<span class="muted">Consumables only</span>'}</div>`,
        footer: `<button class="btn btn-primary" data-action="newJob">${BM.icon('plus', 16)}Create job with this service</button><button class="btn" data-action="toast" data-msg="Quote template copied" data-icon="copy">${BM.icon('copy', 16)}Copy quote</button>`,
      });
    },
  });
})(window.BM);
