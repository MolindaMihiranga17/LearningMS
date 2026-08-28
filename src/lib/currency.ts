export const PLATFORM_CURRENCY = "LKR";

export function formatLkr(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: PLATFORM_CURRENCY,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}
