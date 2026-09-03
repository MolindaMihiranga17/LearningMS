import "server-only";

export type PayhereMode = "sandbox" | "production";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

function publicHttpsUrl(name: string) {
  const value = required(name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS`);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") throw new Error(`${name} must be publicly reachable`);
  return url.toString();
}

/** Read payment credentials only at the server-side checkout/webhook boundary. */
export function getPayhereConfig() {
  const modeValue = process.env.PAYHERE_MODE?.trim().toLowerCase() || "sandbox";
  if (modeValue !== "sandbox" && modeValue !== "production") throw new Error("PAYHERE_MODE must be sandbox or production");

  return {
    mode: modeValue as PayhereMode,
    merchantId: required("PAYHERE_MERCHANT_ID"),
    merchantSecret: required("PAYHERE_MERCHANT_SECRET"),
    notifyUrl: publicHttpsUrl("PAYHERE_NOTIFY_URL"),
    returnUrl: publicHttpsUrl("PAYHERE_RETURN_URL"),
    cancelUrl: publicHttpsUrl("PAYHERE_CANCEL_URL"),
  };
}
