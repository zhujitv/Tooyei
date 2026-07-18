# Translation provider architecture

The product translation workflow is vendor-neutral. Product selection, source
content assembly, validation, persistence, retries and human review do not call
an AI vendor directly.

## Boundary

```text
Product translation job
        |
Product translation service
        |
TranslationProvider interface
        |
Provider registry
        |
Volcengine Doubao model router
        |                  |
Seed Translation      Historical general models
(Responses API)       (OpenAI-compatible transport)
```

The service sends every adapter the same request contract:

- system prompt;
- serialized source product;
- output schema and schema name;
- maximum output token budget.
- source and target language codes;
- matching building-material glossary terms.

Every adapter returns the same result:

- response ID;
- JSON text;
- input token count;
- output token count.

Validation, stable-ID checks and database writes happen after the adapter
returns, so changing providers cannot bypass product-content safety checks.

## Runtime configuration

```dotenv
DOUBAO_API_KEY=""
DOUBAO_API_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
DOUBAO_MODEL="doubao-seed-translation-250915"
DOUBAO_RESPONSE_FORMAT="json_object"
DOUBAO_REQUEST_TIMEOUT_MS="90000"
DOUBAO_TRANSLATION_CONCURRENCY="6"
```

The translation center creates new jobs only with `volcengine-doubao`. When the
recorded model belongs to the `Doubao-Seed-Translation` family, the registry
uses the Ark Responses translation contract. It sends every visitor-facing
field with explicit source/target language codes, protects matched terminology,
and reconstructs the JSON in application code. IDs are never sent as text to
translate. Older Doubao models continue to use the OpenAI-compatible structured
generation adapter.

Restart or redeploy after changing Vercel runtime environment variables. The
translation center shows the Doubao configuration state and does not expose a
provider selector.

## Adding a non-compatible provider

1. Implement `TranslationProvider` in `src/lib/translation-providers/`.
2. Keep all vendor request and response mapping inside that adapter.
3. Add its ID and factory to the provider types, config and registry.
4. Do not import the adapter from product jobs or admin routes.
5. Add configuration validation and a mocked adapter contract test.
6. Verify response IDs, usage fields, refusal handling and timeout behavior.

## Job consistency

Each job stores its provider and model. The runner resolves that exact model and
adapter instead of requiring it to match the current default. Changing
`DOUBAO_MODEL` affects only newly created jobs; queued and historical jobs keep
their recorded model. A job stops only when its recorded provider can no longer
be authenticated or resolved.

## Durable Translation Worker

Each product-language item is claimed independently. The persisted worker
metadata includes its structured content types, current processing step,
heartbeat, worker ID and next retry time. A failure on one item never prevents
another due item in the same batch from being claimed.

The admin runner and the scheduled `/api/cron/translation-worker` endpoint use
the same claim function. Set `CRON_SECRET` in the server environment and keep
the Vercel Cron schedule enabled. The worker:

- caps every provider call at 90 seconds;
- updates heartbeats every 30 seconds;
- releases `RUNNING` locks after five minutes without a heartbeat;
- persists up to three retries at 10, 30 and 120 second intervals;
- reports `PENDING`, `QUEUED`, `PROCESSING`, `SUCCESS`, `FAILED`, `RETRYING`
  and `CANCELLED` without destructively rewriting historical database statuses;
- records `PRODUCT`, `MEDIA_ALT`, `MEDIA_CAPTION`, `FEATURE_TITLE`,
  `FEATURE_DESCRIPTION`, `SPEC_LABEL`, `SPEC_VALUE`, `APPLICATION_TITLE`,
  `APPLICATION_DESCRIPTION`, `DOWNLOAD_TITLE` and `SEO` as the structured
  content contract for every item. Historical coarse-grained type names remain
  readable for compatibility.

## Secrets

Provider keys are server-only. Store them as encrypted Vercel environment
variables. Never use a `NEXT_PUBLIC_` prefix and never write real values to
`.env.example`, source files, logs, audit metadata or database records.
