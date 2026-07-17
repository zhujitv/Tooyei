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
Volcengine Doubao
 (OpenAI-compatible transport)
```

The service sends every adapter the same request:

- system prompt;
- serialized source product;
- output schema and schema name;
- maximum output token budget.

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
DOUBAO_MODEL="doubao-seed-2-0-lite-260215"
DOUBAO_RESPONSE_FORMAT="json_object"
DOUBAO_REQUEST_TIMEOUT_MS="90000"
```

The translation center creates new jobs only with `volcengine-doubao`. It uses
the official OpenAI Node SDK compatibility transport,
  with the Ark base URL, a Doubao model or endpoint ID, and a separate API key.
  It defaults to `json_object`, then applies the shared Zod validation and
  stable-ID checks before any database write.

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

Each job stores its provider and model. The runner resolves that exact adapter
instead of the current default, including for historical jobs created before
the translation center was limited to Doubao. A queued job stops with an
explicit error if its recorded provider is no longer configured or its model
changed. This prevents a provider switch from silently changing the meaning,
cost or quality profile of an existing batch.

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
