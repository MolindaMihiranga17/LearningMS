"use client";

import { startImpersonation } from "@/lib/actions/impersonation.actions";
import { Button } from "@/components/ui/button";

export function ImpersonateButton({ instituteAdminUserId }: { instituteAdminUserId: string }) {
  return <form action={startImpersonation}><input type="hidden" name="instituteAdminUserId" value={instituteAdminUserId} /><Button type="submit" size="sm" variant="outline">Impersonate</Button></form>;
}
