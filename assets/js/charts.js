/* BRITEMAKERS ERP — lightweight SVG charts (no dependencies).
   Marks follow the dataviz spec: 2px lines, ≤24px bars with 4px rounded data-ends, 2px surface gaps/rings,
   hairline solid gridlines, legend for ≥2 series, hover crosshair + tooltip, and a table view. */
(function (BM) {
  'use strict';
  const { esc } = BM.util;
  const C = BM.charts;
  let uid = 0;
  const observers = new Set();

  C.cleanup = () => { observers.forEach((o) => o.disconnect()); observers.clear(); };
  C.cat = (i) => `var(--c${(i % 6) + 1})`;

  function niceStep(raw) {
    if (!isFinite(raw) || raw <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function scaleMax(max, ticks = 4) { const step = niceStep(max / ticks); const m = step * Math.ceil(max / step || 1); return { max: m || 1, step }; }

  /* monotone cubic path through [[x,y],...] */
  function monotone(pts) {
    const n = pts.length;
    if (n < 2) return n ? `M${pts[0][0]},${pts[0][1]}` : '';
    if (n === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;
    const dx = [], m = [], t = new Array(n);
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1); }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
      d += `C${pts[i][0] + dx[i] / 3},${pts[i][1] + (t[i] * dx[i]) / 3} ${pts[i + 1][0] - dx[i] / 3},${pts[i + 1][1] - (t[i + 1] * dx[i]) / 3} ${pts[i + 1][0]},${pts[i + 1][1]}`;
    }
    return d;
  }

  C.legend = (items, o = {}) => `<div class="legend">${items.map((s) => `<span class="lg"${s.dash ? ' style="color:var(--muted)"' : ''}><i class="${o.line || s.line ? 'ln' : ''} ${s.dash ? 'dash' : ''}" style="background:${s.color}"></i><span style="color:var(--text-2)">${esc(s.name)}</span></span>`).join('')}${o.tools || ''}</div>`;

  function tableHTML(labels, series, fmt) {
    return `<div class="chart-table-wrap"><table class="chart-table"><thead><tr><th></th>${series.map((s) => `<th>${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${labels.map((l, i) => `<tr><td>${esc(l)}</td>${series.map((s) => `<td class="num">${esc(fmt(s.data[i]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function mountTip(tip, title, rows, sub) {
    tip.textContent = '';
    const t = document.createElement('div'); t.className = 'tip-t'; t.textContent = title; tip.appendChild(t);
    rows.forEach((r) => {
      const d = document.createElement('div'); d.className = 'tip-r';
      const k = document.createElement('i'); k.style.background = r.color; if (r.dash) k.style.opacity = '.6';
      const n = document.createElement('span'); n.textContent = r.name;
      const v = document.createElement('b'); v.textContent = r.value;
      d.append(k, n, v); tip.appendChild(d);
    });
    if (sub) { const s = document.createElement('div'); s.className = 'tip-sub'; s.textContent = sub; tip.appendChild(s); }
  }

  function shell(el, o, kind) {
    el.classList.add('chart');
    const multi = o.series.length >= 2;
    const tools = o.table === false ? '' : `<span class="lg-tools"><button type="button" class="btn btn-ghost btn-sm" data-ct aria-label="Toggle table view">${BM.icon('list', 15)}<span>Table</span></button></span>`;
    const lg = multi ? C.legend(o.series.map((s) => ({ name: s.name, color: s.color, dash: s.dash })), { line: kind === 'line', tools }) : (tools ? `<div class="legend" style="justify-content:flex-end;margin-bottom:4px">${tools}</div>` : '');
    el.innerHTML = `${lg}<div class="plot"></div><div class="ctip"></div>`;
    return { plot: el.querySelector('.plot'), tip: el.querySelector('.ctip'), btn: el.querySelector('[data-ct]') };
  }

  function watch(el, draw) {
    if (typeof ResizeObserver === 'undefined') return;
    let last = 0;
    const ro = new ResizeObserver(() => { const w = el.clientWidth; if (Math.abs(w - last) > 1) { last = w; draw(); } });
    ro.observe(el); observers.add(ro);
  }

  /* ---------- line / area ---------- */
  C.line = function (el, o) {
    const id = ++uid, labels = o.labels, series = o.series, fmt = o.fmt || String, axFmt = o.axFmt || fmt;
    const { plot, tip, btn } = shell(el, o, 'line');
    let tableMode = false;
    const draw = () => {
      if (tableMode) { plot.innerHTML = tableHTML(labels, series, fmt); return; }
      const W = plot.clientWidth; if (W < 80) return;
      const H = o.height || 260, m = { t: 12, r: 14, b: 30, l: o.left || 52 }, iw = W - m.l - m.r, ih = H - m.t - m.b, n = labels.length;
      const { max, step } = scaleMax(Math.max(...series.flatMap((s) => s.data), 1));
      const X = (i) => m.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1)), Y = (v) => m.t + ih - (v / max) * ih;
      const ticks = []; for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
      const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / (o.xw || 64)))));
      let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'Line chart')}"><defs>`;
      series.forEach((s, si) => { if (s.area) svg += `<linearGradient id="g${id}_${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${s.color};stop-opacity:.22"/><stop offset="1" style="stop-color:${s.color};stop-opacity:.02"/></linearGradient>`; });
      svg += '</defs>';
      ticks.forEach((v) => { svg += `<line class="${v === 0 ? 'base' : 'gl'}" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${m.l - 10}" y="${Y(v) + 4}" text-anchor="end">${esc(axFmt(v))}</text>`; });
      /* x labels: every k-th, always ending on the latest point; drop the neighbour if the two would touch */
      const lab = []; for (let i = 0; i < n; i += every) lab.push(i);
      if (lab[lab.length - 1] !== n - 1) { if (lab.length > 1 && (n - 1 - lab[lab.length - 1]) * (iw / Math.max(1, n - 1)) < (o.xw || 64) * 0.9) lab.pop(); lab.push(n - 1); }
      lab.forEach((i) => { svg += `<text class="ax" x="${X(i)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(labels[i])}</text>`; });
      series.forEach((s, si) => {
        const pts = s.data.map((v, i) => [X(i), Y(v)]), d = monotone(pts);
        if (s.area) svg += `<path d="${d}L${X(n - 1)},${Y(0)}L${X(0)},${Y(0)}Z" fill="url(#g${id}_${si})"/>`;
        svg += `<path d="${d}" fill="none" style="stroke:${s.color}" stroke-width="${s.dash ? 1.5 : 2}" stroke-linecap="round" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 5" opacity=".8"' : ''}/>`;
      });
      const main = series.find((s) => !s.dash) || series[0];
      svg += `<circle class="mk" cx="${X(n - 1)}" cy="${Y(main.data[n - 1])}" r="4" style="fill:${main.color}"/>`;
      svg += `<g class="hv" style="opacity:0;transition:opacity .12s"><line x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" style="stroke:var(--text-2)" stroke-width="1" opacity=".45"/>${series.filter((s) => !s.dash).map((s) => `<circle class="mk" r="4.5" cx="0" cy="0" style="fill:${s.color}"/>`).join('')}</g>`;
      svg += `<rect class="hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" style="cursor:crosshair"/></svg>`;
      plot.innerHTML = svg;
      const hv = plot.querySelector('.hv'), vl = hv.querySelector('line'), dots = [...hv.querySelectorAll('circle')], hit = plot.querySelector('.hit');
      const show = (clientX) => {
        const r = plot.getBoundingClientRect();
        const i = Math.max(0, Math.min(n - 1, Math.round(n === 1 ? 0 : ((clientX - r.left - m.l) / iw) * (n - 1))));
        const x = X(i); vl.setAttribute('x1', x); vl.setAttribute('x2', x);
        series.filter((s) => !s.dash).forEach((s, k) => dots[k].setAttribute('transform', `translate(${x},${Y(s.data[i])})`));
        hv.style.opacity = 1;
        mountTip(tip, o.tipTitle ? o.tipTitle(i) : labels[i], series.map((s) => ({ name: s.name, color: s.color, dash: s.dash, value: fmt(s.data[i]) })), o.tipSub ? o.tipSub(i) : '');
        tip.classList.add('on');
        const tw = tip.offsetWidth; let left = x + 16; if (left + tw > W - 4) left = x - tw - 16; tip.style.left = Math.max(4, left) + 'px'; tip.style.top = (el.querySelector('.plot').offsetTop + m.t + 6) + 'px';
      };
      const hide = () => { hv.style.opacity = 0; tip.classList.remove('on'); };
      hit.addEventListener('pointermove', (e) => show(e.clientX)); hit.addEventListener('pointerleave', hide); hit.addEventListener('pointerdown', (e) => show(e.clientX));
    };
    if (btn) btn.addEventListener('click', () => { tableMode = !tableMode; btn.querySelector('span').textContent = tableMode ? 'Chart' : 'Table'; tip.classList.remove('on'); draw(); });
    draw(); watch(el, draw);
  };

  /* ---------- columns: grouped or stacked ---------- */
  C.bars = function (el, o) {
    const labels = o.labels, series = o.series, fmt = o.fmt || String, axFmt = o.axFmt || fmt, ns = series.length;
    const { plot, tip, btn } = shell(el, o, 'bar');
    let tableMode = false;
    const rtop = (x, y, w, h, r) => { r = Math.min(r, w / 2, h); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };
    const draw = () => {
      if (tableMode) { plot.innerHTML = tableHTML(labels, series, fmt); return; }
      const W = plot.clientWidth; if (W < 80) return;
      const H = o.height || 240, m = { t: 16, r: 8, b: 28, l: o.left || 52 }, iw = W - m.l - m.r, ih = H - m.t - m.b, n = labels.length, band = iw / n;
      const tot = labels.map((_, i) => (o.stacked ? series.reduce((t, s) => t + s.data[i], 0) : Math.max(...series.map((s) => s.data[i]))));
      const { max, step } = scaleMax(Math.max(...tot, 1));
      const Y = (v) => m.t + ih - (v / max) * ih;
      const ticks = []; for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
      const bw = o.stacked || ns === 1 ? Math.min(24, band * 0.62) : Math.min(24, (band * 0.72) / ns - 2);
      const groupW = o.stacked ? bw : bw * ns + (ns - 1) * 2;
      const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / (o.xw || 46)))));
      let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'Bar chart')}">`;
      ticks.forEach((v) => { svg += `<line class="${v === 0 ? 'base' : 'gl'}" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${m.l - 10}" y="${Y(v) + 4}" text-anchor="end">${esc(axFmt(v))}</text>`; });
      labels.forEach((l, i) => {
        const cx = m.l + band * i + band / 2;
        svg += `<rect class="hb" data-i="${i}" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" rx="8" style="fill:var(--surface-2)" opacity="0"/>`;
        if (i % every === 0) svg += `<text class="ax" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`;
        if (o.stacked) {
          let acc = 0; const live = series.map((s, k) => ({ s, k, v: s.data[i] })).filter((d) => d.v > 0);
          live.forEach((d, idx) => {
            const y1 = Y(acc + d.v), y0 = Y(acc), top = idx === live.length - 1;
            const yy = y1 + (top ? 0 : 1), hh = y0 - (idx === 0 ? 0 : 1) - yy;
            if (hh > 0.5) svg += top ? `<path d="${rtop(cx - bw / 2, yy, bw, hh, 4)}" style="fill:${d.s.color}"/>` : `<rect x="${cx - bw / 2}" y="${yy}" width="${bw}" height="${hh}" style="fill:${d.s.color}"/>`;
            acc += d.v;
          });
        } else {
          series.forEach((s, k) => {
            const x = cx - groupW / 2 + k * (bw + 2), y = Y(s.data[i]), h = m.t + ih - y;
            if (h > 0.5) svg += `<path d="${rtop(x, y, bw, h, 4)}" style="fill:${s.color}"/>`;
          });
          if (ns === 1 && o.valueLabels && n <= 9) svg += `<text class="ax" style="fill:var(--text-2);font-weight:700" x="${cx}" y="${Y(series[0].data[i]) - 6}" text-anchor="middle">${esc(axFmt(series[0].data[i]))}</text>`;
        }
        svg += `<rect class="hit" data-i="${i}" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" fill="transparent"/>`;
      });
      svg += '</svg>';
      plot.innerHTML = svg;
      const hbs = [...plot.querySelectorAll('.hb')];
      plot.querySelectorAll('.hit').forEach((h) => {
        const i = +h.dataset.i;
        const on = () => {
          hbs.forEach((b, k) => { b.style.opacity = k === i ? 1 : 0; });
          const rows = series.map((s) => ({ name: s.name, color: s.color, value: fmt(s.data[i]) }));
          if (o.stacked && ns > 1) rows.push({ name: 'Total', color: 'transparent', value: fmt(tot[i]) });
          mountTip(tip, o.tipTitle ? o.tipTitle(i) : labels[i], rows, o.tipSub ? o.tipSub(i) : '');
          tip.classList.add('on');
          const cx = m.l + band * i + band / 2, tw = tip.offsetWidth; let left = cx + band / 2 + 6; if (left + tw > W - 4) left = cx - band / 2 - tw - 6;
          tip.style.left = Math.max(4, left) + 'px'; tip.style.top = (plot.offsetTop + m.t + 6) + 'px';
        };
        h.addEventListener('pointermove', on); h.addEventListener('pointerdown', on);
        h.addEventListener('pointerleave', () => { hbs.forEach((b) => { b.style.opacity = 0; }); tip.classList.remove('on'); });
      });
    };
    if (btn) btn.addEventListener('click', () => { tableMode = !tableMode; btn.querySelector('span').textContent = tableMode ? 'Chart' : 'Table'; tip.classList.remove('on'); draw(); });
    draw(); watch(el, draw);
  };

  /* ---------- donut (static HTML + delegated hover) ---------- */
  C.donut = function (items, o = {}) {
    const size = o.size || 176, thick = o.thick || 22, r = (size - thick) / 2, circ = 2 * Math.PI * r, total = items.reduce((t, i) => t + i.value, 0) || 1;
    const fmt = o.fmt || ((v) => v), gap = 2.5;
    let acc = 0;
    const segs = items.map((it, i) => {
      const len = (it.value / total) * circ, dash = Math.max(0, len - gap);
      const s = `<circle class="seg" data-seg="${i}" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${thick}" style="stroke:${it.color}" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-acc + gap / 2}" data-tip="${esc(it.label)}|${esc(fmt(it.value))}|${Math.round((it.value / total) * 100)}% of total"/>`;
      acc += len; return s;
    }).join('');
    const topTxt = o.top != null ? o.top : fmt(total);
    return `<div class="donut-wrap"><div class="donut" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" role="img" aria-label="${esc(o.label || 'Donut chart')}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" style="stroke:var(--surface-3)" stroke-width="${thick}"/>${segs}</svg>
      <div class="donut-c" data-top="${esc(topTxt)}" data-sub="${esc(o.sub || '')}"><b>${esc(topTxt)}</b><span>${esc(o.sub || '')}</span></div></div>
      <div class="dl">${items.map((it, i) => `<div class="dl-i" data-seg="${i}" data-v="${esc(fmt(it.value))}" data-n="${esc(it.label)}"><i style="background:${it.color}"></i><span>${esc(it.label)}</span><b>${esc(fmt(it.value))}</b><small>${Math.round((it.value / total) * 100)}%</small></div>`).join('')}</div></div>`;
  };
  const donutHover = (e, on) => {
    const t = e.target.closest && e.target.closest('[data-seg]'); if (!t) return;
    const w = t.closest('.donut-wrap'); if (!w) return;
    const i = t.dataset.seg, d = w.querySelector('.donut'), c = w.querySelector('.donut-c');
    w.querySelectorAll('circle.seg').forEach((s) => s.classList.toggle('on', on && s.dataset.seg === i));
    w.querySelectorAll('.dl-i').forEach((s) => s.classList.toggle('on', on && s.dataset.seg === i));
    d.classList.toggle('hov', on);
    const row = w.querySelector(`.dl-i[data-seg="${i}"]`);
    c.querySelector('b').textContent = on ? row.dataset.v : c.dataset.top;
    c.querySelector('span').textContent = on ? row.dataset.n : c.dataset.sub;
  };
  document.addEventListener('pointerover', (e) => donutHover(e, true));
  document.addEventListener('pointerout', (e) => donutHover(e, false));

  /* ---------- horizontal bars (static HTML) ---------- */
  C.hbars = function (items, o = {}) {
    const max = o.max || Math.max(...items.map((i) => i.value), 1), fmt = o.fmt || ((v) => v);
    return `<div class="hb">${items.map((it) => `<div class="hb-r" data-tip="${esc(it.label)}|${esc(fmt(it.value))}|${esc(it.sub || '')}"><div class="lbl">${it.color ? `<i style="background:${it.color}"></i>` : ''}<span class="ellipsis">${esc(it.label)}</span>${it.sub ? `<span class="sub ellipsis">${esc(it.sub)}</span>` : ''}</div><div class="val">${esc(fmt(it.value))}</div><div class="trk"><i style="width:${Math.max(2, (it.value / max) * 100)}%;background:${it.color || 'var(--accent)'}"></i></div></div>`).join('')}</div>`;
  };

  /* ---------- sparkline ---------- */
  C.spark = function (vals, o = {}) {
    const w = 100, h = 32, min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 8)]);
    const d = monotone(pts), col = o.color || 'var(--accent)';
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${d}L${w},${h}L0,${h}Z" style="fill:${col};opacity:.1"/><path class="l" d="${d}" style="stroke:${col}"/></svg>`;
  };

  /* ---------- ring gauge ---------- */
  C.ring = function (pct, o = {}) {
    const size = o.size || 72, st = o.stroke || 8, r = (size - st) / 2, circ = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
    const col = o.color || (p >= 90 ? 'var(--warn)' : 'var(--accent)');
    return `<span class="ring" style="width:${size}px;height:${size}px" role="img" aria-label="${p}%"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" style="stroke:var(--surface-3)" stroke-width="${st}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" style="stroke:${col}" stroke-width="${st}" stroke-linecap="round" stroke-dasharray="${(p / 100) * circ} ${circ}"/></svg><b style="font-size:${Math.round(size * 0.26)}px">${o.label != null ? esc(o.label) : Math.round(p) + '%'}</b></span>`;
  };

  /* ---------- heatmap (one-hue sequential) ---------- */
  C.heat = function (rows, cols, vals, o = {}) {
    const flat = vals.flat(), min = Math.min(...flat), max = Math.max(...flat), fmt = o.fmt || ((v) => v + '%');
    let h = `<div class="heat" style="grid-template-columns:42px repeat(${cols.length},minmax(0,1fr))"><span></span>${cols.map((c) => `<span class="heat-l" style="justify-content:center">${esc(c)}</span>`).join('')}`;
    rows.forEach((r, ri) => {
      h += `<span class="heat-l">${esc(r)}</span>`;
      vals[ri].forEach((v, ci) => { const k = 12 + (88 * (v - min)) / (max - min || 1); h += `<div class="heat-c" tabindex="0" style="background:color-mix(in srgb,var(--c1) ${k.toFixed(0)}%,var(--surface-3))" data-tip="${esc(r)} · ${esc(cols[ci])}|${esc(fmt(v))}|${esc(o.unit || 'bay utilisation')}"></div>`; });
    });
    return h + `</div><div class="heat-scale">Low<i></i>High</div>`;
  };
})(window.BM);
