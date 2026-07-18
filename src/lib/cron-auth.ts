export function isCronAuthorizationValid(authorization: string | null, secret: string | undefined) {
  const normalizedSecret = secret?.trim();
  return Boolean(normalizedSecret) && authorization === `Bearer ${normalizedSecret}`;
}
