export const createErrorId = () => crypto.randomUUID();

export async function withGeneratedErrorId<T, F>(
  load: () => Promise<T>,
  recover: (errorId: string, error: unknown) => F,
): Promise<T | F> {
  try {
    return await load();
  } catch (error) {
    const errorId = createErrorId();
    return recover(errorId, error);
  }
}
