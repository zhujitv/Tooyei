# Tooyei rebuild architecture

## Current implementation slice

- Next.js 16 App Router and React Server Components
- Tailwind CSS v4 with shadcn/ui primitives
- English root URLs plus Spanish and German path locales
- Typed product content with five real migration samples
- Static generation and one-hour ISR-ready product pages
- Canonical, hreflang, x-default, sitemap and robots generation
- Local copies of first-party migration images
- Prisma 7 schema for products, translations, articles, FAQs, inquiries, media, redirects and audit logs
- Database-first content repository with a build-safe sample fallback until `DATABASE_URL` is configured
- Signed, HTTP-only admin sessions with server-side protection for every `/admin/*` management route
- Content operations dashboard at `/admin/content`
- Product translation and publishing workflow at `/admin/products`, with an explicit read-only fallback until PostgreSQL is configured

## Content boundary

Interface labels live in the application i18n layer. Products, articles, FAQs,
media and SEO fields will move to PostgreSQL through Prisma. The typed sample
repository in `src/lib/content.ts` deliberately mirrors that future boundary so
page components do not need to change when the database adapter lands.

## Admin authentication boundary

The preview uses a first-party signed session so local development is not
blocked on a hosted identity provider. Credentials are supplied only through
`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET`; the password is
never stored in source control. Both the protected layout and every write
action verify the session on the server. The session module is intentionally
isolated so production can move to Clerk or another managed identity provider
without changing the content repository or editor pages.

## Next implementation slice

1. Provision PostgreSQL, deploy the initial migration and seed the five verified samples.
2. Connect the existing product editor to the provisioned database and verify publish-to-public-page revalidation.
3. Import the full product and article catalogue.
4. Add inquiry persistence, email delivery, rate limits and audit logs.
5. Replace preview credentials with managed production identity, roles and account recovery.
6. Generate and verify the complete legacy redirect map.
