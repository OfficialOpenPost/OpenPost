/**
 * Safe pagination helpers.
 *
 * `parseInt("abc")` returns NaN and `Math.min/max` propagate NaN, which used
 * to flow straight into Prisma `take`/`skip` as `NaN` and blow up the query
 * (500) — a cheap denial-of-service via `?limit=abc`. These helpers always
 * return a sane, clamped integer.
 */

export function parseBoundedInt(raw: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  const int = Math.trunc(parsed);
  if (int < min) return min;
  if (int > max) return max;
  return int;
}

/** Offset/skip variant — clamps to >= 0 with a hard upper bound. */
export function parseOffset(raw: string | null, max = 1_000_000): number {
  return parseBoundedInt(raw, 0, 0, max);
}
