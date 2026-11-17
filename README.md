# Britemakers ERP — demo UI

A front-end-only demo of an ERP / command centre for **Britemakers** (premium auto-detailing: Graphene, Ceramic, PPF, Borophene, sun film, interior and two-wheeler care across Kottayam, Kochi and Trivandrum).

**Run it:** double-click `index.html` (no build step, no server, no dependencies). Fonts load from Google Fonts when online and fall back gracefully offline.

## What's inside

| Area | Pages |
|---|---|
| Overview | **Dashboard** — live hero, KPIs, revenue vs target, service mix, live bay board, deliveries, stock alerts, AI-style suggestions |
| Operations | **Job Cards** (drag-and-drop kanban + list, checklists, photo log, timeline) · **Schedule** (bay-planner timeline, booking) · **Warranty & Care** (certificates, check-ups, claims) |
| Customers | **Customers** (CRM, vehicles, lifetime value, history) · **Leads & Social** (pipeline, sources, Instagram card) |
| Commerce | **Services** (18 packages, class-based pricing) · **Invoices** (GST invoices, print) · **Inventory** (per-branch stock, POs) |
| Organisation | **Team** (attendance, utilisation) · **Branches** (side-by-side comparison) |
| Insights & setup | **Reports** (stacked revenue, heatmap, productivity) · **Settings** (theme, accent, density, roles, integrations) |

Global: branch switcher (filters every page), `Ctrl+K` command palette, notifications, light/dark/system theme, 4 accent colours, compact density, responsive down to phones.

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
assets/js/app.js          shell, navigation, router
```

## Notes

- All people, plates, invoices and figures are **fictional**. Branch phone numbers and Instagram stats come from the brand's public profile.
- Charts follow a validated categorical palette (checked for colour-blind separation in dark and light), hover tooltips, legends and a table view.
- GSTIN and certificates are labelled demo and are not legal documents.
