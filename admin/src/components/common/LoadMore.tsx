/**
 * Infinite lists load their next page once this row at the bottom comes on
 * screen — when the reader reaches the end, not before.
 */
export const LOAD_MORE_MARGIN = "0px 0px 40px 0px";

/** Waits at least `ms` for `promise`, so a fast page still shows its skeleton rows. */
export async function atLeast<T>(promise: Promise<T>, ms = 400): Promise<T> {
  const [value] = await Promise.all([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
  return value;
}
