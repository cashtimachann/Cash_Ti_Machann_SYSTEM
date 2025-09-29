// Shared date/time utilities
// Render timestamps in the user's local timezone with stable formatting

export type InputDate = string | number | Date | null | undefined

export const formatDateTimeLocal = (input: InputDate, options?: Intl.DateTimeFormatOptions): string => {
  if (!input) return 'Dat pa disponib'
  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input
  if (!d || isNaN(d.getTime())) return 'Dat pa disponib'
  // Default: e.g., 27 Sep 2025, 14:05
  const fmt: Intl.DateTimeFormatOptions = options ?? {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
  try {
    return new Intl.DateTimeFormat(undefined, fmt).format(d)
  } catch {
    return d.toLocaleString()
  }
}

// When backend returns unix seconds, convert to ms
export const fromUnixSeconds = (sec?: number | null): Date | null => {
  if (!sec && sec !== 0) return null
  const ms = sec * 1000
  const d = new Date(ms)
  return isNaN(d.getTime()) ? null : d
}

// Convenience: take either ISO string or unix seconds in `timestamp` field
export const formatActivityTime = (activity: any): string => {
  if (!activity) return 'Dat pa disponib'
  const ts = activity.timestamp
  // Prefer unix seconds if present
  if (typeof ts === 'number') {
    const d = fromUnixSeconds(ts)
    return formatDateTimeLocal(d)
  }
  // Fallback to any ISO-like string time fields
  const maybe = activity.created_at || activity.time || activity.timestamp
  return formatDateTimeLocal(maybe)
}
