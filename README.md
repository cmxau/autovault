# AutoVault

A private, local-first home for your vehicles: mileage, service history, documents, expenses and reminders, stored entirely on your own device. No account, no server, no sign-up.

## Features

- **Garage**: track multiple vehicles (car, motorcycle, scooter), each with odometer, photo, and next-service target (distance and/or date, whichever comes first).
- **Timeline**: a chronological log of fuel fill-ups, services, expenses, and odometer updates per vehicle.
- **Insights**: mileage trend (best/worst/average, from real full-tank fuel entries), running cost per km/mile, and expense breakdown by category and time range.
- **Maintenance**: next-service countdown and a health score derived from your own service and document records (not a fabricated estimate).
- **Glovebox**: registration, insurance, PUC, warranty and invoices, with expiry tracking.
- **Reminders**: auto-generated from service due dates and document expiries, plus custom freeform reminders, each with configurable lead time.
- **Backup & restore**: export your entire garage as a `.autovault` file, optionally AES-GCM encrypted with a passphrase (PBKDF2-derived key); restore replaces your local data. Also export a CSV of fuel/service/expense entries.
- **Units & currency**: switch between Metric (km · L) and Imperial (mi · gal) with real conversion, and choose a display currency symbol.
- **Installable PWA**: add to home screen on Android/desktop (native install prompt) or iOS (manual Add to Home Screen), with an offline-capable service worker.
- **Personalization**: optional first-name greeting, light/dark/system theme.

## Data & privacy

Everything you enter is stored in `localStorage` on your device. AutoVault has no backend, no analytics, and no account system, so nothing you record ever leaves your browser unless you explicitly export a backup. See **Settings → Data & Privacy** in the app for details, and **Settings → About → Terms of Use** for the full terms.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React, file-based routing, SSR)
- TypeScript
- Tailwind CSS
- Motion (animations)
- Sonner (toasts)

## Development

Requires Node.js and npm.

```sh
git clone <this-repository-url>
cd autovault
npm i
npm run dev
```

Other scripts:

```sh
npm run build      # production build
npm run preview    # preview the production build
npm run lint        # eslint
npm run format      # prettier
```

## Project structure

```
src/
  routes/         # file-based pages (TanStack Router)
  components/     # UI components, organized by domain
  hooks/          # localStorage-backed state (garage data, units, prefs, onboarding)
  lib/            # store, analytics, units/format conversion, crypto, backup
public/
  icons/          # PWA icon set
  manifest.webmanifest, sw.js
.github/
  ISSUE_TEMPLATE/ # bug report & feature request templates
```

## Reporting issues

Use **Settings → About → Report a Bug / Request a Feature** in the app, or open an issue directly at [github.com/cmxau/autovault](https://github.com/cmxau/autovault/issues).
