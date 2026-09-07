import { redirect } from "next/navigation";

/** Legacy public URL kept so existing links continue to reach the catalogue. */
export default function PricingRedirectPage() {
  redirect("/plans");
}
