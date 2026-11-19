/* BRITEMAKERS ERP — core: namespace, state, formatters, icons, avatars, vehicle art */
/* auth starts closed: until auth.js signs someone in, nobody counts as staff */
window.BM = { pages: {}, actions: {}, data: {}, ui: {}, charts: {}, state: {}, util: {}, auth: { isStaff: () => false } };

(function (BM) {
  'use strict';

  /* ---------- persistence (never throws) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bm.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('bm.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  BM.store = store;

  BM.state = {
    branch: store.get('branch', 'all'),
    theme: store.get('theme', 'dark'),       // dark | light | system
    accent: store.get('accent', 'orange'),
    density: store.get('density', 'cozy'),
    collapsed: store.get('collapsed', false),
    range: '30',
  };

  /* ---------- formatters ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = (n) => (n < 0 ? '-' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
  const trim = (s) => s.replace(/\.0+$|(\.\d*[1-9])0+$/, '$1');
  const inrC = (n) => {
    const a = Math.abs(Math.round(n)), s = n < 0 ? '-' : '';
    if (a >= 1e7) return s + '₹' + trim((a / 1e7).toFixed(2)) + ' Cr';
    if (a >= 1e5) return s + '₹' + trim((a / 1e5).toFixed(a >= 1e6 ? 1 : 2)) + ' L';
    if (a >= 1e3) return s + '₹' + trim((a / 1e3).toFixed(1)) + 'K';
    return s + '₹' + a;
  };
  const num = (n) => Math.round(n).toLocaleString('en-IN');
  const D = (d) => (d instanceof Date ? d : new Date(d));
  const fmtDate = (d) => D(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  /* short date; adds a 2-digit year when it isn't the current year, so "6 Dec ’25" isn't mistaken for the future */
  const fmtDateS = (d) => { const x = D(d); return fmtDate(x) + (x.getFullYear() !== new Date().getFullYear() ? ' ’' + String(x.getFullYear()).slice(2) : ''); };
  const fmtDateY = (d) => D(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (d) => D(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(am|pm)/i, (m) => ' ' + m.trim().toUpperCase());
  const fmtDay = (d) => D(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const relTime = (d) => {
    const mins = Math.round((Date.now() - D(d).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    if (mins < 1440) return Math.round(mins / 60) + ' h ago';
    const days = Math.round(mins / 1440);
    return days === 1 ? 'yesterday' : days + ' days ago';
  };
  const until = (d) => {
    const mins = Math.round((D(d).getTime() - Date.now()) / 60000);
    if (mins < -60) return Math.round(-mins / 60) + 'h overdue';
    if (mins < 0) return 'due now';
    if (mins < 60) return 'in ' + mins + ' min';
    if (mins < 1440) return 'in ' + Math.round(mins / 60) + ' h';
    return 'in ' + Math.round(mins / 1440) + ' d';
  };
  const initials = (n) => String(n).replace(/^(Dr\.?|Mr\.?|Ms\.?)\s+/i, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  BM.util = { esc, inr, inrC, num, fmtDate, fmtDateS, fmtDateY, fmtTime, fmtDay, relTime, until, initials, cap, D };

  /* ---------- avatars ---------- */
  const AV = [['#ff6a13', '#ffa23d'], ['#4da3ff', '#8cc4ff'], ['#2dd4a0', '#7be8c6'], ['#a597ff', '#cbc3ff'], ['#ff6b8b', '#ffa0b6'], ['#ffc24b', '#ffe08f']];
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  BM.util.hash = hash;
  BM.avatar = (name, size = 36) => {
    const [a, b] = AV[hash(name) % AV.length];
    return `<span class="av" style="--s:${size}px;--g1:${a};--g2:${b}" title="${esc(name)}">${esc(initials(name))}</span>`;
  };
  BM.avatars = (names, size = 26) => `<span class="av-stack">${names.map((n) => BM.avatar(n, size)).join('')}</span>`;

  /* ---------- icons (Lucide-style, stroke 1.75) ---------- */
  const P = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1.5"/><rect width="7" height="5" x="14" y="3" rx="1.5"/><rect width="7" height="9" x="14" y="12" rx="1.5"/><rect width="7" height="5" x="3" y="16" rx="1.5"/>',
    jobs: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    team: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    down: '<path d="m6 9 6 6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', left: '<path d="m15 18-6-6 6-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
    up: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    dn: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    arrowUR: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    arrowR: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    insta: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    rupee: '<path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/>',
    activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    sun2: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
    bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    thumbs: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  };
  BM.icon = (n, size = 18, extra = '') =>
    `<svg class="ic ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.help}</svg>`;
  BM.icons = P;

  /* ---------- vehicle silhouettes (side profile) ---------- */
  const SHAPES = {
    sedan: {
      body: 'M14 62 L14 49 C14 44 17 42 22 41 L44 38 C52 29 64 23 80 21 L112 21 C128 22 140 30 150 37 L176 41 C186 43 190 47 190 53 L190 62 L167 62 A15 15 0 0 0 137 62 L63 62 A15 15 0 0 0 33 62 Z',
      glass: 'M52 38 C58 30 68 26 82 25 L112 25 C124 26 134 32 143 38 Z', pillar: 'M96 25 L97 38', wheels: [48, 152],
    },
    suv: {
      body: 'M12 62 L12 45 C12 41 14 39 18 38 L25 37 L29 31 C31 25 36 21 43 20 L116 20 C124 20 131 24 137 30 L148 38 L178 42 C186 44 190 48 190 54 L190 62 L170 62 A15 15 0 0 0 140 62 L63 62 A15 15 0 0 0 33 62 Z',
      glass: 'M33 37 L38 29 C40 25 43 23.5 47 23.5 L115 23.5 C121 23.5 127 27 133 32 L143 38 Z', pillar: 'M63 23.5 L61 37 M94 23.5 L94 37', wheels: [48, 155],
      extra: '<path d="M44 17.5 L114 17.5" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-linecap="round"/><path d="M178 55 L190 55 L190 60 L178 60 Z" fill="rgba(0,0,0,.45)"/><path d="M14 56 L34 56" stroke="rgba(0,0,0,.25)" stroke-width="3"/>',
    },
    hatch: {
      body: 'M14 62 L14 47 C14 42 17 40 23 39 L32 37 C38 28 48 22 64 21 L108 21 C124 22 136 30 146 37 L174 41 C184 43 188 47 188 53 L188 62 L165 62 A15 15 0 0 0 135 62 L63 62 A15 15 0 0 0 33 62 Z',
      glass: 'M40 37 C46 29 54 26 66 25 L108 25 C120 26 130 32 139 37 Z', pillar: 'M88 25 L89 37', wheels: [48, 150],
    },
    sport: {
      body: 'M12 62 L12 51 C12 46 16 44 22 43 L52 40 C64 33 82 29 100 29 C122 30 138 36 152 42 L178 46 C187 48 190 51 190 56 L190 62 L168 62 A15 15 0 0 0 138 62 L64 62 A15 15 0 0 0 34 62 Z',
      glass: 'M68 40 C80 34 92 32 104 32 C118 33 130 38 140 42 Z', pillar: 'M102 32 L103 41', wheels: [49, 153],
    },
  };
  const hex2 = (h) => h;
  /* shape: sedan|suv|hatch|sport|bike, color: paint hex */
  BM.car = (shape, color = '#8a8f98', cls = '') => {
    if (shape === 'bike') {
      return `<svg class="car ${cls}" viewBox="0 0 200 80" aria-hidden="true">
        <ellipse cx="100" cy="71" rx="88" ry="3.5" fill="rgba(0,0,0,.4)"/>
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="44" cy="54" r="16" stroke="#0b0b0d" stroke-width="7"/><circle cx="44" cy="54" r="16" stroke="rgba(255,255,255,.2)" stroke-width="1"/>
          <circle cx="156" cy="54" r="16" stroke="#0b0b0d" stroke-width="7"/><circle cx="156" cy="54" r="16" stroke="rgba(255,255,255,.2)" stroke-width="1"/>
          <circle cx="44" cy="54" r="9" stroke="#55555c" stroke-width="1.5"/><circle cx="156" cy="54" r="9" stroke="#55555c" stroke-width="1.5"/>
          <path d="M44 54 L104 52" stroke="#7c7c85" stroke-width="3.5"/>
          <path d="M62 38 L74 52" stroke="#9a9aa2" stroke-width="3"/>
          <path d="M156 54 L138 24" stroke="#a4a4ad" stroke-width="4"/>
          <path d="M136 22 L146 19 M140 25 L130 22" stroke="#6f6f78" stroke-width="3.5"/>
          <path d="M36 61 L88 62 L112 60" stroke="#9a9aa2" stroke-width="4.5"/>
          <path d="M140 36 Q160 30 172 48" stroke="${color}" stroke-width="4"/>
        </g>
        <path class="body" d="M92 36 C94 25 114 23 134 28 L131 38 L98 41 Z" fill="${color}"/><path d="M92 36 C94 25 114 23 134 28 L131 38 L98 41 Z" fill="url(#bm-gloss)"/>
        <path class="body" d="M40 35 L58 31 L66 33 L56 39 L42 41 Z" fill="${color}"/>
        <path d="M54 37 L94 34 L97 41 L60 43 Z" fill="#17171a" stroke="rgba(255,255,255,.12)"/>
        <rect x="98" y="40" width="30" height="19" rx="5" fill="#2a2a2f" stroke="#55555c"/><path d="M104 44 L124 44 M104 49 L124 49 M104 54 L124 54" stroke="#55555c" stroke-width="1.5"/>
        <circle cx="146" cy="32" r="5.5" fill="#ffe0ad" stroke="rgba(0,0,0,.4)"/>
        <path d="M38 36 L43 35 L43 39 L38 40 Z" fill="#ff3b30"/>
      </svg>`;
    }
    const s = SHAPES[shape] || SHAPES.sedan;
    return `<svg class="car ${cls}" viewBox="0 0 200 80" aria-hidden="true">
      <ellipse cx="102" cy="68" rx="90" ry="4" fill="rgba(0,0,0,.4)"/>
      <path class="body" d="${s.body}" fill="${hex2(color)}"/>
      <path d="${s.body}" fill="url(#bm-gloss)"/>
      <path d="${s.glass}" fill="rgba(150,190,230,.28)" stroke="rgba(0,0,0,.35)" stroke-width="1"/>
      <path d="${s.pillar}" stroke="rgba(0,0,0,.4)" stroke-width="2"/>
      ${s.extra || ''}
      <path d="M176 45 L188 48 L188 52 L178 51 Z" fill="#ffe0ad"/>
      <path d="M13 50 L19 49 L19 54 L13 54 Z" fill="#ff3b30"/>
      ${s.wheels.map((x) => `<circle cx="${x}" cy="62" r="13" fill="#0b0b0d"/><circle cx="${x}" cy="62" r="13" fill="none" stroke="rgba(255,255,255,.16)"/><circle cx="${x}" cy="62" r="6.5" fill="#3b3b42" stroke="#76767f" stroke-width="1.5"/><circle cx="${x}" cy="62" r="1.8" fill="#9b9ba4"/>`).join('')}
    </svg>`;
  };
})(window.BM);
