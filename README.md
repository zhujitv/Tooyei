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

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the migration boundary
and the next implementation slice.
