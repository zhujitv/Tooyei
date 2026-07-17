<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Translation provider boundary

- Product translation jobs must depend on the `TranslationProvider` interface, never a vendor SDK or vendor endpoint directly.
- Add provider-specific request and response handling only under `src/lib/translation-providers/` and register the adapter in `registry.ts`.
- Keep provider, base URL, model, response format, timeout, and API credentials in server-only environment variables. Never expose or commit provider secrets.
- Preserve provider and model metadata on each translation job so historical runs remain auditable.
