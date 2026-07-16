# Tooyei website rebuild

Next.js 16 rebuild of Tooyei's multilingual flooring website, with SEO-native
English, Spanish and German routes, a Prisma content model and a protected
content administration area.

## Getting started

Copy `.env.example` to `.env.local`, provide the admin credentials and an
optional PostgreSQL `DATABASE_URL`, then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site and
[http://localhost:3000/admin/login](http://localhost:3000/admin/login) for
content administration.

Without `DATABASE_URL`, public pages use the five verified migration samples
and the admin product editor stays read-only. With PostgreSQL configured, apply
the schema and seed data before editing:

```bash
npm run db:deploy
npm run db:seed
```

Inquiry email notifications are optional. To enable them in production, set
`RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `INQUIRY_NOTIFICATION_EMAIL`. If
they are missing, inquiries are still saved and visible in the admin panel.
Public inquiry submissions are rate-limited by IP and email with
`INQUIRY_IP_LIMIT_PER_HOUR` and `INQUIRY_EMAIL_LIMIT_PER_HOUR`.
The admin inquiry detail page supports sales follow-up notes, note types and
optional next follow-up dates for timeline-based tracking.
The admin product module supports product search/filtering, status metrics,
category assignment, featured/sort controls, translation publishing and SEO
metadata editing. Product detail content is also structured into gallery media,
feature modules, specifications, application scenarios and downloadable
documents; the first editor uses Chinese bulk rows so catalog cleanup can move
quickly before adding drag-and-drop media uploads.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the migration boundary
and the next implementation slice.
