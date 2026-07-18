export const mapWithRecordIsolation = <T, R>(
  records: readonly T[],
  normalize: (record: T) => R,
  recover: (record: T, error: unknown) => R,
) => records.map((record) => {
  try {
    return normalize(record);
  } catch (error) {
    return recover(record, error);
  }
});
