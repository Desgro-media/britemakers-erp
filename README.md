# Britemakers ERP — demo UI

A front-end-only demo of an ERP / command centre for **Britemakers** (premium auto-detailing: Graphene, Ceramic, PPF, Borophene, sun film, interior and two-wheeler care across Kottayam, Kochi and Trivandrum).

**Run it:** double-click `index.html` (no build step, no server, no dependencies), then sign in with one of the demo accounts below. Fonts load from Google Fonts when online and fall back gracefully offline.

## Sign-in & client portal

The app opens on a sign-in screen with two tabs. Team members get the ERP; customers get a read-only portal that follows their own vehicle — they never see the ERP.

| Who | Tab | Username (or email) | Password | Lands on |
|---|---|---|---|---|
| Owner | Team | `owner` · owner@britemakers.example | `owner123` | ERP (signed in as Nikhil Raj) |
| Admin | Team | `admin` · admin@britemakers.example | `admin123` | ERP (Rahul Varghese, Branch Manager) |
| Worker | Team | `worker` · worker@britemakers.example | `worker123` | ERP (Sreejith Mohan, Master Detailer) |
| Customer | Customer | any customer's email (e.g. `aleena.jose@example.com`) or customer ID (e.g. `C-2016`) | `client123` | Client portal |

The sign-in screen lists a few demo customers (one per live stage, plus one with nothing in the studio) — tap one to fill the form.

**What a customer sees:** a live stage tracker (Received → Inspection → In progress → Quality check → Ready for pickup), % complete, estimated ready time, the work steps the technicians are ticking off, an updates timeline, the assigned team (first names), the branch with a tap-to-call button, a payment summary and their previous visits with invoice status. It never shows other customers, internal notes, margins or the ERP. Because demo state lives in memory, a job a team member moves is visible to the customer as soon as they sign in (in the same tab, before a reload).

> **Demo only.** There is no server, so sign-in is a screen-level gate, not security: the accounts and passwords are in `assets/js/auth.js` and anyone who can open the page can read them. A real deployment must authenticate and authorise on a server. To hide the demo-account list set `BM.auth.SHOW_DEMO_ACCOUNTS = false` in `auth.js`. All three team roles currently see the full ERP; the role table under Settings → Roles & access is descriptive and not enforced yet.

## What's inside

| Area | Pages |
|---|---|
| Overview | **Dashboard** — today-at-a-glance summary, KPIs, revenue vs target, service mix, live bay board, deliveries, stock alerts, AI-style suggestions |
| Operations | **Job Cards** (drag-and-drop kanban + list, checklists, photo log, timeline) · **Schedule** (bay-planner timeline, booking) · **Warranty & Care** (certificates, check-ups, claims) |
| Customers | **Customers** (CRM, vehicles, lifetime value, history) · **Leads & Social** (pipeline, sources, Instagram card) |
| Commerce | **Services** (18 packages, class-based pricing) · **Invoices** (GST invoices, print) · **Inventory** (per-branch stock, POs) |
| Organisation | **Team** (attendance, utilisation) · **Branches** (side-by-side comparison) |
| Insights & setup | **Reports** (stacked revenue, heatmap, productivity) · **Settings** (theme, accent, density, roles, integrations) |

Global: branch switcher (filters every page), `Ctrl+K` command palette, notifications, light/dark/system theme, 4 accent colours, compact density, responsive down to phones.

## Responsive behaviour

Compact scale on desktop, tested with no horizontal overflow from 320px to 1920px.

| Width | What changes |
|---|---|
| ≤ 1180px | KPI cards go 2-up; wide + narrow card pairs stack |
| ≤ 1024px | Sidebar becomes a slide-in menu (hamburger) |
| ≤ 820px | Data tables become labelled cards (labels are copied from the column headings) |
| ≤ 720px | Job/lead boards swipe sideways, bay tiles go 2-up, modals become bottom sheets, drawers go full width, filters scroll horizontally, inputs use 16px text so iOS doesn't zoom |
| ≤ 380px | Extra-tight spacing and single-column KPIs |

## Interactions that actually work (in memory)

Create job cards, customers, leads, appointments, purchase orders and invoices · drag jobs and leads between stages · tick work checklists (progress updates) · record payments · resolve warranty claims · toggle settings. State resets on reload (theme/branch/accent persist in `localStorage`).

## Structure

```
index.html
assets/css/app.css        design system (tokens, components, themes, responsive)
assets/js/core.js         namespace, state, formatters, icons, vehicle silhouettes
assets/js/data.js         seeded dummy data (relative to today's date)
assets/js/charts.js       dependency-free SVG charts (line, bars, donut, heatmap, sparkline)
assets/js/ui.js           drawers, modals, toasts, command palette, tooltips
assets/js/pages/*.js      one file per page
assets/js/app.js          ERP shell, navigation, router (started/stopped by auth.js)
assets/js/portal.js       client portal (a customer's own jobs, vehicles and invoices)
assets/js/auth.js         demo accounts, sessions, sign-in screen, which screen shows
```

## Notes

- All people, plates, invoices and figures are **fictional**. Branch phone numbers and Instagram stats come from the brand's public profile.
- Charts follow a validated categorical palette (checked for colour-blind separation in dark and light), hover tooltips, legends and a table view.
- GSTIN and certificates are labelled demo and are not legal documents.
