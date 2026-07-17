-- Record the adapter used for every translation batch so provider changes do
-- not make historical jobs ambiguous.
ALTER TABLE "ProductTranslationJob"
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'openai-responses';
