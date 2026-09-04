import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** PayHere expects a two-decimal amount in both its checkout form and hash. */
export function formatPayhereAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("The selected plan has an invalid price.");
  }

  return amount.toFixed(2);
}

/**
 * The checkout hash is intentionally generated only on the server. PayHere
 * requires the secret to be MD5 hashed, uppercased, and then included in the
 * final uppercased MD5 digest.
 */
export function createPayhereCheckoutHash({
  merchantId,
  orderId,
  amount,
  currency,
  merchantSecret,
}: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  merchantSecret: string;
}): string {
  const secretHash = createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
  return createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${secretHash}`)
    .digest("hex")
    .toUpperCase();
}

/** Verify the checksum PayHere sends with its server-to-server notification. */
export function verifyPayhereNotificationHash({
  merchantId,
  orderId,
  amount,
  currency,
  statusCode,
  merchantSecret,
  signature,
}: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  statusCode: string;
  merchantSecret: string;
  signature: string;
}): boolean {
  const secretHash = createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
  const expected = createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`)
    .digest("hex")
    .toUpperCase();
  const received = signature.toUpperCase();
  return received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

/** Unique, provider-safe ID for a server-created payment record. */
export function createPayhereOrderId(): string {
  return `LMS-${Date.now()}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export function buyerNames(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Institute",
    lastName: parts.slice(1).join(" ") || "Admin",
  };
}
