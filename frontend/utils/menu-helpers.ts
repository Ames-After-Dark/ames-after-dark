
/**
 * Formats a price value into a standardized string format.
 * Handles various input formats, including strings with currency symbols and numbers.
 */
export const formatPrice = (value?: string | number | null) => {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const numeric = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return raw;
  return `$${numeric.toFixed(2)}`;
};