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
   |                 |
OpenAI Responses   OpenAI-compatible Chat Completions
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
TRANSLATION_PROVIDER="openai-responses"
TRANSLATION_API_KEY=""
TRANSLATION_API_BASE_URL="https://api.openai.com/v1"
TRANSLATION_MODEL="gpt-5.6-sol"
TRANSLATION_RESPONSE_FORMAT="json_schema"
TRANSLATION_REQUEST_TIMEOUT_MS="110000"
```

Included provider IDs:

- `openai-responses`: calls `{baseUrl}/responses` with strict Structured Outputs.
- `openai-compatible`: calls `{baseUrl}/chat/completions`. It supports
  `json_schema` and the more widely supported `json_object` response mode.

For a compatible vendor, set its API base URL, API key and model. Use
`TRANSLATION_RESPONSE_FORMAT=json_object` when that provider does not implement
JSON Schema response formats. Restart or redeploy after changing Vercel runtime
environment variables.

## Adding a non-compatible provider

1. Implement `TranslationProvider` in `src/lib/translation-providers/`.
2. Keep all vendor request and response mapping inside that adapter.
3. Add its ID and factory to the provider types, config and registry.
4. Do not import the adapter from product jobs or admin routes.
5. Add configuration validation and a mocked adapter contract test.
6. Verify response IDs, usage fields, refusal handling and timeout behavior.

## Job consistency

Each job stores its provider and model. A queued job will stop with an explicit
error when the runtime provider or model no longer matches its recorded values.
This prevents a provider switch from silently changing the meaning, cost or
quality profile of an existing batch.

## Secrets

Provider keys are server-only. Store them as encrypted Vercel environment
variables. Never use a `NEXT_PUBLIC_` prefix and never write real values to
`.env.example`, source files, logs, audit metadata or database records.
